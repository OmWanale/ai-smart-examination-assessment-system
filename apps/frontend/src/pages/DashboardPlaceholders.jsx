import { Card, Spinner } from '../components/UI.jsx';
import { MainLayout } from '../components/Layout.jsx';

export function TeacherDashboardPlaceholder() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-dark-muted">Loading teacher dashboard...</p>
        </div>
      </div>
    </MainLayout>
  );
}

export function StudentDashboardPlaceholder() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-dark-muted">Loading student dashboard...</p>
        </div>
      </div>
    </MainLayout>
  );
}
