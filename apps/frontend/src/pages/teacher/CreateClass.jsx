import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Input, Textarea, Alert, Spinner } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function CreateClass() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [createdClass, setCreatedClass] = useState(null);
  const navigate = useNavigate();

  const { createClass, isLoading, error, clearError } = useQuizStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Validation
    if (!name.trim()) {
      setErrors({ name: 'Class name is required' });
      return;
    }

    if (name.trim().length < 3) {
      setErrors({ name: 'Class name must be at least 3 characters' });
      return;
    }

    try {
      const result = await createClass(name.trim(), description.trim());
      if (result.success) {
        console.log('[CreateClass] Class created successfully:', result.data);
        setCreatedClass(result.data);
      } else {
        console.error('[CreateClass] Failed to create class:', result.error);
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('[CreateClass] Exception during class creation:', error);
      setErrors({ submit: 'An unexpected error occurred while creating the class' });
    }
  };

  const handleGoToClass = () => {
    if (createdClass) {
      const classId = createdClass.id || createdClass._id;
      navigate(`/teacher/class/${classId}`);
    }
  };

  const handleCreateAnother = () => {
    setCreatedClass(null);
    setName('');
    setDescription('');
    setErrors({});
    clearError();
  };

  if (createdClass) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-success-500 to-success-600 p-8 -m-6 mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Class Created Successfully!
              </h2>
              <p className="text-white/80">
                Share this join code with your students
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-8 mb-6 text-center">
              <p className="text-sm text-text-muted dark:text-slate-400 mb-2">Join Code</p>
              <p className="text-5xl font-display font-bold text-primary-600 dark:text-primary-400 tracking-widest font-mono">
                {createdClass.joinCode}
              </p>
            </div>

            <div className="bg-bg-light dark:bg-dark-hover rounded-xl p-4 mb-6">
              <h3 className="font-display font-semibold text-text-dark dark:text-slate-100 mb-2">{createdClass.name}</h3>
              {createdClass.description && (
                <p className="text-text-muted dark:text-slate-400 text-sm">{createdClass.description}</p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleGoToClass}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Go to Class
                </span>
              </Button>
              <Button variant="outline" onClick={handleCreateAnother}>
                Create Another
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Create New Class"
          subtitle="Set up a new class for your students"
          icon={
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          }
        />

        <Card>
          {(error || errors.submit) && (
            <Alert type="error" className="mb-6" dismissible onDismiss={() => { setErrors({}); clearError(); }}>
              {error || errors.submit}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Class Name"
              type="text"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              autoFocus
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Describe what this class is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    A unique join code will be generated automatically. Share it with your
                    students so they can join the class.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" /> Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Class
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/teacher/dashboard')}
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
