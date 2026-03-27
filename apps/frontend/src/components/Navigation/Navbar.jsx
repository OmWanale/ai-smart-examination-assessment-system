import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

/* ───────────────────── Theme Toggle ───────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <button onClick={toggleTheme} className="gc-icon-btn" aria-label="Toggle theme">
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

/* ───────────────────── Navbar ───────────────────── */
export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  // Hide on auth pages
  if (['/login', '/register'].includes(location.pathname)) return null;

  const dashPath = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
  const createPath = user?.role === 'teacher' ? '/teacher/create-class' : '/student/join-class';

  return (
    <nav className="gc-navbar">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-2">
        {/* Hamburger (toggles sidebar on large, opens mobile menu on small) */}
        <button
          onClick={() => { onToggleSidebar?.(); setMenuOpen(!menuOpen); }}
          className="gc-icon-btn"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to={dashPath} className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: '#1a73e8' }}>
            <span className="text-white font-bold text-base">C</span>
          </div>
          <span className="hidden sm:inline text-[18px] font-medium" style={{ color: '#5f6368' }}>
            Classyn<span style={{ color: '#1a73e8' }}>AI</span>
          </span>
        </Link>
      </div>

      {/* Right: + icon, theme, avatar, logout */}
      <div className="flex items-center gap-1 ml-auto">
        {user && (
          <Link to={createPath} className="gc-icon-btn" title={user.role === 'teacher' ? 'Create class' : 'Join class'}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        )}

        <ThemeToggle />

        {user ? (
          <>
            <button onClick={handleLogout} className="gc-icon-btn" title="Logout">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* User avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ml-1 cursor-default"
              style={{ background: '#1a73e8' }}
              title={user.email}
            >
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium px-3 py-1.5 rounded hover:bg-gray-100" style={{ color: '#1a73e8' }}>Login</Link>
            <Link to="/register" className="text-sm font-medium px-3 py-1.5 rounded text-white" style={{ background: '#1a73e8' }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
