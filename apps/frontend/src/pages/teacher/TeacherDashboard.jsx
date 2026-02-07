import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/UI';
import { useQuizStore } from '../../store/quizStore';
import { MainLayout, PageHeader } from '../../components/Layout';

// Stat Card Component
function StatCard({ icon, value, label, variant = 'primary' }) {
  const variants = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
  };

  return (
    <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${variants[variant]} flex items-center justify-center text-white text-2xl shadow-md group-hover:shadow-warm transition-shadow`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-display font-bold text-text-dark dark:text-stone-100">
            {value}
          </div>
          <p className="text-text-muted dark:text-stone-400 text-sm">{label}</p>
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${variants[variant]} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
    </Card>
  );
}

export function TeacherDashboard() {
  const { classes, getMyClasses, isLoading } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety guard: Ensure classes is always an array
  const safeClasses = Array.isArray(classes) ? classes : [];

  const totalStudents = safeClasses.reduce((sum, c) => sum + (c.studentCount || c.students?.length || 0), 0);
  const totalQuizzes = safeClasses.reduce((sum, c) => sum + (c.quizCount || c.quizzes?.length || 0), 0);

  return (
    <MainLayout>
      <PageHeader 
        title="Teacher Dashboard"
        subtitle="Manage your classes and quizzes"
        action={
          <Link to="/teacher/create-class">
            <Button>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Class
              </span>
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon="📚" 
          value={safeClasses.length} 
          label="Total Classes" 
          variant="primary" 
        />
        <StatCard 
          icon="👨‍🎓" 
          value={totalStudents} 
          label="Total Students" 
          variant="secondary" 
        />
        <StatCard 
          icon="📝" 
          value={totalQuizzes} 
          label="Total Quizzes" 
          variant="accent" 
        />
      </div>

      {/* Classes Section */}
      <div>
        <h2 className="text-xl font-display font-bold text-text-dark dark:text-stone-100 mb-4 flex items-center gap-2">
          <span>Your Classes</span>
          {safeClasses.length > 0 && (
            <Badge variant="primary" size="sm">{safeClasses.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : safeClasses.length === 0 ? (
          <Card>
            <EmptyState
              icon="📚"
              title="No classes yet"
              description="Create your first class to get started with quizzes"
              action={
                <Link to="/teacher/create-class">
                  <Button>Create Your First Class</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeClasses.map((cls) => (
              <Link key={cls.id || cls._id} to={`/teacher/class/${cls.id || cls._id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xl shadow-md">
                      📚
                    </div>
                    <Badge variant="neutral" size="sm">
                      <span className="font-mono">{cls.joinCode}</span>
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-display font-semibold text-text-dark dark:text-stone-100 mb-1">
                    {cls.name}
                  </h3>
                  
                  {cls.description && (
                    <p className="text-text-muted dark:text-stone-400 text-sm mb-4 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-primary-100 dark:border-dark-border">
                    <div className="flex items-center gap-1.5 text-sm text-text-muted dark:text-stone-400">
                      <span>👨‍🎓</span>
                      <span>{cls.studentCount || cls.students?.length || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-muted dark:text-stone-400">
                      <span>📝</span>
                      <span>{cls.quizCount || cls.quizzes?.length || 0} quizzes</span>
                    </div>
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
