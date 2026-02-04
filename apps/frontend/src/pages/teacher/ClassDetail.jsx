import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI } from '../../api/client';

export function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { quizzes, getQuizzesForClass } = useQuizStore();

  useEffect(() => {
    loadClassData();
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadClassData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await classAPI.getClass(classId);
      // Backend returns: { success, data: { class: { ... } } }
      const rawData = response.data?.data?.class || response.data?.class || response.data;
      console.log('[ClassDetail] Raw API response:', response.data);
      console.log('[ClassDetail] Extracted class data:', rawData);
      
      // Normalize data - ensure students and quizzes are always arrays
      const normalizedData = {
        ...rawData,
        students: Array.isArray(rawData?.students) ? rawData.students : [],
        quizzes: Array.isArray(rawData?.quizzes) ? rawData.quizzes : [],
      };
      console.log('[ClassDetail] Normalized class data:', normalizedData);
      
      setClassData(normalizedData);
    } catch (err) {
      console.error('[ClassDetail] Error loading class:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuizzes = async () => {
    await getQuizzesForClass(classId);
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
          <Button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</Button>
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
            <Link to="/teacher/dashboard" className="hover:text-primary-600">
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
            </div>
            <div className="flex gap-2">
              <Link to={`/teacher/create-quiz?classId=${classId}`}>
                <Button>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Quiz
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join Code Card */}
          <Card>
            <h2 className="text-lg font-semibold text-text-dark mb-3">Join Code</h2>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary-600 tracking-wider font-mono">
                {classData.joinCode}
              </p>
              <p className="text-xs text-gray-600 mt-2">Share with students</p>
            </div>
          </Card>

          {/* Stats Cards */}
          <Card>
            <h2 className="text-lg font-semibold text-text-dark mb-3">Students</h2>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-primary-600">
                {classData.students?.length || 0}
              </div>
              <svg className="w-12 h-12 text-primary-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-text-dark mb-3">Quizzes</h2>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-secondary-600">
                {quizzes?.length || 0}
              </div>
              <svg className="w-12 h-12 text-secondary-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
          </Card>
        </div>

        {/* Students List */}
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-text-dark mb-4">Enrolled Students</h2>
          {!Array.isArray(classData.students) || classData.students.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p>No students have joined yet</p>
              <p className="text-sm mt-1">Share the join code with your students</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(classData.students || []).map((student, index) => (
                <div
                  key={student._id || index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {student.email ? student.email[0].toUpperCase() : 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">
                      {student.email || 'Student'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quizzes List */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-dark">Quizzes</h2>
            <Link to={`/teacher/create-quiz?classId=${classId}`}>
              <Button variant="outline" size="sm">
                + Add Quiz
              </Button>
            </Link>
          </div>

          {!Array.isArray(quizzes) || quizzes.length === 0 ? (
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
              <p>No quizzes created yet</p>
              <p className="text-sm mt-1">Create your first quiz to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(quizzes || []).map((quiz) => (
                <div
                  key={quiz._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-dark">{quiz.title}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>{quiz.questions?.length || 0} questions</span>
                      {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                      <span className="capitalize">{quiz.difficulty || 'medium'} difficulty</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/teacher/quiz/${quiz._id}/leaderboard`}>
                      <Button variant="outline" size="sm">
                        Leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
