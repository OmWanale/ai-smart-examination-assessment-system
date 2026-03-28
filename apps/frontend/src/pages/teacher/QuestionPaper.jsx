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

export function QuestionPaper() {
  const [files, setFiles] = useState([]);
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksPerQuestion, setMarksPerQuestion] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [paper, setPaper] = useState(null);

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

    const marks = parseInt(totalMarks);
    const perQuestion = parseInt(marksPerQuestion);

    if (isNaN(marks) || marks < 10 || marks > 500) {
      setError('Total marks must be between 10 and 500');
      return;
    }

    if (isNaN(perQuestion) || perQuestion < 1 || perQuestion > 20) {
      setError('Marks per question must be between 1 and 20');
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('totalMarks', marks.toString());
      formData.append('marksPerQuestion', perQuestion.toString());
      formData.append('difficulty', difficulty);

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
        instructions
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-paper-${Date.now()}.pdf`;
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
          {/* File Upload Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#202124' }}>
              Upload Documents
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

          {/* Exam Settings Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#202124' }}>
              <span className="dark:text-slate-100">Exam Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Total Marks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g., 100"
                min="10"
                max="500"
              />
              
              <Input
                label="Marks per Question"
                type="number"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(e.target.value)}
                placeholder="e.g., 5"
                min="1"
                max="20"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#202124' }}>
                  <span className="dark:text-slate-100">Difficulty</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ color: '#202124' }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
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
                    Generate Question Paper
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
                  <Badge variant="primary">Total: {paper.totalMarks} marks</Badge>
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
                label="Instructions (optional)"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Answer all questions"
              />
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {paper.sections?.map((section, sIndex) => (
                <div key={sIndex} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold" style={{ color: '#202124' }}>
                      <span className="dark:text-slate-100">{section.title}</span>
                    </h3>
                    <Badge variant="primary">{section.marksPerQuestion} marks each</Badge>
                  </div>
                  
                  {section.instructions && (
                    <p className="text-sm italic mb-3" style={{ color: '#5f6368' }}>
                      <span className="dark:text-slate-400">{section.instructions}</span>
                    </p>
                  )}

                  <div className="space-y-3">
                    {section.questions?.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-4 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold">
                            {qIndex + 1}
                          </span>
                          <p className="flex-1 pt-1" style={{ color: '#202124' }}>
                            <span className="dark:text-slate-100">{question}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
