import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname.startsWith(path);

  const navItems =
    user.role === 'teacher'
      ? [
          { label: 'Dashboard', path: '/teacher/dashboard', icon: '📊' },
          { label: 'Classes', path: '/teacher/classes', icon: '📚' },
          { label: 'Create Class', path: '/teacher/create-class', icon: '➕' },
          { label: 'Create Quiz', path: '/teacher/create-quiz', icon: '📝' },
        ]
      : [
          { label: 'Dashboard', path: '/student/dashboard', icon: '📊' },
          { label: 'My Classes', path: '/student/classes', icon: '📚' },
          { label: 'Join Class', path: '/student/join-class', icon: '➕' },
          { label: 'My Quizzes', path: '/student/quizzes', icon: '📋' },
        ];

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-16 h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
