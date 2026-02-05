import { Link } from 'react-router-dom';
import { Button } from '../components/UI.jsx';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-4xl font-bold mb-6 shadow-lg">
          404
        </div>
        <h2 className="text-2xl font-display font-bold text-text-dark dark:text-dark-text mb-3">Page Not Found</h2>
        <p className="text-neutral-600 dark:text-dark-muted mb-8 max-w-md">
          Oops! The page you're looking for seems to have wandered off.
        </p>
        <Link to="/">
          <Button className="flex items-center gap-2 mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-error-400 to-error-600 text-white text-4xl font-bold mb-6 shadow-lg">
          403
        </div>
        <h2 className="text-2xl font-display font-bold text-text-dark dark:text-dark-text mb-3">Unauthorized</h2>
        <p className="text-neutral-600 dark:text-dark-muted mb-8 max-w-md">
          Sorry, you don't have permission to access this page.
        </p>
        <Link to="/">
          <Button className="flex items-center gap-2 mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
