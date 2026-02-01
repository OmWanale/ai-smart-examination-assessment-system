import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../UI';
import { useAuthStore } from '../../store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  // Hide navbar on auth pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="hidden sm:inline text-xl font-bold text-text-dark">Quiz Desktop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                  <span className="ml-2 text-xs font-medium text-primary-600 uppercase">
                    {user.role}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user ? (
              <>
                <div className="px-2 py-2 text-sm text-gray-600 mb-4">
                  {user.email}
                  <span className="block text-xs font-medium text-primary-600 uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <div className="px-2 py-2 text-sm hover:bg-gray-100 rounded">
                    Login
                  </div>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <div className="px-2 py-2 text-sm hover:bg-gray-100 rounded">
                    Sign Up
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
