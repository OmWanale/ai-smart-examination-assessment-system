import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, token } = useAuthStore();

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { token } = useAuthStore();

  if (token) {
    // User is already logged in, redirect to appropriate dashboard
    const user = JSON.parse(localStorage.getItem('user'));
    return <Navigate to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}
