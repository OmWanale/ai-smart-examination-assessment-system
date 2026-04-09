import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useQuizStore } from '../../store/quizStore';

/* ── Flat avatar colours (rotating palette) ── */
const AVATAR_COLORS = [
  '#1a73e8','#1e8e3e','#e8710a','#a142f4',
  '#d93025','#137333','#1967d2','#e37400',
  '#9334e6','#0d652d','#c5221f','#185abc',
];
const avatarBg = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

/* ── SVG Icons ── */
const HomeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const DocumentIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/* ══════════════════════════════════════════════════════════
   Sidebar  —  Google Classroom layout
   ══════════════════════════════════════════════════════════ */
export function Sidebar({ isVisible = true }) {
  const { user } = useAuthStore();
  const { classes } = useQuizStore();
  const location = useLocation();
  const [sectionOpen, setSectionOpen] = useState(true);

  if (!user) return null;

  const isTeacher = user.role === 'teacher';
  const dashPath  = isTeacher ? '/teacher/dashboard' : '/student/dashboard';
  const safeClasses = Array.isArray(classes) ? classes : [];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className={`gc-sidebar ${isVisible ? '' : 'gc-sidebar-collapsed'}`}>
      {/* ── Top nav: Home & Calendar ── */}
      <div className="pt-2 pb-1">
        <Link
          to={dashPath}
          className={`gc-nav-item ${isActive(dashPath) ? 'active' : ''}`}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>

        <Link
          to={isTeacher ? '/teacher/assignments' : '/student/assignments'}
          className={`gc-nav-item ${isActive(isTeacher ? '/teacher/assignments' : '/student/assignments') ? 'active' : ''}`}
        >
          <CalendarIcon />
          <span>Calendar</span>
        </Link>

        {/* Question Paper - Teacher Only */}
        {isTeacher && (
          <Link
            to="/teacher/question-paper"
            className={`gc-nav-item ${isActive('/teacher/question-paper') ? 'active' : ''}`}
          >
            <DocumentIcon />
            <span>Question Paper</span>
          </Link>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[#e0e0e0] dark:bg-[#334155] mx-4" />

      {/* ── Section: Teaching / Enrolled ── */}
      <div
        className="gc-section-title"
        onClick={() => setSectionOpen(!sectionOpen)}
      >
        <span>{isTeacher ? 'Teaching' : 'Enrolled'}</span>
        <ChevronIcon open={sectionOpen} />
      </div>

      {/* ── Class list (scrollable) ── */}
      {sectionOpen && (
        <nav className="flex-1 overflow-y-auto gc-scrollbar pb-4">
          {safeClasses.length === 0 ? (
            <p className="text-xs text-[#5f6368] dark:text-slate-500 px-6 py-3 italic">
              No classes yet
            </p>
          ) : (
            safeClasses.map((cls, idx) => {
              const classPath = isTeacher
                ? `/teacher/class/${cls.id || cls._id}`
                : `/student/class/${cls.id || cls._id}`;
              return (
                <Link
                  key={cls.id || cls._id}
                  to={classPath}
                  className={`gc-class-item ${isActive(classPath) ? 'active' : ''}`}
                >
                  <div
                    className="gc-class-avatar"
                    style={{ backgroundColor: avatarBg(idx) }}
                  >
                    {(cls.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {cls.name}
                    </p>
                    <p className="text-[11px] text-[#5f6368] dark:text-slate-500 truncate leading-tight">
                      {cls.description || (isTeacher
                        ? `${cls.studentCount || cls.students?.length || 0} students`
                        : cls.teacher?.name || cls.teacher?.email || ''
                      )}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </nav>
      )}
    </aside>
  );
}
