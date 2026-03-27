import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, ProgressBar } from '../../components/UI.jsx';
import { submissionAPI, quizAPI } from '../../api/client';

export function QuizResult() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state (passed from QuizAttempt)
  const stateSubmission = location.state?.submission;
  const stateQuiz = location.state?.quiz;
  const submissionId = location.state?.submissionId;

  const [submission, setSubmission] = useState(stateSubmission || null);
  const [quiz, setQuiz] = useState(stateQuiz || null);
  const [isLoading, setIsLoading] = useState(!stateSubmission || !stateQuiz);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if we don't have the data from state
    if (!stateSubmission || !stateQuiz) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, submissionId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subResponse, quizResponse] = await Promise.all([
        submissionId ? submissionAPI.getSubmission(submissionId) : Promise.resolve(null),
        quizAPI.getQuiz(quizId),
      ]);

      if (subResponse) {
        // Extract submission from nested response
        const submissionData = subResponse.data?.data?.submission || subResponse.data?.submission || subResponse.data;
        console.log('QuizResult: loaded submission:', submissionData);
        setSubmission(submissionData);
      }
      // Extract quiz from nested response
      const quizData = quizResponse.data?.data?.quiz || quizResponse.data?.quiz || quizResponse.data;
      console.log('QuizResult: loaded quiz:', quizData);
      setQuiz(quizData);
    } catch (err) {
      console.error('QuizResult: load error:', err);
      setError(err.response?.data?.message || 'Failed to load result');
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
            <p className="text-text-muted dark:text-slate-400 mt-4">Loading result...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error || 'Result not found'}
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  if (!submission) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            Submission not found
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  // Use submission's percentage if available, otherwise calculate
  const totalQuestions = submission.totalQuestions || quiz.questions?.length || 1;
  const percentage = submission.percentage 
    ? parseFloat(submission.percentage) 
    : ((submission.score / totalQuestions) * 100).toFixed(1);
  const passed = percentage >= 70;

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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
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
            <p className="text-text-muted dark:text-slate-400">
              You answered <strong className="text-text-dark dark:text-slate-200">{submission.score}</strong> out of <strong className="text-text-dark dark:text-slate-200">{totalQuestions}</strong> questions correctly
            </p>
          </div>
        </Card>

        {/* Score Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400 mb-1">
              {submission.score}
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm">Correct Answers</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error-400 to-error-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-error-600 dark:text-error-400 mb-1">
              {totalQuestions - submission.score}
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm">Incorrect Answers</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400 mb-1">
              {Math.floor((submission.timeSpent || 0) / 60)}m
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm">Time Spent</p>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <Card className="mb-6">
          <h3 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-6 flex items-center gap-2">
            <span>📊</span> Performance Breakdown
          </h3>

          <div className="space-y-6">
            {/* Correct */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted dark:text-slate-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success-500"></span>
                  Correct Answers
                </span>
                <Badge variant="success">{submission.score}</Badge>
              </div>
              <ProgressBar 
                value={submission.score} 
                max={totalQuestions} 
                variant="success"
              />
            </div>

            {/* Incorrect */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted dark:text-slate-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error-500"></span>
                  Incorrect Answers
                </span>
                <Badge variant="error">{totalQuestions - submission.score}</Badge>
              </div>
              <ProgressBar 
                value={totalQuestions - submission.score} 
                max={totalQuestions} 
                variant="error"
              />
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <h3 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>📋</span> Quiz Details
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-primary-100 dark:border-dark-border">
              <span className="text-text-muted dark:text-slate-400">Submitted at</span>
              <span className="font-medium text-text-dark dark:text-slate-200">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
            </div>
            {quiz.difficulty && (
              <div className="flex justify-between items-center py-2 border-b border-primary-100 dark:border-dark-border">
                <span className="text-text-muted dark:text-slate-400">Difficulty</span>
                <Badge variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'medium' ? 'warning' : 'success'}>
                  {quiz.difficulty}
                </Badge>
              </div>
            )}
            {(quiz.durationMinutes || quiz.timeLimit) && (
              <div className="flex justify-between items-center py-2">
                <span className="text-text-muted dark:text-slate-400">Time Limit</span>
                <span className="font-medium text-text-dark dark:text-slate-200">{quiz.durationMinutes || quiz.timeLimit} minutes</span>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(`/student/class/${quiz.class}`, { replace: true })}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Class
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/student/dashboard', { replace: true })}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/student/quiz/${quizId}/review`}>
              <Button variant="outline">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Review Answers
                </span>
              </Button>
            </Link>
            {submission && (
              <Link to={`/student/quiz/${quizId}/leaderboard`}>
                <Button>
                  <span className="flex items-center gap-2">
                    View Leaderboard
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
