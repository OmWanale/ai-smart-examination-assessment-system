import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from '../components/UI';
import { useQuizStore } from '../store/quizStore';
import { MainLayout } from '../components/Layout';

export function CreateQuizPage() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();
  const { createQuiz, generateQuizWithAI, isLoading, error } = useQuizStore();

  const [mode, setMode] = useState('manual'); // manual or ai
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'medium',
    durationMinutes: 30,
    topic: '',
    questionCount: 5,
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title) {
      setErrors((prev) => ({ ...prev, title: 'Quiz title is required' }));
      return;
    }

    if (mode === 'ai') {
      if (!formData.topic) {
        setErrors((prev) => ({ ...prev, topic: 'Topic is required' }));
        return;
      }
      const result = await generateQuizWithAI(
        classId,
        formData.topic,
        formData.difficulty,
        formData.questionCount
      );
      if (result.success) {
        navigate(`/teacher/class/${classId}`);
      }
    } else {
      // Manual quiz - navigate to editor
      navigate(`/teacher/quiz-editor?classId=${classId}&title=${formData.title}`);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-2">Create Quiz</h1>
        <p className="text-gray-600 mb-8">Choose how to create your quiz</p>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card
            onClick={() => setMode('manual')}
            className={`cursor-pointer transition-all ${
              mode === 'manual' ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <h3 className="text-lg font-bold mb-2">📝 Manual</h3>
            <p className="text-sm text-gray-600">Create questions manually</p>
          </Card>
          <Card
            onClick={() => setMode('ai')}
            className={`cursor-pointer transition-all ${
              mode === 'ai' ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <h3 className="text-lg font-bold mb-2">⚡ AI Generate</h3>
            <p className="text-sm text-gray-600">AI creates questions</p>
          </Card>
        </div>

        <Card>
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Quiz Title"
              placeholder="e.g., Chapter 3 Review"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              error={errors.title}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="input"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <Input
                label="Duration (minutes)"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    durationMinutes: parseInt(e.target.value),
                  }))
                }
              />
            </div>

            {mode === 'ai' && (
              <>
                <Input
                  label="Topic"
                  placeholder="e.g., Photosynthesis"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, topic: e.target.value }))
                  }
                  error={errors.topic}
                />

                <div>
                  <label className="label">Number of Questions</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={formData.questionCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        questionCount: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.questionCount} questions
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === 'ai'
                    ? 'Generating...'
                    : 'Creating...'
                  : mode === 'ai'
                  ? 'Generate Quiz'
                  : 'Create Quiz'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/teacher/class/${classId}`)}
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
