import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, EmptyState, Button } from '../../components/UI';
import { useQuizStore } from '../../store/quizStore';
import { MainLayout, PageHeader } from '../../components/Layout';

/* ── Banner colours (flat, Google Classroom palette) ── */
const BANNER = [
  '#1a73e8','#1e8e3e','#e8710a','#a142f4',
  '#d93025','#137333','#1967d2','#e37400',
  '#9334e6','#0d652d','#c5221f','#185abc',
];
const bg = (i) => BANNER[i % BANNER.length];

/* ═══════════════════════ Google Classroom Class Card ═══════════════════════ */
function ClassCard({ cls, index }) {
  return (
    <Link to={`/teacher/class/${cls.id || cls._id}`} className="block">
      <div className="gc-card group">
        {/* ── Coloured banner ── */}
        <div className="gc-card-banner" style={{ backgroundColor: bg(index) }}>
          <h3 className="text-[18px] font-normal text-white truncate pr-20 leading-snug group-hover:underline">
            {cls.name}
          </h3>
          {cls.description && (
            <p className="text-[13px] text-white/80 truncate mt-0.5 pr-20">{cls.description}</p>
          )}
          <p className="text-[12px] text-white/70 mt-1">
            {cls.studentCount || cls.students?.length || 0} students
          </p>

          {/* Circle avatar overlapping banner→body */}
          <div className="gc-card-avatar">
            {(cls.name || 'C').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* ── White body ── */}
        <div className="gc-card-body">
          <span className="inline-block text-[11px] font-mono tracking-wider text-[#5f6368] dark:text-slate-400 bg-[#f1f3f4] dark:bg-slate-700 px-2 py-0.5 rounded select-all">
            {cls.joinCode}
          </span>
        </div>

        {/* ── Footer icons ── */}
        <div className="gc-card-footer">
          <button className="gc-card-icon" title="Quizzes">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button className="gc-card-icon" title="Open">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <button className="gc-card-icon" title="More">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════ Teacher Dashboard Page ═══════════════════════ */
export function TeacherDashboard() {
  const { classes, getMyClasses, isLoading } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <MainLayout>
      <PageHeader
        title="Classes"
        action={
          <Link to="/teacher/create-class">
            <Button>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Class
              </span>
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : safeClasses.length === 0 ? (
        <div className="gc-empty-card">
          <EmptyState
            icon="📚"
            title="No classes yet"
            description="Create your first class to get started with quizzes and assignments"
            action={
              <Link to="/teacher/create-class">
                <Button>Create Your First Class</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {safeClasses.map((cls, i) => (
            <ClassCard key={cls.id || cls._id} cls={cls} index={i} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
