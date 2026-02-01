import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Input, Alert } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function JoinClass() {
  const [joinCode, setJoinCode] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { joinClass, isLoading, error, clearError } = useQuizStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    if (!joinCode.trim()) {
      setErrors({ joinCode: 'Join code is required' });
      return;
    }

    if (joinCode.trim().length < 6) {
      setErrors({ joinCode: 'Join code must be at least 6 characters' });
      return;
    }

    const result = await joinClass(joinCode.trim().toUpperCase());
    if (result.success) {
      navigate(`/student/class/${result.data._id}`);
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-6">Join a Class</h1>

        <Card>
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-primary-200 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <p className="text-center text-gray-600">
              Enter the join code provided by your teacher to access the class
            </p>
          </div>

          {(error || errors.submit) && (
            <Alert type="error" className="mb-4">
              {error || errors.submit}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Join Code"
              type="text"
              placeholder="e.g., ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              error={errors.joinCode}
              autoComplete="off"
              autoFocus
              maxLength="12"
              className="uppercase"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-blue-700">
                    Ask your teacher for the join code. It's usually displayed on the board or
                    sent via email.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Joining...
                  </span>
                ) : (
                  'Join Class'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/student/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
