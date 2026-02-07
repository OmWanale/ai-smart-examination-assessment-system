import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState, Avatar } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI, submissionAPI } from '../../api/client';

export function StudentClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { quizzes, getQuizzesForClass } = useQuizStore();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classResponse] = await Promise.all([classAPI.getClass(classId)]);
      const rawClassData = classResponse.data?.data?.class || classResponse.data?.class || classResponse.data;
      console.log('[StudentClassDetail] Raw class response:', classResponse.data);
      console.log('[StudentClassDetail] Extracted class data:', rawClassData);
      setClassData(rawClassData);

      await getQuizzesForClass(classId);
      const allSubmissions = {};
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error('[StudentClassDetail] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuizStatus = (quiz) => {
    const quizId = quiz.id || quiz._id;
    if (submissions[quizId]) {
      return {
        status: 'submitted',
        score: submissions[quizId].score,
        maxScore: submissions[quizId].maxScore || 0,
      };
    }
    if (quiz.hasSubmitted) {
      return { status: 'submitted', score: 0, maxScore: 0 };
    }
    return { status: 'available' };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-text-muted dark:text-stone-400 mt-4">Loading class details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !classData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error || 'Class not found'}
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted dark:text-stone-400 mb-4">
          <Link to="/student/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text-dark dark:text-stone-200">{classData.name}</span>
        </div>

        {/* Class Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 -m-6 mb-6">
            <h1 className="text-3xl font-display font-bold text-white mb-2">{classData.name}</h1>
            {classData.description && (
              <p className="text-white/80">{classData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={classData.teacher?.email} size="md" />
            <div>
              <p className="text-sm text-text-muted dark:text-stone-400">Taught by</p>
              <p className="font-semibold text-text-dark dark:text-stone-200">{classData.teacher?.email}</p>
            </div>
          </div>
        </Card>

        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
              {classData.students?.length || 0}
            </div>
            <p className="text-text-muted dark:text-stone-400 text-sm mt-1">Students</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-secondary-600 dark:text-secondary-400">
              {quizzes?.length || 0}
            </div>
            <p className="text-text-muted dark:text-stone-400 text-sm mt-1">Quizzes</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400">
              {Object.keys(submissions).length}
            </div>
            <p className="text-text-muted dark:text-stone-400 text-sm mt-1">Completed</p>
          </Card>
        </div>

        {/* Quizzes List */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-stone-100 flex items-center gap-2">
              <span>📝</span> Available Quizzes
            </h2>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            </Button>
          </div>

          {!quizzes || quizzes.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="No quizzes available yet"
              description="Check back later for new quizzes from your teacher."
            />
          ) : (
            <div className="space-y-3">
              {(Array.isArray(quizzes) ? quizzes : []).map((quiz) => {
                const quizId = quiz.id || quiz._id;
                const status = getQuizStatus(quiz);
                const isSubmitted = status.status === 'submitted';

                return (
                  <div
                    key={quizId}
                    className="flex items-center justify-between p-4 bg-bg-light dark:bg-dark-hover rounded-xl hover:shadow-warm transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSubmitted 
                            ? 'bg-success-100 dark:bg-success-600/20' 
                            : 'bg-primary-100 dark:bg-primary-600/20'
                        }`}>
                          {isSubmitted ? (
                            <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-dark dark:text-stone-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {quiz.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="neutral" size="sm">{quiz.questions?.length || 0} questions</Badge>
                            {quiz.timeLimit && <Badge variant="neutral" size="sm">{quiz.timeLimit} min</Badge>}
                            <Badge 
                              variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'easy' ? 'success' : 'warning'} 
                              size="sm"
                            >
                              {quiz.difficulty || 'medium'}
                            </Badge>
                            {isSubmitted && (
                              <Badge variant="success" size="sm">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isSubmitted ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/student/quiz/${quizId}/result`, {
                                state: { submissionId: submissions[quizId]?._id },
                              })
                            }
                          >
                            View Result
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/quiz/${quizId}/leaderboard`)}
                            title="View Leaderboard"
                          >
                            🏆
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/student/quiz/${quizId}/attempt`)}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Quiz
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="mt-6">
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
