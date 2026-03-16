import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert, Spinner, Badge } from '../../components/UI';
import { useQuizStore } from '../../store/quizStore';
import { MainLayout, PageHeader } from '../../components/Layout';

// Mode Selection Card
function ModeCard({ selected, onClick, icon, title, description, badge }) {
  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
        selected
          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-900/20 shadow-warm'
          : 'border-stone-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-700'
      }`}
    >
      {badge && (
        <Badge variant="accent" size="sm" className="absolute top-3 right-3">
          {badge}
        </Badge>
      )}
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-muted dark:text-slate-400">{description}</p>
      {selected && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

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
      <PageHeader
        title="Create Quiz"
        subtitle="Choose how to create your quiz"
      />

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ModeCard
          selected={mode === 'manual'}
          onClick={() => setMode('manual')}
          icon="📝"
          title="Manual Creation"
          description="Craft your own questions with full control over content and options"
        />
        <ModeCard
          selected={mode === 'ai'}
          onClick={() => setMode('ai')}
          icon="✨"
          title="AI Generation"
          description="Let AI create questions based on your topic - fast and intelligent"
          badge="Recommended"
        />
      </div>

      <Card className="max-w-2xl">
        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Quiz Title"
            placeholder="e.g., Chapter 3 Review"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            error={errors.title}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
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
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
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
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {mode === 'ai' && (
            <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl border border-primary-200 dark:border-primary-800 space-y-5">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                <span className="text-xl">✨</span>
                <span className="font-semibold">AI Settings</span>
              </div>
              
              <Input
                label="Topic"
                placeholder="e.g., Photosynthesis, World War II, Python Basics"
                value={formData.topic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, topic: e.target.value }))
                }
                error={errors.topic}
                helper="Be specific for better question quality"
              />

              <div>
                <label className="label">Number of Questions: <span className="text-primary-600 dark:text-primary-400 font-semibold">{formData.questionCount}</span></label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={formData.questionCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      questionCount: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-stone-200 dark:bg-dark-border rounded-full appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-text-muted dark:text-slate-500 mt-1">
                  <span>3 questions</span>
                  <span>20 questions</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  {mode === 'ai' ? 'Generating...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === 'ai' ? '✨' : '📝'}
                  {mode === 'ai' ? 'Generate Quiz' : 'Create Quiz'}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/teacher/class/${classId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </MainLayout>
  );
}
