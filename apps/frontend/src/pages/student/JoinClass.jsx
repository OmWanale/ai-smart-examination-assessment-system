import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Input, Alert, Spinner } from '../../components/UI.jsx';
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

    try {
      const result = await joinClass(joinCode.trim().toUpperCase());
      if (result.success) {
        console.log('[JoinClass] Successfully joined class:', result.data);
        const classId = result.data.id || result.data._id;
        navigate(`/student/class/${classId}`);
      } else {
        console.error('[JoinClass] Failed to join class:', result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('[JoinClass] Exception during class join:', error);
      setErrors({ submit: 'An unexpected error occurred while joining the class' });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Join a Class"
          subtitle="Enter the code provided by your teacher"
        />

        <Card>
          <div className="mb-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="h-10 w-10 text-white"
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
            </div>
            <p className="text-text-muted dark:text-stone-400">
              Enter the join code provided by your teacher to access the class
            </p>
          </div>

          {(error || errors.submit) && (
            <Alert type="error" className="mb-4" dismissible onDismiss={() => { setErrors({}); clearError(); }}>
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
              className="uppercase text-center text-2xl tracking-widest font-display font-bold"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              }
            />

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Ask your teacher for the join code. It's usually displayed on the board or
                    sent via email.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" /> Joining...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Join Class
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
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
