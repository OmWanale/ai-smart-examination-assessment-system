import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState, Avatar } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { useAuthStore } from '../../store/authStore';
import { quizAPI } from '../../api/client';

export function Leaderboard() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  const { leaderboard, getLeaderboard } = useQuizStore();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    // Find current user's rank if student
    if (isStudent && leaderboard && leaderboard.length > 0 && user) {
      const userIndex = leaderboard.findIndex(
        (s) => s.student?._id === user.id || s.student?.email === user.email
      );
      if (userIndex !== -1) {
        setCurrentUserRank(userIndex + 1);
      }
    }
  }, [leaderboard, isStudent, user]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quizResponse] = await Promise.all([
        quizAPI.getQuiz(quizId),
        getLeaderboard(quizId),
      ]);
      // Extract quiz data from nested response
      const quiz = quizResponse.data?.data?.quiz || quizResponse.data?.quiz || quizResponse.data;
      setQuizData(quiz);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreConfig = (score, maxScore) => {
    if (!maxScore) return { color: 'text-text-muted', bg: 'from-gray-400 to-gray-600' };
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { color: 'text-success-600 dark:text-success-400', bg: 'from-success-400 to-success-600' };
    if (percentage >= 70) return { color: 'text-primary-600 dark:text-primary-400', bg: 'from-primary-400 to-primary-600' };
    if (percentage >= 50) return { color: 'text-warning-600 dark:text-warning-400', bg: 'from-warning-400 to-warning-600' };
    return { color: 'text-error-600 dark:text-error-400', bg: 'from-error-400 to-error-600' };
  };

  const getMedalConfig = (rank) => {
    if (rank === 1) return { icon: '🥇', bg: 'bg-gradient-to-br from-amber-300 to-amber-500', shadow: 'shadow-amber-300/50', textColor: 'text-white' };
    if (rank === 2) return { icon: '🥈', bg: 'bg-gradient-to-br from-gray-300 to-gray-500', shadow: 'shadow-gray-300/50', textColor: 'text-white' };
    if (rank === 3) return { icon: '🥉', bg: 'bg-gradient-to-br from-orange-300 to-orange-600', shadow: 'shadow-orange-300/50', textColor: 'text-white' };
    return { icon: `${rank}`, bg: 'bg-stone-100 dark:bg-dark-hover', shadow: '', textColor: 'text-text-muted dark:text-stone-400' };
  };

  const isCurrentUser = (submission) => {
    if (!user || !submission.student) return false;
    return submission.student._id === user.id || submission.student.email === user.email;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-text-muted dark:text-stone-400 mt-4">Loading leaderboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
          <Button onClick={() => navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  const maxScore = quizData?.questions?.length || quizData?.totalMarks || 0;
  const avgScore = leaderboard && leaderboard.length > 0 && maxScore > 0
    ? ((leaderboard.reduce((sum, s) => sum + (s.score || 0), 0) / (leaderboard.length * maxScore)) * 100).toFixed(1)
    : 0;

  // Determine back navigation based on role
  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/student/dashboard';
  const classPath = quizData?.class 
    ? (isTeacher ? `/teacher/class/${quizData.class}` : `/student/class/${quizData.class}`)
    : null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted dark:text-stone-400 mb-4">
          <Link to={dashboardPath} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Dashboard
          </Link>
          {classPath && (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link to={classPath} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Class
              </Link>
            </>
          )}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text-dark dark:text-stone-200">Leaderboard</span>
        </div>

        <PageHeader
          title={quizData?.title || 'Quiz Leaderboard'}
          subtitle={isStudent ? "See how you rank against other students" : "View student submissions and rankings"}
          icon={
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          }
        />

        {/* Current User Rank Card (for students) */}
        {isStudent && currentUserRank && (
          <Card className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-2 border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${getMedalConfig(currentUserRank).bg} flex items-center justify-center text-3xl shadow-lg`}>
                  {getMedalConfig(currentUserRank).icon}
                </div>
                <div>
                  <p className="text-sm text-text-muted dark:text-stone-400">Your Rank</p>
                  <p className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
                    #{currentUserRank} <span className="text-lg font-normal text-text-muted dark:text-stone-400">of {leaderboard.length}</span>
                  </p>
                </div>
              </div>
              {leaderboard[currentUserRank - 1] && (
                <div className="text-right">
                  <p className="text-sm text-text-muted dark:text-stone-400">Your Score</p>
                  <p className={`text-3xl font-display font-bold ${getScoreConfig(leaderboard[currentUserRank - 1].score, maxScore).color}`}>
                    {leaderboard[currentUserRank - 1].score}/{maxScore}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Quiz Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-2 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
              {leaderboard?.length || 0}
            </div>
            <p className="text-text-muted dark:text-stone-400 text-xs">Participants</p>
          </Card>
          <Card className="text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center mx-auto mb-2 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-display font-bold text-secondary-600 dark:text-secondary-400">{maxScore}</div>
            <p className="text-text-muted dark:text-stone-400 text-xs">Max Score</p>
          </Card>
          <Card className="text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-2 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-2xl font-display font-bold text-success-600 dark:text-success-400">
              {avgScore}%
            </div>
            <p className="text-text-muted dark:text-stone-400 text-xs">Avg Score</p>
          </Card>
          <Card className="text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center mx-auto mb-2 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-2xl font-display font-bold text-warning-600 dark:text-warning-400 capitalize">
              {quizData?.difficulty || 'Medium'}
            </div>
            <p className="text-text-muted dark:text-stone-400 text-xs">Difficulty</p>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-stone-100 flex items-center gap-2">
              <span>🏆</span> Rankings
            </h2>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            </Button>
          </div>

          {!leaderboard || leaderboard.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="No submissions yet"
              description={isTeacher ? "Students haven't started taking this quiz." : "Be the first to complete this quiz!"}
            />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((submission, index) => {
                const rank = submission.rank || index + 1;
                const medal = getMedalConfig(rank);
                const scoreConfig = getScoreConfig(submission.score, maxScore);
                const percentage = maxScore > 0 ? ((submission.score / maxScore) * 100).toFixed(1) : 0;
                const isMe = isCurrentUser(submission);

                return (
                  <div
                    key={submission._id || index}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                      isMe
                        ? 'bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 border-2 border-primary-300 dark:border-primary-700 shadow-lg'
                        : rank <= 3 
                          ? 'bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/20 dark:to-transparent border border-primary-100 dark:border-primary-900/30' 
                          : 'bg-bg-light dark:bg-dark-hover hover:shadow-warm'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-xl ${medal.bg} ${medal.shadow} flex items-center justify-center text-xl font-display font-bold shadow-md ${medal.textColor}`}>
                      {medal.icon}
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar name={submission.student?.name || submission.student?.email || 'Student'} size="md" />
                      <div>
                        <p className={`font-semibold ${isMe ? 'text-primary-700 dark:text-primary-300' : 'text-text-dark dark:text-stone-100'}`}>
                          {submission.student?.name || submission.student?.email || 'Anonymous'}
                          {isMe && <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-text-muted dark:text-stone-400">
                          {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Time not recorded'}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-2xl font-display font-bold ${scoreConfig.color}`}>
                        {submission.score}/{maxScore}
                      </div>
                      <Badge variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'} size="sm">
                        {percentage}%
                      </Badge>
                    </div>

                    {/* Time */}
                    {submission.timeTakenMinutes !== undefined && submission.timeTakenMinutes !== null && (
                      <div className="text-center min-w-[80px]">
                        <Badge variant="neutral">
                          ⏱️ {formatTime(submission.timeTakenMinutes)}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </span>
          </Button>
          {classPath && (
            <Button variant="outline" onClick={() => navigate(classPath)}>
              <span className="flex items-center gap-2">
                View Class
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
