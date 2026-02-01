import { Card } from '../components/UI.jsx';
import { MainLayout } from '../components/Layout.jsx';

export function TeacherDashboardPlaceholder() {
  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-4">Teacher Dashboard</h1>
        <Card>
          <p className="text-gray-600">Teacher dashboard coming soon...</p>
        </Card>
      </div>
    </MainLayout>
  );
}

export function StudentDashboardPlaceholder() {
  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-4">Student Dashboard</h1>
        <Card>
          <p className="text-gray-600">Student dashboard coming soon...</p>
        </Card>
      </div>
    </MainLayout>
  );
}
