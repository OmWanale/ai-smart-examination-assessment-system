import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState, Avatar } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function StudentClasses() {
  const { classes, isLoading, error, getMyClasses } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="My Classes"
          subtitle="View and manage your enrolled classes"
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
          <Alert type="error" className="mb-6" dismissible>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Spinner size="xl" />
              <p className="text-text-muted dark:text-stone-400 mt-4">Loading your classes...</p>
            </div>
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
            title="No classes yet"
            description="Get started by joining a class with its join code from your teacher."
            action={
              <Link to="/student/join-class">
                <Button>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Join Your First Class
                  </span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <Link key={classItem.id || classItem._id} to={`/student/class/${classItem.id || classItem._id}`}>
                <Card className="hover:shadow-warm hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-display font-semibold text-text-dark dark:text-stone-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {classItem.name}
                    </h3>
                    <Badge variant="primary">
                      {classItem.quizCount || classItem.quizzes?.length || 0} quizzes
                    </Badge>
                  </div>
                  {classItem.description && (
                    <p className="text-text-muted dark:text-stone-400 text-sm mb-4 line-clamp-2">{classItem.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-muted dark:text-stone-400">
                    <Avatar name={classItem.teacher?.name || classItem.teacher?.email} size="sm" />
                    <span>Taught by <strong className="text-text-dark dark:text-stone-200">{classItem.teacher?.name || classItem.teacher?.email || 'Unknown'}</strong></span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border flex justify-between items-center">
                    <span className="text-xs text-text-muted dark:text-stone-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {classItem.studentCount || classItem.students?.length || 0} students
                    </span>
                    <span className="text-xs text-text-muted dark:text-stone-500">
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
