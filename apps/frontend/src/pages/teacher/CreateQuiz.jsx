import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Input, Alert, Badge } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

export function CreateQuiz() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();

  const [mode, setMode] = useState('choose'); // 'choose', 'manual', 'ai'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  // AI generation fields
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState('5');

  const { createQuiz, generateQuizWithAI, isLoading, error, clearError } = useQuizStore();

  if (!classId) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            No class selected. Please create quiz from a class page.
          </Alert>
          <Button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Validation
    if (!title.trim()) {
      setErrors({ title: 'Quiz title is required' });
      return;
    }

    if (questions.length === 0) {
      setErrors({ questions: 'Add at least one question' });
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setErrors({ questions: `Question ${i + 1} text is required` });
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setErrors({ questions: `All options for question ${i + 1} must be filled` });
        return;
      }
    }

    const quizData = {
      title: title.trim(),
      description: description.trim(),
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      difficulty,
      questions,
    };

    const result = await createQuiz(classId, quizData);
    if (result.success) {
      navigate(`/teacher/class/${classId}`);
    } else {
      setErrors({ submit: result.error });
    }
  };

  const handleSubmitAI = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    if (!topic.trim()) {
      setErrors({ topic: 'Topic is required' });
      return;
    }

    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 20) {
      setErrors({ questionCount: 'Question count must be between 1 and 20' });
      return;
    }

    const result = await generateQuizWithAI(classId, topic.trim(), difficulty, count);
    if (result.success) {
      navigate(`/teacher/class/${classId}`);
    } else {
      setErrors({ submit: result.error });
    }
  };

  if (mode === 'choose') {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark mb-6">Create New Quiz</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setMode('manual')}
            >
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <svg
                    className="h-8 w-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-dark mb-2">Manual Creation</h3>
                <p className="text-gray-600 text-sm">
                  Create quiz questions yourself with full control
                </p>
              </div>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setMode('ai')}
            >
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary-100 mb-4">
                  <svg
                    className="h-8 w-8 text-secondary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-dark mb-2">AI Generation</h3>
                <p className="text-gray-600 text-sm">
                  Let AI generate questions based on a topic
                </p>
              </div>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate(`/teacher/class/${classId}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (mode === 'ai') {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => setMode('choose')}
          >
            ← Back
          </Button>

          <h1 className="text-3xl font-bold text-text-dark mb-6">Generate Quiz with AI</h1>

          <Card>
            {(error || errors.submit) && (
              <Alert type="error" className="mb-4">
                {error || errors.submit}
              </Alert>
            )}

            <form onSubmit={handleSubmitAI} className="space-y-4">
              <Input
                label="Topic"
                type="text"
                placeholder="e.g., World War II, Python Programming, Algebra"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                error={errors.topic}
                required
                autoFocus
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    className="input w-full"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <Input
                  label="Number of Questions"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  error={errors.questionCount}
                  required
                />
              </div>

              <Input
                label="Time Limit (minutes, optional)"
                type="number"
                min="1"
                placeholder="30"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
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
                      AI will generate multiple-choice questions based on your topic and
                      preferences. This may take a few seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Generating...
                    </span>
                  ) : (
                    '✨ Generate Quiz'
                  )}
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

  // Manual mode
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setMode('choose')}>
          ← Back
        </Button>

        <h1 className="text-3xl font-bold text-text-dark mb-6">Create Quiz Manually</h1>

        <Card>
          {(error || errors.submit) && (
            <Alert type="error" className="mb-4">
              {error || errors.submit}
            </Alert>
          )}

          <form onSubmit={handleSubmitManual} className="space-y-6">
            <Input
              label="Quiz Title"
              type="text"
              placeholder="e.g., Chapter 5 Test"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
              autoFocus
            />

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input w-full min-h-[80px]"
                placeholder="Brief description of the quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Time Limit (minutes, optional)"
                type="number"
                min="1"
                placeholder="30"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />

              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input w-full"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-dark">Questions</h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  + Add Question
                </Button>
              </div>

              {errors.questions && (
                <Alert type="error" className="mb-4">
                  {errors.questions}
                </Alert>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions yet. Click "Add Question" to start.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="primary">Question {qIndex + 1}</Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <Input
                        label="Question Text"
                        type="text"
                        placeholder="Enter your question..."
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        required
                      />

                      <div className="mt-4 space-y-2">
                        <label className="label">Answer Options</label>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswer === oIndex}
                              onChange={() =>
                                handleQuestionChange(qIndex, 'correctAnswer', oIndex)
                              }
                              className="w-4 h-4 text-primary-600"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${oIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, e.target.value)
                              }
                              className="input flex-1"
                              required
                            />
                          </div>
                        ))}
                        <p className="text-xs text-gray-600 mt-2">
                          Select the radio button for the correct answer
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={isLoading || questions.length === 0}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Creating...
                  </span>
                ) : (
                  'Create Quiz'
                )}
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
