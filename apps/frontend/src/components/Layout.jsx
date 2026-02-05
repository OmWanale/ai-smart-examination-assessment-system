import { useEffect } from 'react';
import { Navbar } from './Navigation/Navbar';
import { Sidebar } from './Navigation/Sidebar';
import { useThemeStore } from '../store/themeStore';

export function MainLayout({ children }) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-bg transition-colors duration-300">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-[calc(100vh-64px)]">
          <div className="page-container animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-primary-50 to-secondary-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-warm transform hover:scale-105 transition-transform duration-300">
              <span className="text-white font-display font-bold text-3xl">Q</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[10px]">✨</span>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            Quiz Desktop
          </h1>
          <p className="text-text-muted dark:text-stone-400 mt-2 text-sm">
            AI-Powered Quiz Generation Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action, backLink }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-dark dark:text-stone-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-text-muted dark:text-stone-400 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function PageSection({ title, children, className = '' }) {
  return (
    <section className={`mb-8 ${className}`}>
      {title && (
        <h2 className="text-xl font-display font-semibold text-text-dark dark:text-stone-100 mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

