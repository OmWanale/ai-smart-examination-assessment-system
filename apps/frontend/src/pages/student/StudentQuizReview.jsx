import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, ProgressBar } from '../../components/UI.jsx';
import { quizAPI } from '../../api/client';

// Question Review Card Component for Student
function StudentQuestionCard({ question, index, showCorrectAnswers, showExplanations }) {
  const [showExplanation, setShowExplanation] = useState(false);

  const selectedIndex = question.selectedOptionIndex;
  const correctIndex = question.correctOptionIndex;
  const isCorrect = question.isCorrect;

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold shadow-md ${
            isCorrect 
              ? 'bg-gradient-to-br from-success-500 to-success-600 text-white' 
              : 'bg-gradient-to-br from-error-500 to-error-600 text-white'
          }`}>
            {index + 1}
          </div>
          <div>
            <span className="text-sm text-neutral-500 dark:text-slate-400">Question {index + 1}</span>
            <div className="mt-1">
              {isCorrect ? (
                <Badge variant="success">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Correct
                  </span>
                </Badge>
              ) : (
                <Badge variant="error">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Incorrect
                  </span>
                </Badge>
              )}
            </div>
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
          const isSelected = oIdx === selectedIndex;
          const isCorrectOption = showCorrectAnswers && oIdx === correctIndex;
          const isWrongSelection = isSelected && !isCorrect;
          
          let bgClass = 'bg-neutral-50 dark:bg-dark-hover border-neutral-200 dark:border-dark-border';
          let textClass = 'text-neutral-700 dark:text-slate-100';
          
          if (isCorrectOption) {
            bgClass = 'bg-success-50 dark:bg-success-100 border-success-400 dark:border-success-300';
            textClass = 'font-medium';
          } else if (isWrongSelection) {
            bgClass = 'bg-error-50 dark:bg-error-900/20 border-error-400 dark:border-error-600';
            textClass = 'text-error-700 dark:text-error-400';
          } else if (isSelected && isCorrect) {
            bgClass = 'bg-success-50 dark:bg-success-100 border-success-400 dark:border-success-300';
            textClass = 'font-medium';
          }
          
          return (
            <div
              key={oIdx}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${bgClass}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                isCorrectOption
                  ? 'bg-success-500 text-white'
                  : isWrongSelection
                    ? 'bg-error-500 text-white'
                    : isSelected && isCorrect
                      ? 'bg-success-500 text-white'
                      : 'bg-neutral-200 dark:bg-dark-border text-neutral-600 dark:text-slate-400'
              }`}>
                {String.fromCharCode(65 + oIdx)}
              </div>
              <span
                className={`flex-1 ${textClass}`}
                style={isCorrectOption || (isSelected && isCorrect) || isWrongSelection ? { color: '#111111' } : undefined}
              >
                {option}
              </span>
              <div className="flex items-center gap-2">
                {isSelected && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-200 dark:bg-dark-border text-neutral-600 dark:text-slate-400">
                    Your Answer
                  </span>
                )}
                {isCorrectOption && (
                  <div className="flex items-center gap-1" style={{ color: '#111111' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation Toggle (only if allowed and available) */}
      {showExplanations && question.explanation && (
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

export function StudentQuizReview() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if coming from submission with data
  const stateData = location.state;
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadReview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await quizAPI.getQuizReviewForStudent(quizId);
      const reviewData = response.data?.data || response.data;
      console.log('StudentQuizReview: loaded data:', reviewData);
      setData(reviewData);
    } catch (err) {
      console.error('StudentQuizReview: load error:', err);
      const message = err.response?.data?.message || 'Failed to load quiz review';
      setError(message);
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
            <p className="text-neutral-500 dark:text-slate-400 mt-4">Loading review...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    // If review is not allowed, show score-only view
    if (error.includes('disabled') || error.includes('permission')) {
      return (
        <MainLayout>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Alert type="warning" className="mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                The teacher has disabled detailed review for this quiz.
              </div>
            </Alert>
            
            {stateData?.submission && (
              <Card className="mb-6">
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {stateData.submission.percentage}%
                  </div>
                  <p className="text-neutral-500 dark:text-slate-400">
                    You scored {stateData.submission.score} out of {stateData.submission.totalQuestions}
                  </p>
                </div>
              </Card>
            )}
            
            <Button onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </MainLayout>
      );
    }
    
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  if (!data || !data.quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" className="mb-4">
            Review data not found
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  const { quiz, submission, questions } = data;
  const percentage = parseFloat(submission.percentage).toFixed(1);
  
  const getPerformanceConfig = () => {
    if (percentage >= 90) return { 
      color: 'text-success-600 dark:text-success-400', 
      bg: 'from-success-500 to-success-600',
      label: 'Excellent!',
      emoji: '🏆'
    };
    if (percentage >= 70) return { 
      color: 'text-primary-600 dark:text-primary-400', 
      bg: 'from-primary-500 to-primary-600',
      label: 'Great Job!',
      emoji: '🎉'
    };
    if (percentage >= 50) return { 
      color: 'text-warning-600 dark:text-warning-400', 
      bg: 'from-warning-500 to-warning-600',
      label: 'Good Try!',
      emoji: '💪'
    };
    return { 
      color: 'text-error-600 dark:text-error-400', 
      bg: 'from-error-500 to-error-600',
      label: 'Keep Practicing!',
      emoji: '📚'
    };
  };

  const performance = getPerformanceConfig();
  const correctCount = questions.filter(q => q.isCorrect).length;
  const incorrectCount = questions.length - correctCount;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Result Summary Card */}
        <Card className="mb-6 overflow-hidden">
          <div className={`bg-gradient-to-r ${performance.bg} p-8 -m-6 mb-6`}>
            <div className="text-center text-white">
              <div className="text-6xl mb-4">{performance.emoji}</div>
              <h2 className="text-3xl font-display font-bold mb-2">{quiz.title}</h2>
              <p className="text-xl opacity-90">{performance.label}</p>
            </div>
          </div>
          
          <div className="text-center py-4">
            <div className={`text-6xl font-display font-bold ${performance.color} mb-2`}>
              {percentage}%
            </div>
            <p className="text-neutral-500 dark:text-slate-400">
              You answered <strong className="text-text-dark dark:text-slate-100">{submission.score}</strong> out of <strong className="text-text-dark dark:text-slate-100">{submission.totalQuestions}</strong> questions correctly
            </p>
          </div>
        </Card>

        {/* Score Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400 mb-1">
              {correctCount}
            </div>
            <p className="text-neutral-500 dark:text-slate-400 text-sm">Correct</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error-400 to-error-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-error-600 dark:text-error-400 mb-1">
              {incorrectCount}
            </div>
            <p className="text-neutral-500 dark:text-slate-400 text-sm">Incorrect</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400 mb-1">
              {submission.timeTakenMinutes || '-'}
            </div>
            <p className="text-neutral-500 dark:text-slate-400 text-sm">Minutes</p>
          </Card>
        </div>

        {/* Progress Bars */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
            📊 Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success-500"></span>
                  Correct
                </span>
                <Badge variant="success">{correctCount}</Badge>
              </div>
              <ProgressBar value={correctCount} max={questions.length} variant="success" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error-500"></span>
                  Incorrect
                </span>
                <Badge variant="error">{incorrectCount}</Badge>
              </div>
              <ProgressBar value={incorrectCount} max={questions.length} variant="error" />
            </div>
          </div>
        </Card>

        {/* Questions Review */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
            📝 Question Review
          </h3>
          {!quiz.showCorrectAnswers && !quiz.showExplanations ? (
            <Alert type="info" className="mb-4">
              The teacher has not enabled detailed answer review for this quiz.
            </Alert>
          ) : (
            questions.map((question, index) => (
              <StudentQuestionCard
                key={index}
                question={question}
                index={index}
                showCorrectAnswers={quiz.showCorrectAnswers}
                showExplanations={quiz.showExplanations}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/dashboard')}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </span>
          </Button>
          <Button
            onClick={() => navigate(`/teacher/quiz/${quizId}/leaderboard`)}
          >
            <span className="flex items-center gap-2">
              View Leaderboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
