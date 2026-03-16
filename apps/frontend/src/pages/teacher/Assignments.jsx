import { useEffect, useState } from 'react';
import { Card, Button, Input, Textarea, Spinner, EmptyState, Badge } from '../../components/UI';
import { MainLayout, PageHeader } from '../../components/Layout';
import { assignmentAPI } from '../../api/client';

export function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null,
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] || null }));
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('dueDate', formData.dueDate);
      if (formData.file) {
        data.append('file', formData.file);
      }

      await assignmentAPI.createAssignment(data);

      // Reset form
      setFormData({ title: '', description: '', dueDate: '', file: null });
      setShowCreateForm(false);

      // Refresh assignments
      await fetchAssignments();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create assignment';
      setErrors({ submit: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setIsLoading(true);
      setSelectedAssignment(assignment);
      const response = await assignmentAPI.getSubmissions(assignment._id);
      setSubmissions(response.data.data || []);
      setShowSubmissions(true);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSubmission = async (submission) => {
    try {
      const response = await assignmentAPI.downloadSubmissionFile(submission._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', submission.originalFileName || 'submission');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to download submission file',
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <PageHeader
        title="Assignments"
        description="Create and manage assignments"
        action={
          !showCreateForm && !showSubmissions && (
            <Button onClick={() => setShowCreateForm(true)}>+ New Assignment</Button>
          )
        }
      />

      {isLoading && <Spinner />}

      {/* Create Assignment Form */}
      {showCreateForm && !showSubmissions && (
        <Card className="mb-6 bg-white dark:bg-dark-card">
          <h3 className="text-lg font-semibold text-text-dark dark:text-stone-100 mb-4">
            Create New Assignment
          </h3>

          {errors.submit && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-900 text-error-700 dark:text-error-400 px-4 py-3 rounded-lg mb-4">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <Input
              label="Assignment Title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Chapter 5 Reading Assignment"
              error={errors.title}
            />

            <Textarea
              label="Description / Instructions"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed instructions for students..."
              rows={5}
              error={errors.description}
            />

            <Input
              label="Due Date"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleInputChange}
              error={errors.dueDate}
            />

            <div className="w-full">
              <label className="label">Attachment (Optional)</label>
              <div className="border-2 border-dashed border-primary-300 dark:border-stone-600 rounded-lg p-6 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-dark-hover transition-colors"
                onClick={() => document.getElementById('file-input').click()}
              >
                <p className="text-text-muted dark:text-stone-400">
                  {formData.file ? formData.file.name : 'Click to upload file (PDF, DOC, DOCX)'}
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {errors.file && <p className="text-error-500 text-sm mt-1.5">{errors.file}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Assignment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', description: '', dueDate: '', file: null });
                  setErrors({});
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* View Submissions */}
      {showSubmissions && selectedAssignment && (
        <Card className="mb-6 bg-white dark:bg-dark-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-stone-100">
                {selectedAssignment.title} - Submissions
              </h3>
              <p className="text-text-muted dark:text-stone-400 text-sm">
                Due: {formatDate(selectedAssignment.dueDate)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowSubmissions(false);
                setSelectedAssignment(null);
                setSubmissions([]);
              }}
            >
              Back
            </Button>
          </div>

          {submissions.length === 0 ? (
            <EmptyState message="No submissions yet" description="Students haven't submitted their work yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-dark-hover text-text-dark dark:text-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Submitted At</th>
                    <th className="px-4 py-3 text-left font-semibold">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
                  {submissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3 text-text-dark dark:text-stone-100">
                        {submission.student?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400">
                        {submission.student?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadSubmission(submission)}
                        >
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Assignments List */}
      {!showCreateForm && !showSubmissions && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              message="No assignments yet"
              description="Create your first assignment to get started."
              action={<Button onClick={() => setShowCreateForm(true)}>+ Create Assignment</Button>}
            />
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment._id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-dark dark:text-stone-100">
                      {assignment.title}
                    </h3>
                    <p className="text-text-muted dark:text-stone-400 text-sm mt-1">
                      {assignment.description.substring(0, 100)}
                      {assignment.description.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <Badge variant="primary">
                    Due: {formatDate(assignment.dueDate)}
                  </Badge>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-stone-700">
                  {assignment.file && (
                    <div className="text-sm text-text-muted dark:text-stone-400">
                      📎 {assignment.originalFileName}
                    </div>
                  )}
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    onClick={() => handleViewSubmissions(assignment)}
                  >
                    View Submissions
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </MainLayout>
  );
}
