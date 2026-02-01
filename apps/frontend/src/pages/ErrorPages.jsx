import { Link } from 'react-router-dom';
import { Button } from '../components/UI.jsx';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-dark mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-dark mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-dark mb-4">403</h1>
        <h2 className="text-2xl font-bold text-text-dark mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page.
        </p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
