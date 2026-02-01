import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from '../components/UI';
import { useQuizStore } from '../store/quizStore';
import { MainLayout } from '../components/Layout';

export function CreateClassPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { createClass, isLoading, error } = useQuizStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!name) setErrors((prev) => ({ ...prev, name: 'Class name is required' }));

    if (name) {
      const result = await createClass(name, description);
      if (result.success) {
        navigate('/teacher/dashboard');
      } else {
        setErrors((prev) => ({ ...prev, submit: result.error }));
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-2">Create New Class</h1>
        <p className="text-gray-600 mb-8">Set up a class and get your join code</p>

        <Card>
          {error && <Alert type="error" className="mb-4">{error}</Alert>}
          {errors.submit && <Alert type="error" className="mb-4">{errors.submit}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Class Name"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <div>
              <label className="label">Description (optional)</label>
              <textarea
                placeholder="Add a description for your class..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="input resize-none"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Class'}
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
