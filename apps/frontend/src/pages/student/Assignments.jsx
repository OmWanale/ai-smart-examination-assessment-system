import { useEffect, useState } from 'react';
import { Card, Button, Spinner, EmptyState, Badge, Alert } from '../../components/UI';
import { MainLayout, PageHeader } from '../../components/Layout';
import { classAPI, assignmentAPI } from '../../api/client';

export function StudentAssignments() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [submittedAssignments, setSubmittedAssignments] = useState(new Set());
  const [submission, setSubmission] = useState({});
  const [errors, setErrors] = useState({});

  const getEntityId = (entity) => entity?._id || entity?.id;

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await classAPI.getMyClasses();
      const classList = response.data?.data?.classes || response.data?.classes || response.data?.data || [];
      const normalizedClasses = Array.isArray(classList) ? classList : [];
      setClasses(normalizedClasses);
      await fetchAllAssignments(normalizedClasses);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAssignments = async (classList) => {
    try {
      const allAssignments = [];
      for (const cls of classList) {
        const classId = getEntityId(cls);
        if (!classId) continue;
        try {
          const response = await assignmentAPI.getClassAssignments(classId);
          const items = response.data?.data || [];
          const withClass = items.map((a) => ({
            ...a,
            className: cls.name,
            classId,
            assignmentId: getEntityId(a),
          }));
          allAssignments.push(...withClass);
        } catch {
          // skip classes where fetching fails
        }
      }
      allAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
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
      const classId = assignment.classId || assignment.class?._id || assignment.class;
      const assignmentId = getEntityId(assignment);
      const response = await assignmentAPI.downloadClassAssignmentFile(classId, assignmentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', assignment.originalFileName || 'assignment');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setErrors((prev) => ({
        ...prev,
        [getEntityId(assignment)]: 'Failed to download file',
      }));
    }
  };

  const handleSubmitAssignment = async (assignment) => {
    const assignmentId = getEntityId(assignment);
    const file = submission[assignmentId];

    if (!file) {
      setErrors((prev) => ({
        ...prev,
        [assignmentId]: 'Please select a file to submit',
      }));
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const classId = assignment.classId || assignment.class?._id || assignment.class;
      await assignmentAPI.submitClassAssignment(classId, assignmentId, formData);

      // Mark as submitted
      setSubmittedAssignments((prev) => new Set([...prev, assignmentId]));
      setSubmission((prev) => ({ ...prev, [assignmentId]: null }));
      setExpandedId(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit assignment';
      setErrors((prev) => ({
        ...prev,
        [assignmentId]: errorMsg,
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
        description="View and submit assignments from your classes"
      />

      {isLoading && !assignments.length && (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      )}

      <div className="space-y-4">
        {assignments.length === 0 && !isLoading ? (
          <EmptyState
            icon="📭"
            title="No assignments yet"
            description="Check back later for new assignments from your teachers."
          />
        ) : (
          assignments.map((assignment) => {
            const assignmentId = getEntityId(assignment);
            const dueDate = formatDate(assignment.dueDate);
            const isSubmitted = submittedAssignments.has(assignmentId) || Boolean(assignment.hasSubmitted);
            const daysRemaining = getDaysRemaining(assignment.dueDate);
            const isExpanded = expandedId === assignmentId;

            return (
              <Card
                key={assignmentId}
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
                          {assignment.className && (
                            <span className="ml-2">| {assignment.className}</span>
                          )}
                        </p>
                      </div>
                      {isSubmitted && (
                        <Badge variant="success">Submitted</Badge>
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
                  <div className="flex gap-3 pt-3 border-t border-primary-100 dark:border-dark-border">
                    {assignment.file && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadAssignment(assignment)}
                      >
                        Download Attachment
                      </Button>
                    )}
                      <Button
                        size="sm"
                        onClick={() => setExpandedId(assignmentId)}
                        disabled={isSubmitted}
                      >
                      {isSubmitted ? 'Submitted' : 'Submit Work'}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-primary-100 dark:border-dark-border space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-400 font-medium mb-2">
                        Instructions
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {assignment.description}
                      </p>
                    </div>

                    {errors[assignmentId] && (
                      <Alert type="error" dismissible onDismiss={() => setErrors((prev) => ({ ...prev, [assignmentId]: '' }))}>
                        {errors[assignmentId]}
                      </Alert>
                    )}

                    <div className="w-full">
                      <label className="block text-sm font-medium text-text-dark dark:text-slate-200 mb-1">Submit Your Work</label>
                      <div className="border-2 border-dashed border-primary-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-dark-hover transition-colors"
                        onClick={() => document.getElementById(`file-input-${assignmentId}`).click()}
                      >
                        <p className="text-text-muted dark:text-slate-400">
                          {submission[assignmentId]
                            ? submission[assignmentId].name
                            : 'Click to upload file (PDF, DOC, DOCX)'}
                        </p>
                        <input
                          id={`file-input-${assignmentId}`}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, assignmentId)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSubmitAssignment(assignment)}
                        disabled={!submission[assignmentId] || isLoading}
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
