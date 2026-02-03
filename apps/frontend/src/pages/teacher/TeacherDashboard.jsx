import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/UI';
import { useQuizStore } from '../../store/quizStore';
import { MainLayout } from '../../components/Layout';

export function TeacherDashboard() {
  const { classes, getMyClasses, isLoading } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety guard: Ensure classes is always an array
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-dark">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your classes and quizzes</p>
          </div>
          <Link to="/teacher/create-class">
            <Button>+ New Class</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{safeClasses.length}</div>
              <p className="text-gray-600 mt-2">Total Classes</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">
                {safeClasses.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
              </div>
              <p className="text-gray-600 mt-2">Total Students</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">
                {safeClasses.reduce((sum, c) => sum + (c.quizzes?.length || 0), 0)}
              </div>
              <p className="text-gray-600 mt-2">Total Quizzes</p>
            </div>
          </Card>
        </div>

        {/* Classes List */}
        <div>
          <h2 className="text-2xl font-bold text-text-dark mb-4">Your Classes</h2>

          {isLoading ? (
            <Card>
              <p className="text-center text-gray-600">Loading classes...</p>
            </Card>
          ) : safeClasses.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No classes yet</p>
                <Link to="/teacher/create-class">
                  <Button>Create Your First Class</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeClasses.map((cls) => (
                <Link key={cls._id} to={`/teacher/class/${cls._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <h3 className="text-xl font-bold text-text-dark mb-2">{cls.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{cls.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <Badge variant="secondary">{cls.students?.length || 0} students</Badge>
                      </div>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {cls.joinCode}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
