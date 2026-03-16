import { useEffect, useState } from 'react';
import { Card, Button, Spinner, EmptyState, Badge, Alert } from '../../components/UI';
import { MainLayout, PageHeader } from '../../components/Layout';
import { assignmentAPI } from '../../api/client';

export function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submittedAssignments, setSubmittedAssignments] = useState(new Set());
  const [submission, setSubmission] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await assignmentAPI.getAssignments();
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e, assignmentId) => {
    setSubmission((prev) => ({
      ...prev,
      [assignmentId]: e.target.files[0] || null,
    }));
    if (errors[assignmentId]) {
      setErrors((prev) => ({ ...prev, [assignmentId]: '' }));
    }
  };

  const handleDownloadAssignment = async (assignment) => {
    try {
      const response = await assignmentAPI.downloadAssignmentFile(assignment._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', assignment.originalFileName || 'assignment');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      setErrors((prev) => ({
        ...prev,
        [assignment._id]: 'Failed to download file',
      }));
    }
  };

  const handleSubmitAssignment = async (assignment) => {
    const file = submission[assignment._id];

    if (!file) {
      setErrors((prev) => ({
        ...prev,
        [assignment._id]: 'Please select a file to submit',
      }));
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('assignmentId', assignment._id);
      formData.append('file', file);

      await assignmentAPI.submitAssignment(formData);

      // Mark as submitted
      setSubmittedAssignments((prev) => new Set([...prev, assignment._id]));
      setSubmission((prev) => ({ ...prev, [assignment._id]: null }));
      setExpandedId(null);

      // Show success message
      alert('Assignment submitted successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit assignment';
      setErrors((prev) => ({
        ...prev,
        [assignment._id]: errorMsg,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isOverdue = date < today;

    return {
      display: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isOverdue,
    };
  };

  const getDaysRemaining = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <MainLayout>
      <PageHeader
        title="Assignments"
        description="View and submit assignments"
      />

      {isLoading && !assignments.length && <Spinner />}

      <div className="space-y-4">
        {assignments.length === 0 && !isLoading ? (
          <EmptyState
            message="No assignments yet"
            description="Check back later for new assignments from your teachers."
          />
        ) : (
          assignments.map((assignment) => {
            const dueDate = formatDate(assignment.dueDate);
            const isSubmitted = submittedAssignments.has(assignment._id);
            const daysRemaining = getDaysRemaining(assignment.dueDate);
            const isExpanded = expandedId === assignment._id;

            return (
              <Card
                key={assignment._id}
                className={`hover:shadow-md transition-all ${
                  isSubmitted
                    ? 'border-2 border-success-500'
                    : dueDate.isOverdue
                    ? 'border-2 border-error-500'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100">
                          {assignment.title}
                        </h3>
                        <p className="text-text-muted dark:text-slate-400 text-sm mt-1">
                          By {assignment.createdBy?.name || 'Teacher'}
                        </p>
                      </div>
                      {isSubmitted && (
                        <Badge variant="success">✓ Submitted</Badge>
                      )}
                      {!isSubmitted && dueDate.isOverdue && (
                        <Badge variant="danger">Overdue</Badge>
                      )}
                      {!isSubmitted && !dueDate.isOverdue && daysRemaining <= 2 && (
                        <Badge variant="accent">Due Soon</Badge>
                      )}
                    </div>

                    <p className="text-text-muted dark:text-slate-400 text-sm mt-2">
                      Due: {dueDate.display}
                    </p>
                  </div>
                </div>

                {!isExpanded ? (
                  <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                    {assignment.file && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadAssignment(assignment)}
                      >
                        📥 Download
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setExpandedId(assignment._id)}
                      disabled={isSubmitted}
                    >
                      {isSubmitted ? 'Submitted' : 'Submit Work'}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-700 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-400 font-medium mb-2">
                        Instructions
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {assignment.description}
                      </p>
                    </div>

                    {errors[assignment._id] && (
                      <Alert type="error">{errors[assignment._id]}</Alert>
                    )}

                    <div className="w-full">
                      <label className="label">Submit Your Work</label>
                      <div className="border-2 border-dashed border-primary-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-dark-hover transition-colors"
                        onClick={() => document.getElementById(`file-input-${assignment._id}`).click()}
                      >
                        <p className="text-text-muted dark:text-slate-400">
                          {submission[assignment._id]
                            ? submission[assignment._id].name
                            : 'Click to upload file (PDF, DOC, DOCX)'}
                        </p>
                        <input
                          id={`file-input-${assignment._id}`}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, assignment._id)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSubmitAssignment(assignment)}
                        disabled={!submission[assignment._id] || isLoading}
                      >
                        {isLoading ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
