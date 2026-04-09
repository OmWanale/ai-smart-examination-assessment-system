import { useEffect, useState } from 'react';
import { Navbar } from './Navigation/Navbar';
import { Sidebar } from './Navigation/Sidebar';
import { useThemeStore } from '../store/themeStore';

/* ═══════════════ Main (dashboard) Layout ═══════════════ */
export function MainLayout({ children }) {
  const { initializeTheme } = useThemeStore();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen" style={{ background: '#f1f3f4' }}>
      <div className="dark:bg-[#0f172a] min-h-screen">
        <Navbar onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)} />
        <div className="flex">
          <Sidebar isVisible={isSidebarVisible} />
          <main className="flex-1 overflow-auto min-h-[calc(100vh-64px)]">
            <div className="page-container animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Auth (login/register) Layout ═══════════════ */
export function AuthLayout({ children }) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors duration-300 font-[Inter]">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300"
                 style={{ background: '#1a73e8' }}>
              <span className="text-white font-bold text-3xl">C</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 transition-colors duration-300 tracking-tight">
            ClassynAI
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm transition-colors duration-300">
            Smart Examination and Assessment System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════ Page Header ═══════════════ */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-normal" style={{ color: '#202124' }}>
            <span className="dark:text-slate-100">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: '#5f6368' }}>
              <span className="dark:text-slate-400">{subtitle}</span>
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* ═══════════════ Page Section ═══════════════ */
export function PageSection({ title, children, className = '' }) {
  return (
    <section className={`mb-8 ${className}`}>
      {title && (
        <h2 className="text-lg font-medium mb-4" style={{ color: '#202124' }}>
          <span className="dark:text-slate-100">{title}</span>
        </h2>
      )}
      {children}
    </section>
  );
}
