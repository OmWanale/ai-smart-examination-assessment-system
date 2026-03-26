import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../api/client';
import { AuthLayout } from '../components/Layout.jsx';
import { Alert } from '../components/UI.jsx';

// 1. The Layout: Centered elevated Card
function AuthCard({ children }) {
  return (
    <div className="bg-white border-slate-100 shadow-slate-100/70 dark:bg-slate-950 dark:border-slate-800 dark:shadow-black/20 shadow-2xl border rounded-2xl p-8 transition-colors duration-300 font-[Inter] w-full">
      {children}
    </div>
  );
}

// 3. Role Selector (Student/Teacher)
function RoleButton({ role, selectedRole, onClick, icon, label }) {
  const isSelected = role === selectedRole;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 py-4 px-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
        isSelected
          ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
          : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
      }`}
    >
      <span className="text-3xl opacity-90">{icon}</span>
      <span className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
        {label}
      </span>
      {isSelected && (
        <span className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold absolute bottom-2">
          Selected
        </span>
      )}
    </button>
  );
}

// 4. Input Fields
function FormInput({ icon, error, helper, label, ...props }) {
  return (
    <div className="w-full relative">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 opacity-60">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 outline-none transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-50 ${icon ? 'pl-10' : ''} focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 focus:border-indigo-400 dark:focus:border-indigo-500 ${error ? 'border-red-500 focus:ring-red-300' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
      {helper && !error && <p className="text-slate-500 text-xs mt-1.5">{helper}</p>}
    </div>
  );
}

// 5. Primary Button
function PrimaryButton({ children, isLoading, ...props }) {
  return (
    <button
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 px-4 font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

// 6. Google Button
function GoogleButton({ onClick, isLoading, typeText }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="w-full bg-transparent border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg py-2.5 px-4 font-medium transition-colors duration-200 flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {typeText} with Google
    </button>
  );
}

// 5. Divider
function AuthDivider() {
  return (
    <div className="relative my-6 flex items-center">
      <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
      <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">OR</span>
      <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
    </div>
  );
}

// SVG Icons
const Icons = {
  Email: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Lock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  User: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  CheckLock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login, isLoading, error, clearError } = useAuthStore();

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

    const result = await login(email, password, role);
    if (result.success) {
      navigate(result.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error }));
    }
  };

  const handleGoogleSignIn = () => {
    const googleAuthUrl = `${API_BASE_URL}/auth/google?role=${encodeURIComponent(role)}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Sign in to continue to your dashboard
        </p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        {errors.oauth && <Alert type="error" className="mb-4">{errors.oauth}</Alert>}
        {errors.submit && <Alert type="error" className="mb-4">{errors.submit}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="pb-2">
            <div className="flex gap-4 relative">
              <RoleButton role="student" selectedRole={role} onClick={() => setRole('student')} icon="👨‍🎓" label="Student" />
              <RoleButton role="teacher" selectedRole={role} onClick={() => setRole('teacher')} icon="👨‍🏫" label="Teacher" />
            </div>
          </div>

          <FormInput
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            icon={Icons.Email}
          />
          <FormInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            icon={Icons.Lock}
          />
          
          <PrimaryButton type="submit" isLoading={isLoading}>
            Login as {role === 'teacher' ? 'Teacher' : 'Student'}
          </PrimaryButton>
        </form>

        <AuthDivider />

        <GoogleButton onClick={handleGoogleSignIn} isLoading={isLoading} typeText="Sign in" />

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Sign up
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    let hasErrors = false;

    if (!name) {
      setErrors((prev) => ({ ...prev, name: 'Name is required' }));
      hasErrors = true;
    }
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

    const result = await register(email, password, name, role);
    if (result.success) {
      navigate(result.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', {
        replace: true,
      });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error }));
    }
  };

  const handleGoogleSignIn = () => {
    const googleAuthUrl = `${API_BASE_URL}/auth/google?role=${encodeURIComponent(role)}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1 tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Join our learning platform today
        </p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        {errors.submit && <Alert type="error" className="mb-4">{errors.submit}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="pb-1">
            <div className="flex gap-4 relative">
              <RoleButton role="student" selectedRole={role} onClick={() => setRole('student')} icon="👨‍🎓" label="Student" />
              <RoleButton role="teacher" selectedRole={role} onClick={() => setRole('teacher')} icon="👨‍🏫" label="Teacher" />
            </div>
          </div>

          <FormInput
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            icon={Icons.User}
          />
          <FormInput
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            icon={Icons.Email}
          />
          <FormInput
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            icon={Icons.Lock}
          />
          <FormInput
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            icon={Icons.CheckLock}
          />
          
          <PrimaryButton type="submit" isLoading={isLoading}>
            Sign Up as {role === 'teacher' ? 'Teacher' : 'Student'}
          </PrimaryButton>
        </form>

        <AuthDivider />

        <GoogleButton onClick={handleGoogleSignIn} isLoading={isLoading} typeText="Sign up" />

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Login
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
