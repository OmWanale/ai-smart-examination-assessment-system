import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert } from '../../components/UI.jsx';
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
      setQuiz(response.data);
      // Initialize answers object
      const initialAnswers = {};
      response.data.questions?.forEach((_, idx) => {
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

    setIsSubmitting(true);
    try {
      const result = await submitQuiz(quizId, finalAnswers);
      if (result.success) {
        setHasSubmitted(true);
        navigate(`/student/quiz/${quizId}/result`, {
          state: { submissionId: result.data._id },
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
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

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header with timer and progress */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text-dark">{quiz.title}</h2>
            <p className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          {timeLeft !== null && (
            <div className={`text-right ${timeWarning ? 'text-red-600' : 'text-gray-600'}`}>
              <div className={`text-2xl font-bold ${timeWarning ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-gray-500">Time remaining</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 h-1">
          <div
            className="bg-primary-600 h-1 transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <MainLayout>
        <div className="max-w-4xl mx-auto py-8">
          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Question Card */}
          <Card className="mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text-dark mb-4">
                {currentQ?.question}
              </h3>

              <div className="space-y-3">
                {currentQ?.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion] === idx
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={answers[currentQuestion] === idx}
                      onChange={() => handleAnswerChange(currentQuestion, idx)}
                      className="w-4 h-4 text-primary-600 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                ← Previous
              </Button>

              <div className="text-sm text-gray-600">
                Answered: <strong>{answeredCount}</strong> / {questions.length}
              </div>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(answers)}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Submitting...
                    </span>
                  ) : (
                    '✓ Submit Quiz'
                  )}
                </Button>
              ) : (
                <Button
                  disabled={currentQuestion === questions.length - 1}
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next →
                </Button>
              )}
            </div>
          </Card>

          {/* Question List */}
          <Card>
            <h4 className="font-semibold text-text-dark mb-3">All Questions</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`aspect-square rounded-lg font-medium transition-all ${
                    currentQuestion === idx
                      ? 'bg-primary-600 text-white scale-110'
                      : answers[idx] !== null
                      ? 'bg-green-200 text-green-900 hover:bg-green-300'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </MainLayout>
    </div>
  );
}
