import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Alert, Card } from '../components/UI.jsx';
import { useAuthStore } from '../store/authStore';
import { AuthLayout } from '../components/Layout.jsx';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login, isLoading, error, clearError } = useAuthStore();

  // Check for OAuth error in URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setErrors((prev) => ({ ...prev, oauth: oauthError }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'));
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error }));
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const googleAuthUrl = backendUrl.replace('/api', '') + '/auth/google';
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthLayout>
      <Card>
        <h2 className="text-2xl font-bold text-text-dark mb-6">Login to Quiz Desktop</h2>

        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}
        {errors.oauth && (
          <Alert type="error" className="mb-4">
            {errors.oauth}
          </Alert>
        )}
        {errors.submit && (
          <Alert type="error" className="mb-4">
            {errors.submit}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Logging in...
              </span>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    let hasErrors = false;

    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      hasErrors = true;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      hasErrors = true;
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      hasErrors = true;
    }
    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      hasErrors = true;
    }

    if (hasErrors) return;

    const result = await register(email, password);
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'));
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error }));
    }
  };

  const handleGoogleSignIn = () => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const googleAuthUrl = backendUrl.replace('/api', '') + '/auth/google';
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthLayout>
      <Card>
        <h2 className="text-2xl font-bold text-text-dark mb-6">Create Account</h2>

        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}
        {errors.submit && (
          <Alert type="error" className="mb-4">
            {errors.submit}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
