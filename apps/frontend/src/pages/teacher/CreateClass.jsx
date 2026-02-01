import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Input, Alert } from '../../components/UI.jsx';
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

    // Create class
    const result = await createClass(name.trim(), description.trim());
    if (result.success) {
      setCreatedClass(result.data);
    } else {
      setErrors({ submit: result.error });
    }
  };

  const handleGoToClass = () => {
    if (createdClass) {
      navigate(`/teacher/class/${createdClass._id}`);
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
          <Card>
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-dark mb-2">
                Class Created Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Share this join code with your students
              </p>

              <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">Join Code</p>
                <p className="text-4xl font-bold text-primary-600 tracking-wider font-mono">
                  {createdClass.joinCode}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-text-dark mb-2">{createdClass.name}</h3>
                {createdClass.description && (
                  <p className="text-gray-600 text-sm">{createdClass.description}</p>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleGoToClass}>Go to Class</Button>
                <Button variant="outline" onClick={handleCreateAnother}>
                  Create Another Class
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-6">Create New Class</h1>

        <Card>
          {(error || errors.submit) && (
            <Alert type="error" className="mb-4">
              {error || errors.submit}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Class Name"
              type="text"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              autoFocus
            />

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input w-full min-h-[120px]"
                placeholder="Describe what this class is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

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
                    A unique join code will be generated automatically. Share it with your
                    students so they can join the class.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Creating...
                  </span>
                ) : (
                  'Create Class'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
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
