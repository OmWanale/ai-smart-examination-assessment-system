import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Spinner, Badge, ProgressBar } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { quizAPI } from '../../api/client';

export function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const timerRef = useRef(null);
  const { submitQuiz } = useQuizStore();

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    if (!quiz || hasSubmitted) return;

    // Initialize timer
    const minutes = quiz.timeLimit || 30;
    setTimeLeft(minutes * 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit on timeout
          handleSubmit(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, hasSubmitted]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await quizAPI.getQuiz(quizId);
      // Extract quiz from nested response structure
      const quizData = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('QuizAttempt: loaded quiz data:', quizData);
      setQuiz(quizData);
      // Initialize answers object
      const initialAnswers = {};
      quizData.questions?.forEach((_, idx) => {
        initialAnswers[idx] = null;
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (finalAnswers) => {
    if (isSubmitting || hasSubmitted) return;

    // Transform answers from { questionIndex: selectedOptionIndex } to backend format
    const answersArray = Object.entries(finalAnswers)
      .filter(([_, optionIdx]) => optionIdx !== null)
      .map(([questionIdx, selectedOptionIdx]) => ({
        questionIndex: parseInt(questionIdx, 10),
        selectedOptionIndex: selectedOptionIdx,
      }));

    console.log('QuizAttempt: Submitting quiz', {
      quizId,
      rawAnswers: finalAnswers,
      transformedAnswers: answersArray,
      quizQuestionsCount: quiz?.questions?.length,
    });

    // Validate we have answers for all questions
    if (answersArray.length !== (quiz?.questions?.length || 0)) {
      setError(`Please answer all ${quiz?.questions?.length || 0} questions before submitting.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuiz(quizId, answersArray);
      console.log('QuizAttempt: Submit result:', result);
      if (result.success) {
        setHasSubmitted(true);
        // Backend returns 'id', Mongoose uses '_id'
        const submissionId = result.data?.id || result.data?._id;
        console.log('QuizAttempt: Navigating to result with submissionId:', submissionId);
        // Pass full submission data to avoid needing to fetch it
        navigate(`/student/quiz/${quizId}/result`, {
          state: { 
            submissionId,
            submission: result.data,
            quiz: quiz,
          },
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('QuizAttempt: Submit error:', err);
      setError('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionIdx, optionIdx) => {
    setAnswers({
      ...answers,
      [questionIdx]: optionIdx,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-text-muted dark:text-stone-400 mt-4">Loading quiz...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  if (!quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            Quiz not found
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestion];
  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const timeWarning = timeLeft && timeLeft < 300; // Less than 5 minutes
  const timeCritical = timeLeft && timeLeft < 60; // Less than 1 minute

  return (
    <div className="bg-bg-light dark:bg-dark-bg min-h-screen transition-colors">
      {/* Header with timer and progress */}
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-primary-100 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display font-bold text-text-dark dark:text-stone-100">{quiz.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="sm">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
              <Badge variant={answeredCount === questions.length ? 'success' : 'neutral'} size="sm">
                {answeredCount}/{questions.length} answered
              </Badge>
            </div>
          </div>

          {timeLeft !== null && (
            <div className={`text-right px-4 py-2 rounded-xl ${
              timeCritical 
                ? 'bg-error-50 dark:bg-error-600/20 animate-pulse' 
                : timeWarning 
                  ? 'bg-warning-50 dark:bg-warning-600/20' 
                  : 'bg-primary-50 dark:bg-primary-900/30'
            }`}>
              <div className={`text-2xl font-display font-bold ${
                timeCritical 
                  ? 'text-error-600 dark:text-error-500' 
                  : timeWarning 
                    ? 'text-warning-600 dark:text-warning-500' 
                    : 'text-primary-600 dark:text-primary-400'
              }`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-text-muted dark:text-stone-400">Time remaining</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar 
          value={currentQuestion + 1} 
          max={questions.length} 
          variant="primary"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Question Card */}
        <Card className="mb-6">
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-display font-bold shadow-md flex-shrink-0">
                {currentQuestion + 1}
              </div>
              <h3 className="text-xl font-semibold text-text-dark dark:text-stone-100 flex-1">
                {currentQ?.questionText || currentQ?.question || 'No question text'}
              </h3>
            </div>

            <div className="space-y-3 ml-14">
              {currentQ?.options?.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                    answers[currentQuestion] === idx
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-900/20 dark:border-primary-600 shadow-warm'
                      : 'border-stone-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-dark-hover'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    answers[currentQuestion] === idx
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-stone-300 dark:border-stone-600 group-hover:border-primary-400'
                  }`}>
                    {answers[currentQuestion] === idx && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === idx}
                    onChange={() => handleAnswerChange(currentQuestion, idx)}
                    className="sr-only"
                  />
                  <span className="ml-4 text-text-dark dark:text-stone-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-primary-100 dark:border-dark-border">
            <Button
              variant="ghost"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </span>
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                disabled={isSubmitting || answeredCount < questions.length}
                onClick={() => handleSubmit(answers)}
                variant={answeredCount === questions.length ? 'success' : 'primary'}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" /> Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Quiz
                  </span>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
              >
                <span className="flex items-center gap-2">
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Button>
            )}
          </div>
        </Card>

        {/* Question Navigator */}
        <Card>
          <h4 className="font-display font-semibold text-text-dark dark:text-stone-100 mb-4 flex items-center gap-2">
            <span>📋</span> Question Navigator
          </h4>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded-lg font-medium transition-all duration-200 text-sm ${
                  currentQuestion === idx
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 shadow-warm'
                    : answers[idx] !== null
                    ? 'bg-success-100 dark:bg-success-600/30 text-success-700 dark:text-success-400 hover:scale-105'
                    : 'bg-stone-100 dark:bg-dark-hover text-text-muted dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-dark-border'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary-100 dark:border-dark-border text-xs text-text-muted dark:text-stone-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-primary-500 to-primary-600" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success-100 dark:bg-success-600/30" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-stone-100 dark:bg-dark-hover" />
              <span>Not answered</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
