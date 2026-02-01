import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function StudentDashboard() {
  const { classes, isLoading, error, getMyClasses } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-dark">My Classes</h1>
          <Link to="/student/join-class">
            <Button>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Join Class
              </span>
            </Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by joining a class with its join code.
              </p>
              <div className="mt-6">
                <Link to="/student/join-class">
                  <Button>Join Your First Class</Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {classes.map((classItem) => (
              <Link key={classItem._id} to={`/student/class/${classItem._id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-text-dark">{classItem.name}</h3>
                      {classItem.description && (
                        <p className="text-gray-600 text-sm mt-1">{classItem.description}</p>
                      )}
                    </div>
                    <Badge variant="primary">
                      {classItem.quizzes?.length || 0} quizzes
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                      Taught by <strong>{classItem.teacher?.email || 'Unknown'}</strong>
                    </div>
                    <div className="text-gray-500">
                      {classItem.students?.length || 0} students
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Joined {new Date(classItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
