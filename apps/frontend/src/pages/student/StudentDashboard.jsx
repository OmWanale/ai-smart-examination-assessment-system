import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function StudentDashboard() {
  const { classes, isLoading, error, getMyClasses } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="My Classes"
        subtitle="View your enrolled classes and available quizzes"
        action={
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
        }
      />

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon="📚"
            title="No classes yet"
            description="Get started by joining a class with its unique code from your teacher"
            action={
              <Link to="/student/join-class">
                <Button>Join Your First Class</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Link key={classItem.id || classItem._id} to={`/student/class/${classItem.id || classItem._id}`}>
              <Card hover className="h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl shadow-md flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-semibold text-text-dark dark:text-stone-100 truncate">
                      {classItem.name}
                    </h3>
                    {classItem.description && (
                      <p className="text-text-muted dark:text-stone-400 text-sm line-clamp-2 mt-1">
                        {classItem.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="primary">
                    📝 {classItem.quizCount || classItem.quizzes?.length || 0} quizzes
                  </Badge>
                  <Badge variant="neutral">
                    👥 {classItem.studentCount || classItem.students?.length || 0} students
                  </Badge>
                </div>

                <div className="pt-4 border-t border-primary-100 dark:border-dark-border">
                  <div className="flex items-center gap-2 text-sm text-text-muted dark:text-stone-400">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-300 to-secondary-300 flex items-center justify-center text-white text-xs font-semibold">
                      {(classItem.teacher?.name || classItem.teacher?.email || 'T').charAt(0).toUpperCase()}
                    </div>
                    <span>
                      Taught by <strong className="text-text-dark dark:text-stone-200">{classItem.teacher?.name || classItem.teacher?.email || 'Unknown'}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-text-light dark:text-stone-500 mt-2">
                    Joined {new Date(classItem.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
