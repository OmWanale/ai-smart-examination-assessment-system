import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/Layout.jsx';
import { Card } from '../components/UI.jsx';

export function OAuthCallback() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Parse URL parameters or hash
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      // Redirect to login with error message
      navigate('/login?error=' + encodeURIComponent(error), { replace: true });
      return;
    }

    if (token) {
      // Decode and store user info
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        const user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        };

        // Store in auth state and localStorage
        setAuth(user, token);

        // Redirect to appropriate dashboard
        navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', {
          replace: true,
        });
      } catch (err) {
        console.error('Failed to parse token:', err);
        navigate('/login?error=Invalid authentication token', { replace: true });
      }
    } else {
      // No token found
      navigate('/login?error=Authentication failed', { replace: true });
    }
  }, [navigate, setAuth]);

  return (
    <AuthLayout>
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </Card>
    </AuthLayout>
  );
}
