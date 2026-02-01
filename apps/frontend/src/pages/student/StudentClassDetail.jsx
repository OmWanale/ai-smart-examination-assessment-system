import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge } from '../../components/UI.jsx';
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
      setClassData(classResponse.data);

      // Load quizzes
      await getQuizzesForClass(classId);

      // Load submissions for all quizzes to check status
      const allSubmissions = {};
      if (classResponse.data.quizzes && classResponse.data.quizzes.length > 0) {
        for (const quiz of classResponse.data.quizzes) {
          try {
            const subResponse = await submissionAPI.getSubmissionsForQuiz(quiz._id);
            if (subResponse.data && subResponse.data.length > 0) {
              // Get latest submission for this student
              allSubmissions[quiz._id] = subResponse.data[subResponse.data.length - 1];
            }
          } catch (err) {
            // No submissions yet, that's fine
          }
        }
      }
      setSubmissions(allSubmissions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuizStatus = (quizId) => {
    if (submissions[quizId]) {
      return {
        status: 'submitted',
        score: submissions[quizId].score,
        maxScore: submissions[quizId].maxScore || 0,
      };
    }
    return { status: 'available' };
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
        {/* Class Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link to="/student/dashboard" className="hover:text-primary-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-text-dark">{classData.name}</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-text-dark mb-2">{classData.name}</h1>
              {classData.description && (
                <p className="text-gray-600">{classData.description}</p>
              )}
              <div className="mt-2 text-sm text-gray-600">
                Taught by <strong>{classData.teacher?.email}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {classData.students?.length || 0}
              </div>
              <p className="text-gray-600 text-sm mt-1">Students</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">
                {quizzes?.length || 0}
              </div>
              <p className="text-gray-600 text-sm mt-1">Quizzes</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">
                {Object.keys(submissions).length}
              </div>
              <p className="text-gray-600 text-sm mt-1">Completed</p>
            </div>
          </Card>
        </div>

        {/* Quizzes List */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-dark">Quizzes</h2>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </div>

          {!quizzes || quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No quizzes available yet</p>
              <p className="text-sm mt-1">Check back later for new quizzes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const status = getQuizStatus(quiz._id);
                const isSubmitted = status.status === 'submitted';

                return (
                  <div
                    key={quiz._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-text-dark">{quiz.title}</h3>
                        {isSubmitted && (
                          <Badge variant="secondary">
                            {status.score}/{status.maxScore}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{quiz.questions?.length || 0} questions</span>
                        {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                        <span className="capitalize">{quiz.difficulty || 'medium'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isSubmitted ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/student/quiz/${quiz._id}/result`, {
                                state: { submissionId: submissions[quiz._id]._id },
                              })
                            }
                          >
                            View Result
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/student/quiz/${quiz._id}/attempt`)}
                        >
                          Start Quiz
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
          <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
