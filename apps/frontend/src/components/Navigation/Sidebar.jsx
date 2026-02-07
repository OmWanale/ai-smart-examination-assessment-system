import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Icon Components
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  classes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  createClass: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  createQuiz: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  join: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  quizzes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  results: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname.startsWith(path);

  const teacherNavItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: icons.dashboard },
    { label: 'My Classes', path: '/teacher/dashboard', icon: icons.classes, exact: true },
    { label: 'Create Class', path: '/teacher/create-class', icon: icons.createClass },
    { label: 'Create Quiz', path: '/teacher/create-quiz', icon: icons.createQuiz },
  ];

  const studentNavItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: icons.dashboard },
    { label: 'My Classes', path: '/student/classes', icon: icons.classes },
    { label: 'Join Class', path: '/student/join-class', icon: icons.join },
    { label: 'My Quizzes', path: '/student/quizzes', icon: icons.quizzes },
    { label: 'My Results', path: '/student/results', icon: icons.results },
  ];

  const navItems = user.role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-white dark:bg-dark-card border-r border-primary-100 dark:border-dark-border sticky top-16 h-[calc(100vh-64px)] transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-dark-card border border-primary-200 dark:border-dark-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10 group"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg 
          className={`w-3 h-3 text-text-muted group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-warm">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm'
                : 'text-text-muted dark:text-stone-400 hover:bg-primary-50 dark:hover:bg-dark-hover hover:text-primary-600 dark:hover:text-primary-400'
            } ${isCollapsed ? 'justify-center px-3' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className={`flex-shrink-0 transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {isActive(item.path) && !isCollapsed && (
              <span className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {/* Role Badge at Bottom */}
      {!isCollapsed && (
        <div className="p-4 border-t border-primary-100 dark:border-dark-border">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted dark:text-stone-400 uppercase tracking-wide">Role</p>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 capitalize truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Role Icon */}
      {isCollapsed && (
        <div className="p-4 border-t border-primary-100 dark:border-dark-border flex justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl flex items-center justify-center text-white text-lg shadow-sm">
            {user.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
          </div>
        </div>
      )}
    </aside>
  );
}
