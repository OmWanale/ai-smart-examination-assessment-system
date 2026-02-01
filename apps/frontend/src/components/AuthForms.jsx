import { useState } from 'react';
import { Button, Input, Card, Alert } from './UI';
import { useAuthStore } from '../store/authStore';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    if (!password) setErrors((prev) => ({ ...prev, password: 'Password is required' }));

    if (email && password) {
      const result = await login(email, password);
      if (!result.success) {
        setErrors((prev) => ({ ...prev, submit: result.error }));
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-text-dark mb-6">Login</h2>
      
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {errors.submit && <Alert type="error" className="mb-4">{errors.submit}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Card>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    if (!password) setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }

    if (email && password && password === confirmPassword) {
      const result = await register(email, password);
      if (!result.success) {
        setErrors((prev) => ({ ...prev, submit: result.error }));
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-text-dark mb-6">Sign Up</h2>
      
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {errors.submit && <Alert type="error" className="mb-4">{errors.submit}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>
    </Card>
  );
}
