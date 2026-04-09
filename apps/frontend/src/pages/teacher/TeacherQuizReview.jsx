import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner } from '../../components/UI.jsx';
import { quizAPI } from '../../api/client';

// Question Review Card Component
function QuestionCard({ question, index }) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getDifficultyBadge = (difficulty) => {
    const variants = {
      easy: 'success',
      medium: 'warning',
      hard: 'error',
    };
    return <Badge variant={variants[difficulty] || 'secondary'}>{difficulty}</Badge>;
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-md">
            {index + 1}
          </div>
          <div>
            <span className="text-sm text-neutral-500 dark:text-slate-400">Question {index + 1}</span>
            {question.difficulty && (
              <div className="mt-1">{getDifficultyBadge(question.difficulty)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Question Text */}
      <p className="text-lg font-medium text-text-dark dark:text-slate-100 mb-4">
        {question.questionText}
      </p>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {question.options.map((option, oIdx) => {
          const isCorrect = oIdx === question.correctOptionIndex;
          
          return (
            <div
              key={oIdx}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isCorrect
                  ? 'bg-success-50 dark:bg-success-100 border-success-400 dark:border-success-300'
                  : 'bg-neutral-50 dark:bg-dark-hover border-neutral-200 dark:border-dark-border'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                isCorrect
                  ? 'bg-success-500 text-white'
                  : 'bg-neutral-200 dark:bg-dark-border text-neutral-600 dark:text-slate-400'
              }`}>
                {String.fromCharCode(65 + oIdx)}
              </div>
              <span className={`flex-1 ${
                isCorrect
                  ? 'font-medium'
                  : 'text-neutral-700 dark:text-slate-100'
              }`}
              style={isCorrect ? { color: '#111111' } : undefined}>
                {option}
              </span>
              {isCorrect && (
                <div className="flex items-center gap-1" style={{ color: '#111111' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">Correct</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Toggle */}
      {question.explanation && (
        <div className="border-t border-neutral-200 dark:border-dark-border pt-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
          
          {showExplanation && (
            <div className="mt-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">Explanation</span>
                  <p className="mt-1 text-primary-800 dark:text-primary-200">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function TeacherQuizReview() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await quizAPI.getQuizForTeacher(quizId);
      const quizData = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('TeacherQuizReview: loaded quiz:', quizData);
      setQuiz(quizData);
    } catch (err) {
      console.error('TeacherQuizReview: load error:', err);
      setError(err.response?.data?.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-neutral-500 dark:text-slate-400 mt-4">Loading quiz...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" className="mb-4">
            {error || 'Quiz not found'}
          </Alert>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Class
        </button>

        {/* Quiz Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-white/80 text-sm mt-1">{quiz.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quiz Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
              {quiz.questionCount}
            </div>
            <p className="text-sm text-neutral-500 dark:text-slate-400">Questions</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-secondary-600 dark:text-secondary-400">
              {quiz.durationMinutes}
            </div>
            <p className="text-sm text-neutral-500 dark:text-slate-400">Minutes</p>
          </Card>
          <Card className="text-center">
            <Badge variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'medium' ? 'warning' : 'success'} className="text-lg px-4 py-1">
              {quiz.difficulty}
            </Badge>
            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Difficulty</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400">
              {quiz.submissionCount || 0}
            </div>
            <p className="text-sm text-neutral-500 dark:text-slate-400">Submissions</p>
          </Card>
        </div>

        {/* Visibility Settings */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4">Student Review Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${quiz.showResultsToStudents ? 'bg-success-500' : 'bg-error-500'}`} />
              <span className="text-neutral-600 dark:text-slate-400">
                Show Results: <strong>{quiz.showResultsToStudents ? 'Yes' : 'No'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${quiz.showCorrectAnswers ? 'bg-success-500' : 'bg-error-500'}`} />
              <span className="text-neutral-600 dark:text-slate-400">
                Show Answers: <strong>{quiz.showCorrectAnswers ? 'Yes' : 'No'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${quiz.showExplanations ? 'bg-success-500' : 'bg-error-500'}`} />
              <span className="text-neutral-600 dark:text-slate-400">
                Show Explanations: <strong>{quiz.showExplanations ? 'Yes' : 'No'}</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>📝</span> Questions
          </h3>
          {quiz.questions && quiz.questions.map((question, index) => (
            <QuestionCard key={index} question={question} index={index} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/quiz/${quizId}/leaderboard`)}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Leaderboard
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Back to Class
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
