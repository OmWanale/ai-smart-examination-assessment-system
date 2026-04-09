import { useState } from 'react';
import { MainLayout, PageHeader } from '../../components/Layout';
import { Card, Button, Input, Alert, Badge, Spinner } from '../../components/UI';
import { paperAPI } from '../../api/client';

// File Upload Icon
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// Document Icon
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Download Icon
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Trash Icon
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Edit Icon
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// Check Icon (for Save)
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// X Icon (for Cancel)
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Mode configuration
const PAPER_MODES = {
  '20-marks': {
    id: '20-marks',
    label: '20 Marks Paper',
    description: 'Structured exam with 3 sections (A, B, C)',
    totalMarks: 20,
  },
  '60-marks': {
    id: '60-marks',
    label: '60 Marks Paper',
    description: 'Full exam with 5 sections (A, B, C, D, E)',
    totalMarks: 60,
  },
  'custom': {
    id: 'custom',
    label: 'Generate Questions',
    description: 'Custom question generation with suggested marks',
    totalMarks: null,
  },
};

export function QuestionPaper() {
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState('20-marks');
  const [difficulty, setDifficulty] = useState('medium');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Custom mode specific
  const [numQuestions, setNumQuestions] = useState('10');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [paper, setPaper] = useState(null);
  
  // Edit state: { sectionIndex, questionIndex } or { questionIndex } for custom mode
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editMarks, setEditMarks] = useState('');

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx'].includes(ext);
    });
    
    if (validFiles.length !== newFiles.length) {
      setError('Some files were rejected. Only PDF, DOC, and DOCX files are allowed.');
    } else {
      setError(null);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setError(null);
    
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    // Validate custom mode inputs
    if (mode === 'custom') {
      const num = parseInt(numQuestions);
      if (isNaN(num) || num < 1 || num > 50) {
        setError('Number of questions must be between 1 and 50');
        return;
      }
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('mode', mode);
      formData.append('difficulty', difficulty);
      
      if (mode === 'custom') {
        formData.append('numQuestions', numQuestions);
      }

      const response = await paperAPI.generatePaper(formData);
      
      if (response.data?.success) {
        setPaper(response.data.data.paper);
      } else {
        setError(response.data?.message || 'Failed to generate question paper');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate question paper');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!paper) return;
    
    setIsDownloading(true);
    
    try {
      const response = await paperAPI.downloadPaper({
        paper,
        examTitle: examTitle || paper.title,
        duration,
        instructions: customInstructions,
        mode
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-paper-${mode}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setPaper(null);
    setError(null);
    setEditingQuestion(null);
  };

  // Start editing a question
  const startEditQuestion = (sectionIndex, questionIndex, questionText, marks) => {
    setEditingQuestion({ sectionIndex, questionIndex });
    setEditText(questionText);
    setEditMarks(marks?.toString() || '');
  };

  // Start editing a custom question (flat array)
  const startEditCustomQuestion = (questionIndex, questionText, marks) => {
    setEditingQuestion({ questionIndex, isCustom: true });
    setEditText(questionText);
    setEditMarks(marks?.toString() || '');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditText('');
    setEditMarks('');
  };

  // Save edited question
  const saveEditQuestion = () => {
    if (!editingQuestion || !paper) return;
    
    const updatedPaper = { ...paper };
    
    if (editingQuestion.isCustom) {
      // Custom mode - flat questions array
      const updatedQuestions = [...(updatedPaper.questions || [])];
      const q = updatedQuestions[editingQuestion.questionIndex];
      if (typeof q === 'object') {
        updatedQuestions[editingQuestion.questionIndex] = {
          ...q,
          questionText: editText,
          suggestedMarks: editMarks ? parseInt(editMarks) : q.suggestedMarks
        };
      }
      updatedPaper.questions = updatedQuestions;
    } else {
      // Sectioned mode
      const updatedSections = [...(updatedPaper.sections || [])];
      const section = { ...updatedSections[editingQuestion.sectionIndex] };
      const updatedQuestions = [...(section.questions || [])];
      const q = updatedQuestions[editingQuestion.questionIndex];
      
      if (typeof q === 'object') {
        updatedQuestions[editingQuestion.questionIndex] = {
          ...q,
          questionText: editText,
          marks: editMarks ? parseInt(editMarks) : q.marks
        };
      } else {
        // String question - convert to object if marks provided
        updatedQuestions[editingQuestion.questionIndex] = editText;
      }
      
      section.questions = updatedQuestions;
      updatedSections[editingQuestion.sectionIndex] = section;
      updatedPaper.sections = updatedSections;
    }
    
    setPaper(updatedPaper);
    cancelEdit();
  };

  // Get mode info label for display
  const getModeInfo = () => {
    const modeConfig = PAPER_MODES[mode];
    if (mode === '20-marks') {
      return 'Section A: 3 × 3 marks (solve 2) | Section B: 2 × 7 marks (solve 1) | Section C: 2 × 7 marks (solve 1)';
    } else if (mode === '60-marks') {
      return 'Section A: 7 × 3 marks (solve 5) | Sections B-E: 3 questions each (4+5+6 marks, solve any 3 sections)';
    }
    return modeConfig?.description || '';
  };

  // Render a question with proper formatting and edit capability
  const renderQuestionItem = (question, qIndex, sectionIndex, sectionMarksPerQuestion, isCustom = false) => {
    const questionText = typeof question === 'object' ? question.questionText : question;
    const questionMarks = typeof question === 'object' 
      ? (question.marks || question.suggestedMarks) 
      : sectionMarksPerQuestion;
    
    const isEditing = isCustom 
      ? (editingQuestion?.isCustom && editingQuestion?.questionIndex === qIndex)
      : (!editingQuestion?.isCustom && editingQuestion?.sectionIndex === sectionIndex && editingQuestion?.questionIndex === qIndex);
    
    return (
      <div
        key={qIndex}
        className="p-4 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg group hover:shadow-sm transition-shadow"
        style={{ marginBottom: '10px' }}
      >
        {isEditing ? (
          // Edit Mode
          <div className="space-y-3">
            {/* Question number + textarea */}
            <div className="flex items-start gap-0">
              <span 
                className="flex-shrink-0 font-medium pt-2"
                style={{ width: '24px', color: '#202124', lineHeight: '1.5', fontSize: '15px' }}
              >
                <span className="dark:text-slate-100">{qIndex + 1}.</span>
              </span>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 p-3 border border-neutral-300 dark:border-dark-border rounded-lg bg-neutral-50 dark:bg-dark-hover dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                style={{ lineHeight: '1.5', fontSize: '15px', minHeight: '80px' }}
                rows={3}
                placeholder="Enter question text..."
              />
            </div>
            {/* Marks input + buttons */}
            <div className="flex items-center gap-3 pl-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: '#5f6368' }}>
                  <span className="dark:text-slate-400">Marks:</span>
                </label>
                <input
                  type="number"
                  value={editMarks}
                  onChange={(e) => setEditMarks(e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-neutral-300 dark:border-dark-border rounded-lg bg-neutral-50 dark:bg-dark-hover dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ color: '#202124' }}
                  min="1"
                  max="20"
                />
              </div>
              <div className="flex-1" />
              <Button size="sm" onClick={saveEditQuestion}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // View Mode - Proper flex alignment for multi-line questions
          <div className="flex items-start gap-0">
            {/* Question Number - Fixed width, text-based */}
            <span 
              className="flex-shrink-0 font-medium"
              style={{ width: '24px', color: '#202124', lineHeight: '1.5', fontSize: '15px' }}
            >
              <span className="dark:text-slate-100">{qIndex + 1}.</span>
            </span>
            
            {/* Question Text - Flex grow, wraps properly, marks at end */}
            <div className="flex-1 min-w-0" style={{ lineHeight: '1.5', fontSize: '15px' }}>
              <span style={{ color: '#202124' }}>
                <span className="dark:text-slate-100">
                  {questionText}
                  {questionMarks && (
                    <span className="text-neutral-600 dark:text-slate-400 ml-1">
                      ({questionMarks} marks)
                    </span>
                  )}
                </span>
              </span>
            </div>
            
            {/* Edit Button - Visible on hover */}
            <button
              onClick={() => {
                if (isCustom) {
                  startEditCustomQuestion(qIndex, questionText, questionMarks);
                } else {
                  startEditQuestion(sectionIndex, qIndex, questionText, questionMarks);
                }
              }}
              className="flex-shrink-0 ml-2 p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Edit question"
            >
              <EditIcon />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render section preview based on paper structure
  const renderSectionPreview = (section, sIndex) => {
    return (
      <div key={sIndex} style={{ marginBottom: '20px' }}>
        {/* Section Header */}
        <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 border-b-2 border-primary-500">
          <h3 className="text-lg font-bold" style={{ color: '#202124' }}>
            <span className="dark:text-slate-100">{section.title}</span>
          </h3>
          {section.marksPerQuestion && (
            <Badge variant="primary">{section.marksPerQuestion} marks each</Badge>
          )}
          {section.totalMarks && (
            <Badge variant="secondary">Total: {section.totalMarks} marks</Badge>
          )}
        </div>
        
        {/* Section Instruction - Italic */}
        {section.instruction && (
          <p className="text-sm italic mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700" style={{ color: '#b45309' }}>
            <span className="dark:text-amber-400">📝 {section.instruction}</span>
          </p>
        )}

        {/* Questions List - 10px spacing between questions */}
        <div>
          {section.questions?.map((question, qIndex) => 
            renderQuestionItem(question, qIndex, sIndex, section.marksPerQuestion, false)
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title="Question Paper Generator"
        subtitle="Upload documents and generate structured exam papers"
      />

      {error && (
        <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!paper ? (
        // Input Form
        <div className="grid gap-6">
          {/* Mode Selector - Tab Style */}
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#202124' }}>
              <span className="dark:text-slate-100">Select Paper Type</span>
            </h3>
            
            <div className="border-b border-[#dadce0] dark:border-dark-border mb-4">
              <div className="flex items-center gap-1 overflow-x-auto">
                {Object.values(PAPER_MODES).map((modeOption) => (
                  <button
                    key={modeOption.id}
                    onClick={() => setMode(modeOption.id)}
                    className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors rounded-t-lg ${
                      mode === modeOption.id
                        ? 'text-[#1a73e8] border-[#1a73e8] font-semibold bg-blue-50 dark:bg-blue-900/20'
                        : 'text-[#5f6368] dark:text-slate-400 border-transparent hover:text-[#202124] dark:hover:text-slate-200 hover:bg-neutral-50 dark:hover:bg-dark-hover'
                    }`}
                  >
                    {modeOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Description */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {PAPER_MODES[mode].description}
              </p>
              {mode !== 'custom' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {getModeInfo()}
                </p>
              )}
            </div>
          </Card>

          {/* File Upload Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#202124' }}>
              <span className="dark:text-slate-100">Upload Documents</span>
            </h3>
            
            {/* Drop Zone */}
            <label className="relative block border-2 border-dashed border-neutral-300 dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-500">
                  <UploadIcon />
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#202124' }}>
                    <span className="dark:text-slate-100">Click to upload or drag and drop</span>
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#5f6368' }}>
                    <span className="dark:text-slate-400">PDF, DOC, DOCX (max 10MB each)</span>
                  </p>
                </div>
              </div>
            </label>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-dark-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary-500">
                        <DocumentIcon />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs" style={{ color: '#202124' }}>
                          <span className="dark:text-slate-100">{file.name}</span>
                        </p>
                        <p className="text-xs" style={{ color: '#5f6368' }}>
                          <span className="dark:text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Settings Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#202124' }}>
              <span className="dark:text-slate-100">Paper Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Difficulty - Always shown */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#202124' }}>
                  <span className="dark:text-slate-100">Difficulty</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-[50px] px-4 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-dark dark:text-slate-100"
                >
                  <option value="easy" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Easy</option>
                  <option value="medium" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Medium</option>
                  <option value="hard" style={{ color: '#202124', backgroundColor: '#ffffff' }}>Hard</option>
                </select>
              </div>

              {/* Custom mode - Number of questions */}
              {mode === 'custom' && (
                <Input
                  label="Number of Questions"
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                  max="50"
                />
              )}

              {/* Show total marks for predefined modes */}
              {mode !== 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#202124' }}>
                    <span className="dark:text-slate-100">Total Marks</span>
                  </label>
                  <div className="px-4 py-3 bg-neutral-100 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-600 dark:text-slate-400">
                    {PAPER_MODES[mode].totalMarks} marks (fixed)
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || files.length === 0}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate {mode === 'custom' ? 'Questions' : 'Question Paper'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        // Paper Preview
        <div className="space-y-6">
          {/* Paper Preview Card */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#202124' }}>
                  <span className="dark:text-slate-100">{paper.title || 'Question Paper'}</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="primary">
                    {mode === 'custom' ? 'Custom Questions' : `${PAPER_MODES[mode]?.totalMarks} marks`}
                  </Badge>
                  <Badge variant="secondary">{paper.sections?.length || 0} sections</Badge>
                  <Badge variant={difficulty === 'hard' ? 'error' : difficulty === 'medium' ? 'warning' : 'success'}>
                    {difficulty}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Generate New
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Spinner size="sm" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <DownloadIcon />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* PDF Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-neutral-50 dark:bg-dark-hover rounded-xl">
              <Input
                label="Exam Title (optional)"
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="e.g., Final Examination"
              />
              <Input
                label="Duration (optional)"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 3 hours"
              />
              <Input
                label="Additional Instructions (optional)"
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Use blue or black pen only"
              />
            </div>

            {/* Sections */}
            <div>
              {paper.sections?.map((section, sIndex) => renderSectionPreview(section, sIndex))}
              
              {/* For custom mode with flat questions array */}
              {mode === 'custom' && paper.questions && !paper.sections?.length && (
                <div style={{ marginBottom: '20px' }}>
                  {/* Section Header for Custom Questions */}
                  <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 border-b-2 border-primary-500">
                    <h3 className="text-lg font-bold" style={{ color: '#202124' }}>
                      <span className="dark:text-slate-100">Generated Questions</span>
                    </h3>
                    <Badge variant="primary">{paper.questions.length} questions</Badge>
                  </div>
                  
                  {/* Questions List */}
                  <div>
                    {paper.questions.map((question, qIndex) => 
                      renderQuestionItem(question, qIndex, null, null, true)
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
