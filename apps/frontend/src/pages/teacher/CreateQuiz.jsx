import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, CardHeader, Button, Input, Textarea, Select, Alert, Badge, Spinner } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';

// Mode Card Component
function ModeCard({ icon, title, description, onClick, variant = 'primary' }) {
  const gradients = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600'
  };
  
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-dark-card rounded-2xl shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 border border-neutral-200 dark:border-dark-border overflow-hidden"
    >
      <div className="p-8 text-center">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${gradients[variant]} shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-slate-400 text-sm">
          {description}
        </p>
      </div>
      <div className={`h-1.5 bg-gradient-to-r ${gradients[variant]} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-neutral-300 dark:bg-dark-border rounded-full peer-checked:bg-primary-500 transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-text-dark dark:text-slate-100">{label}</div>
        {description && (
          <div className="text-sm text-neutral-500 dark:text-slate-400">{description}</div>
        )}
      </div>
    </label>
  );
}

// Preview Question Card
function PreviewQuestionCard({ question, index, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState({ ...question });

  const handleSave = () => {
    onEdit(index, editedQuestion);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion({ ...question });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl p-5 border-2 border-primary-300 dark:border-primary-600 shadow-md">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="warning">Editing Question {index + 1}</Badge>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-1">Question</label>
            <textarea
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-lg text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedQuestion.questionText}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, questionText: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-dark dark:text-slate-100">Options</label>
            {editedQuestion.options.map((option, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`edit-correct-${index}`}
                  checked={editedQuestion.correctOptionIndex === oIdx}
                  onChange={() => setEditedQuestion({ ...editedQuestion, correctOptionIndex: oIdx })}
                  className="w-4 h-4 text-primary-500"
                />
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-lg text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...editedQuestion.options];
                    newOptions[oIdx] = e.target.value;
                    setEditedQuestion({ ...editedQuestion, options: newOptions });
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-1">Explanation</label>
            <textarea
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-lg text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
              rows={2}
              placeholder="Why is this the correct answer?"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave}>Save Changes</Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-dark-hover rounded-xl p-5 border border-neutral-200 dark:border-dark-border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary">Q{index + 1}</Badge>
          {question.difficulty && (
            <Badge variant={question.difficulty === 'hard' ? 'error' : question.difficulty === 'medium' ? 'warning' : 'success'}>
              {question.difficulty}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            title="Edit question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(index)}
            className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
            title="Delete question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <p className="font-medium text-text-dark dark:text-slate-100 mb-3">{question.questionText}</p>
      
      <div className="space-y-2 mb-3">
        {question.options.map((option, oIdx) => (
          <div
            key={oIdx}
            className={`px-3 py-2 rounded-lg text-sm ${
              oIdx === question.correctOptionIndex
                ? 'bg-success-100 dark:bg-success-100 border border-success-300 dark:border-success-300'
                : 'bg-white dark:bg-dark-card text-neutral-600 dark:text-slate-400 border border-neutral-200 dark:border-dark-border'
            }`}
            style={oIdx === question.correctOptionIndex ? { color: '#111111' } : undefined}
          >
            <span className="font-medium">{String.fromCharCode(65 + oIdx)}.</span> {option}
            {oIdx === question.correctOptionIndex && (
              <span className="ml-2 text-xs font-semibold">✓ Correct</span>
            )}
          </div>
        ))}
      </div>

      {question.explanation && (
        <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">Explanation:</span>
              <p className="text-sm text-primary-700 dark:text-primary-300">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateQuiz() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();

  const [mode, setMode] = useState('choose'); // 'choose', 'manual', 'ai', 'pdf', 'preview'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  // AI generation fields
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [quizName, setQuizName] = useState(''); // Teacher-entered quiz name (displayed to students)

  // PDF generation fields
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewSource, setPreviewSource] = useState(null); // 'ai' or 'pdf' - to know which regenerate to use

  // Visibility settings (for preview publish)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [showResultsToStudents, setShowResultsToStudents] = useState(true);

  const { createQuiz, previewQuizWithAI, publishQuizFromPreview, generateQuizFromFiles, isLoading, error, clearError } = useQuizStore();
  const harmlessStoreError = error === 'Failed to fetch quizzes' ? null : error;

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (!classId) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" className="mb-6">
            No class selected. Please create quiz from a class page.
          </Alert>
          <Button onClick={() => navigate('/teacher/dashboard')}>
            ← Back to Dashboard
          </Button>
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

  // Generate AI Preview instead of direct creation
  const handleGeneratePreview = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Validate quiz name
    if (!quizName.trim()) {
      setErrors({ quizName: 'Quiz name is required' });
      return;
    }

    if (!topic.trim()) {
      setErrors({ topic: 'Topic is required' });
      return;
    }

    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 20) {
      setErrors({ questionCount: 'Question count must be between 1 and 20' });
      return;
    }

    // Time limit is required - no default
    if (!timeLimit || !timeLimit.trim()) {
      setErrors({ timeLimit: 'Time limit is required' });
      return;
    }

    const duration = parseInt(timeLimit);
    if (isNaN(duration) || duration < 1) {
      setErrors({ timeLimit: 'Time limit must be at least 1 minute' });
      return;
    }

    const result = await previewQuizWithAI(classId, topic.trim(), difficulty, count, duration);
    if (result.success) {
      // Override the auto-generated title with the teacher's quiz name
      const previewWithCustomName = {
        ...result.data,
        title: quizName.trim(),
        description: result.data.description || `Quiz about ${topic.trim()}`,
      };
      setPreviewData(previewWithCustomName);
      setPreviewSource('ai');
      setMode('preview');
    } else {
      setErrors({ submit: result.error });
    }
  };

  // Generate quiz from uploaded PDF/DOC files
  const handleGenerateFromFiles = async (e) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Validate quiz name
    if (!quizName.trim()) {
      setErrors({ quizName: 'Quiz name is required' });
      return;
    }

    if (uploadedFiles.length === 0) {
      setErrors({ files: 'Please upload at least one file' });
      return;
    }

    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 50) {
      setErrors({ questionCount: 'Question count must be between 1 and 50' });
      return;
    }

    // Time limit is required
    if (!timeLimit || !timeLimit.trim()) {
      setErrors({ timeLimit: 'Time limit is required' });
      return;
    }

    const duration = parseInt(timeLimit);
    if (isNaN(duration) || duration < 1) {
      setErrors({ timeLimit: 'Time limit must be at least 1 minute' });
      return;
    }

    const result = await generateQuizFromFiles(classId, uploadedFiles, count, difficulty, duration);
    if (result.success) {
      // Override the auto-generated title with the teacher's quiz name
      const previewWithCustomName = {
        ...result.data,
        title: quizName.trim(),
        description: result.data.description || 'Quiz generated from uploaded documents',
      };
      setPreviewData(previewWithCustomName);
      setPreviewSource('pdf');
      setMode('preview');
    } else {
      setErrors({ submit: result.error });
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx'].includes(ext);
    });
    
    if (validFiles.length !== files.length) {
      setErrors({ files: 'Some files were rejected. Only PDF, DOC, and DOCX files are allowed.' });
    } else {
      setErrors({});
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  // Remove uploaded file
  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Edit preview question
  const handleEditPreviewQuestion = (index, updatedQuestion) => {
    const updatedQuestions = [...previewData.questions];
    updatedQuestions[index] = updatedQuestion;
    setPreviewData({ ...previewData, questions: updatedQuestions });
  };

  // Delete preview question
  const handleDeletePreviewQuestion = (index) => {
    if (previewData.questions.length <= 1) {
      setErrors({ preview: 'Quiz must have at least one question' });
      return;
    }
    const updatedQuestions = previewData.questions.filter((_, i) => i !== index);
    setPreviewData({ ...previewData, questions: updatedQuestions, questionCount: updatedQuestions.length });
  };

  // Publish the previewed quiz
  const handlePublishQuiz = async () => {
    setErrors({});
    clearError();

    const quizData = {
      title: previewData.title,
      description: previewData.description,
      difficulty: previewData.difficulty,
      durationMinutes: previewData.durationMinutes,
      questions: previewData.questions,
      showCorrectAnswers,
      showExplanations,
      showResultsToStudents,
    };

    const result = await publishQuizFromPreview(classId, quizData);
    if (result.success) {
      navigate(`/teacher/class/${classId}`);
    } else {
      setErrors({ submit: result.error });
    }
  };

  // Regenerate with same settings
  const handleRegenerate = async () => {
    if (previewSource === 'pdf') {
      setMode('pdf');
    } else {
      setMode('ai');
    }
    setPreviewData(null);
  };

  if (mode === 'choose') {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          <PageHeader
            title="Create New Quiz"
            subtitle="Choose how you'd like to create your quiz"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ModeCard
              variant="primary"
              onClick={() => setMode('manual')}
              icon={
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              title="Manual Creation"
              description="Create quiz questions yourself with full control over content and answers"
            />

            <ModeCard
              variant="secondary"
              onClick={() => setMode('ai')}
              icon={
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="AI Generation"
              description="Let AI generate questions automatically based on your chosen topic"
            />

            <ModeCard
              variant="primary"
              onClick={() => setMode('pdf')}
              icon={
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
                </svg>
              }
              title="Generate from PDF"
              description="Upload PDF or Word documents and let AI create questions from the content"
            />
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/teacher/class/${classId}`)}
              className="text-neutral-600 dark:text-slate-400 hover:text-text-dark dark:hover:text-slate-100"
            >
              ← Cancel and go back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Preview mode - show generated questions with edit capability
  if (mode === 'preview' && previewData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to settings
          </button>

          <div className="bg-gradient-to-r from-success-500 to-success-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Review Your Quiz</h1>
                <p className="text-success-100 text-sm mt-1">
                  {previewData.questions.length} questions generated • Review, edit, then publish
                </p>
              </div>
            </div>
          </div>

          {(harmlessStoreError || errors.submit || errors.preview) && (
            <Alert type="error" className="mb-6">
              {harmlessStoreError || errors.submit || errors.preview}
            </Alert>
          )}

          {/* Quiz Info Card - Editable Title and Description */}
          <Card className="shadow-soft mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                  Quiz Name (displayed to students)
                </label>
                <input
                  type="text"
                  value={previewData.title}
                  onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-text-dark dark:text-slate-100 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter quiz name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={previewData.description || ''}
                  onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-600 dark:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Add a description for this quiz..."
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant={previewData.difficulty === 'hard' ? 'error' : previewData.difficulty === 'medium' ? 'warning' : 'success'}>
                  {previewData.difficulty}
                </Badge>
                <Badge variant="primary">{previewData.durationMinutes} min</Badge>
                <Badge variant="secondary">{previewData.questions.length} questions</Badge>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100">Questions</h3>
            {previewData.questions.map((question, index) => (
              <PreviewQuestionCard
                key={index}
                question={question}
                index={index}
                onEdit={handleEditPreviewQuestion}
                onDelete={handleDeletePreviewQuestion}
              />
            ))}
          </div>

          {/* Visibility Settings */}
          <Card className="shadow-soft mb-8">
            <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4">Student Result Settings</h3>
            <p className="text-sm text-neutral-500 dark:text-slate-400 mb-4">Control what students see after completing the quiz</p>
            
            <div className="space-y-4">
              <ToggleSwitch
                label="Show Results to Students"
                description="Allow students to see their score and submission details"
                checked={showResultsToStudents}
                onChange={setShowResultsToStudents}
              />
              <ToggleSwitch
                label="Show Correct Answers"
                description="Show which answers were correct after submission"
                checked={showCorrectAnswers}
                onChange={setShowCorrectAnswers}
              />
              <ToggleSwitch
                label="Show Explanations"
                description="Display explanations for each question"
                checked={showExplanations}
                onChange={setShowExplanations}
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handlePublishQuiz} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Quiz
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleRegenerate}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/teacher/class/${classId}`)}>
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
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          <button
            onClick={() => setMode('choose')}
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>

          <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Generate Quiz with AI</h1>
                <p className="text-secondary-100 text-sm mt-1">
                  Let AI create engaging questions for your students
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-soft">
            {(harmlessStoreError || errors.submit) && (
              <Alert type="error" className="mb-6">
                {harmlessStoreError || errors.submit}
              </Alert>
            )}

            <form onSubmit={handleGeneratePreview} className="space-y-6">
              <Input
                label="Quiz Name"
                type="text"
                placeholder="e.g., Chapter 5 Quiz, Midterm Review"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                error={errors.quizName}
                required
                autoFocus
              />

              <Input
                label="Topic (for AI generation)"
                type="text"
                placeholder="e.g., World War II, Python Programming, Algebra"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                error={errors.topic}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                    Difficulty
                  </label>
                  <select
                    className="w-full h-[50px] px-4 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Easy - Basic recall questions</option>
                    <option value="medium" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Medium - Application & analysis</option>
                    <option value="hard" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Hard - Critical thinking required</option>
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
                label="Time Limit (minutes)"
                type="number"
                min="1"
                max="180"
                placeholder="Enter time limit..."
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                error={errors.timeLimit}
                required
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
                      <strong>Preview before publishing!</strong> You'll be able to review, edit, and customize all generated questions before making the quiz available to students.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Spinner size="sm" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Generate Preview
                    </>
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

  // PDF mode - Generate from uploaded files
  if (mode === 'pdf') {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          <button
            onClick={() => setMode('choose')}
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>

          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Generate Quiz from Documents</h1>
                <p className="text-primary-100 text-sm mt-1">
                  Upload PDF or Word documents and AI will create questions from the content
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-soft">
            {(harmlessStoreError || errors.submit) && (
              <Alert type="error" className="mb-6">
                {harmlessStoreError || errors.submit}
              </Alert>
            )}

            <form onSubmit={handleGenerateFromFiles} className="space-y-6">
              {/* Quiz Name */}
              <Input
                label="Quiz Name"
                type="text"
                placeholder="e.g., Chapter 5 Quiz, Final Exam Review"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                error={errors.quizName}
                required
                autoFocus
              />

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                  Upload Documents
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    errors.files
                      ? 'border-error-300 bg-error-50 dark:border-error-700 dark:bg-error-900/20'
                      : 'border-neutral-300 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-600 bg-neutral-50 dark:bg-dark-hover'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="mx-auto h-12 w-12 text-neutral-400 dark:text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-neutral-600 dark:text-slate-400 font-medium">
                    Drop files here or click to upload
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">
                    PDF, DOC, DOCX files up to 10MB each
                  </p>
                </div>
                {errors.files && (
                  <p className="mt-2 text-sm text-error-500">{errors.files}</p>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-dark dark:text-slate-100">
                    Uploaded Files ({uploadedFiles.length})
                  </label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-text-dark dark:text-slate-100 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                    Difficulty
                  </label>
                  <select
                    className="w-full h-[50px] px-4 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Easy - Basic recall</option>
                    <option value="medium" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Medium - Application</option>
                    <option value="hard" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Hard - Critical thinking</option>
                  </select>
                </div>

                <Input
                  label="Number of Questions"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  error={errors.questionCount}
                  required
                />

                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Enter time limit..."
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  error={errors.timeLimit}
                  required
                />
              </div>

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
                      <strong>AI-Powered Generation!</strong> Questions will be created based on the content of your uploaded documents. You'll be able to review and edit all questions before publishing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || uploadedFiles.length === 0} 
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Generate Quiz
                    </>
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
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => setMode('choose')}
          className="inline-flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to options
        </button>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Create Quiz Manually</h1>
              <p className="text-primary-100 text-sm mt-1">
                Build your quiz with custom questions and answers
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-soft">
          {(harmlessStoreError || errors.submit) && (
            <Alert type="error" className="mb-6">
              {harmlessStoreError || errors.submit}
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
              <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-text-dark dark:text-slate-100 placeholder-neutral-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[100px] resize-y"
                placeholder="Brief description of the quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Time Limit (minutes, optional)"
                type="number"
                min="1"
                placeholder="30"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-text-dark dark:text-slate-100 mb-2">
                  Difficulty
                </label>
                <select
                  className="w-full h-[50px] px-4 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-text-dark dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Easy</option>
                  <option value="medium" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Medium</option>
                  <option value="hard" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Hard</option>
                </select>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-dark-border pt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100">
                  Questions
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </Button>
              </div>

              {errors.questions && (
                <Alert type="error" className="mb-4">
                  {errors.questions}
                </Alert>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 dark:bg-dark-hover rounded-xl border-2 border-dashed border-neutral-200 dark:border-dark-border">
                  <svg className="w-12 h-12 mx-auto text-neutral-300 dark:text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-neutral-500 dark:text-slate-400 font-medium">No questions yet</p>
                  <p className="text-neutral-400 dark:text-slate-400 text-sm mt-1">Click "Add Question" to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-neutral-50 dark:bg-dark-hover rounded-xl p-5 border border-neutral-200 dark:border-dark-border">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="primary">Question {qIndex + 1}</Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
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

                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-text-dark dark:text-slate-100">
                          Answer Options
                        </label>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <label className="relative flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswer === oIndex}
                                onChange={() =>
                                  handleQuestionChange(qIndex, 'correctAnswer', oIndex)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-dark-border peer-checked:border-success-500 peer-checked:bg-success-500 transition-all flex items-center justify-center">
                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </label>
                            <input
                              type="text"
                              placeholder={`Option ${oIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, e.target.value)
                              }
                              className="flex-1 px-4 py-2.5 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg text-text-dark dark:text-slate-100 placeholder-neutral-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              required
                            />
                          </div>
                        ))}
                        <p className="text-xs text-neutral-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Select the correct answer by clicking the circle
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-6 border-t border-neutral-200 dark:border-dark-border">
              <Button type="submit" disabled={isLoading || questions.length === 0} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Quiz
                  </>
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
