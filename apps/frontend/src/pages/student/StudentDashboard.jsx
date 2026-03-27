import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout';
import { Button, Alert, Spinner, EmptyState } from '../../components/UI';
import { useQuizStore } from '../../store/quizStore';

/* ── Banner colours (flat, Google Classroom palette) ── */
const BANNER = [
  '#1a73e8','#1e8e3e','#e8710a','#a142f4',
  '#d93025','#137333','#1967d2','#e37400',
  '#9334e6','#0d652d','#c5221f','#185abc',
];
const bg = (i) => BANNER[i % BANNER.length];

/* ═══════════════════════ Google Classroom Class Card ═══════════════════════ */
function ClassCard({ classItem, index }) {
  const teacherName = classItem.teacher?.name || classItem.teacher?.email || 'Teacher';

  return (
    <Link to={`/student/class/${classItem.id || classItem._id}`} className="block">
      <div className="gc-card group">
        {/* ── Coloured banner ── */}
        <div className="gc-card-banner" style={{ backgroundColor: bg(index) }}>
          <h3 className="text-[18px] font-normal text-white truncate pr-20 leading-snug group-hover:underline">
            {classItem.name}
          </h3>
          {classItem.description && (
            <p className="text-[13px] text-white/80 truncate mt-0.5 pr-20">{classItem.description}</p>
          )}
          <p className="text-[12px] text-white/70 mt-1">{teacherName}</p>

          {/* Teacher avatar */}
          <div className="gc-card-avatar">
            {teacherName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* ── White body ── */}
        <div className="gc-card-body">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5f6368] dark:text-slate-400 bg-[#f1f3f4] dark:bg-slate-700 px-2 py-0.5 rounded">
              📝 {classItem.quizCount || classItem.quizzes?.length || 0} quizzes
            </span>
            <span className="text-[11px] text-[#5f6368] dark:text-slate-400 bg-[#f1f3f4] dark:bg-slate-700 px-2 py-0.5 rounded">
              👥 {classItem.studentCount || classItem.students?.length || 0}
            </span>
          </div>
        </div>

        {/* ── Footer icons ── */}
        <div className="gc-card-footer">
          <button className="gc-card-icon" title="Assignments">
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

/* ═══════════════════════ Student Dashboard Page ═══════════════════════ */
export function StudentDashboard() {
  const { classes, isLoading, error, getMyClasses } = useQuizStore();

  useEffect(() => {
    getMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="Classes"
        action={
          <Link to="/student/join-class">
            <Button>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Join Class
              </span>
            </Button>
          </Link>
        }
      />

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <div className="gc-empty-card">
          <EmptyState
            icon="📚"
            title="No classes yet"
            description="Get started by joining a class with its unique code from your teacher"
            action={
              <Link to="/student/join-class">
                <Button>Join Your First Class</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem, i) => (
            <ClassCard key={classItem.id || classItem._id} classItem={classItem} index={i} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
