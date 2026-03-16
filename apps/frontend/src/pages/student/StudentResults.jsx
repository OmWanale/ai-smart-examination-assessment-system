import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState } from '../../components/UI.jsx';
import { submissionAPI } from '../../api/client';

export function StudentResults() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await submissionAPI.getStudentSubmissions();
      const data = response.data?.data?.submissions || response.data?.submissions || [];
      setSubmissions(data);
    } catch (err) {
      console.error('StudentResults load error:', err);
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreBadge = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return 'success';
    if (pct >= 70) return 'primary';
    if (pct >= 50) return 'warning';
    return 'error';
  };

  const getGrade = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  // Compute summary stats
  const totalAttempted = submissions.length;
  const avgPercentage = totalAttempted > 0
    ? (submissions.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0) / totalAttempted).toFixed(1)
    : 0;
  const bestScore = totalAttempted > 0
    ? Math.max(...submissions.map(s => parseFloat(s.percentage || 0))).toFixed(1)
    : 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="My Results"
          subtitle="View all your quiz attempts and scores"
          action={
            <Button variant="ghost" size="sm" onClick={loadResults}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            </Button>
          }
        />

        {error && (
          <Alert type="error" className="mb-6">{error}</Alert>
        )}

        {/* Stats */}
        {!isLoading && submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
                {totalAttempted}
              </div>
              <p className="text-text-muted dark:text-slate-400 text-sm">Quizzes Attempted</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-display font-bold text-secondary-600 dark:text-secondary-400">
                {avgPercentage}%
              </div>
              <p className="text-text-muted dark:text-slate-400 text-sm">Average Score</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400">
                {bestScore}%
              </div>
              <p className="text-text-muted dark:text-slate-400 text-sm">Best Score</p>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner size="xl" />
              <p className="text-text-muted dark:text-slate-400 mt-4">Loading results...</p>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="No results yet"
              description="Complete a quiz to see your results here"
              action={
                <Link to="/student/classes">
                  <Button>Browse Classes</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="space-y-3">
              {submissions.map((sub) => {
                const pct = parseFloat(sub.percentage || 0);
                const quizId = sub.quiz?.id || sub.quiz?._id;

                return (
                  <div
                    key={sub.id || sub._id}
                    className="flex items-center gap-4 p-4 bg-bg-light dark:bg-dark-hover rounded-xl hover:shadow-warm transition-all duration-200"
                  >
                    {/* Grade circle */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-display font-bold shadow-md text-white ${
                      pct >= 90 ? 'bg-gradient-to-br from-success-400 to-success-600' :
                      pct >= 70 ? 'bg-gradient-to-br from-primary-400 to-primary-600' :
                      pct >= 50 ? 'bg-gradient-to-br from-warning-400 to-warning-600' :
                      'bg-gradient-to-br from-error-400 to-error-600'
                    }`}>
                      {getGrade(sub.percentage)}
                    </div>

                    {/* Quiz info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-dark dark:text-slate-100 truncate">
                        {sub.quiz?.title || 'Unknown Quiz'}
                      </h3>
                      <p className="text-xs text-text-muted dark:text-slate-400">
                        {sub.quiz?.className || 'Unknown Class'} &middot; {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unknown'}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xl font-display font-bold text-text-dark dark:text-slate-100">
                        {sub.score}/{sub.totalQuestions}
                      </div>
                      <Badge variant={getScoreBadge(sub.percentage)} size="sm">
                        {pct}%
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {quizId && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/quiz/${quizId}/review`)}
                            title="Review answers"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/quiz/${quizId}/leaderboard`)}
                            title="View leaderboard"
                          >
                            🏆
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
