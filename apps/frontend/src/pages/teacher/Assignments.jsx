import { useEffect, useState } from 'react';
import { Card, Button, Input, Textarea, Spinner, EmptyState, Badge, Alert } from '../../components/UI';
import { MainLayout, PageHeader } from '../../components/Layout';
import { classAPI, assignmentAPI } from '../../api/client';

export function TeacherAssignments() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
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

  const getEntityId = (entity) => entity?._id || entity?.id;

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await classAPI.getMyClasses();
      const classList = response.data?.data?.classes || response.data?.classes || response.data?.data || [];
      setClasses(Array.isArray(classList) ? classList : []);
      // Fetch assignments for all classes
      await fetchAllAssignments(Array.isArray(classList) ? classList : []);
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
      // Sort newest first
      allAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!selectedClassId) newErrors.classId = 'Please select a class';
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

      await assignmentAPI.createClassAssignment(selectedClassId, data);

      // Reset form
      setFormData({ title: '', description: '', dueDate: '', file: null });
      setSelectedClassId('');
      setShowCreateForm(false);

      // Refresh assignments
      await fetchAllAssignments(classes);
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
      const classId = assignment.classId || assignment.class?._id || assignment.class;
      const assignmentId = getEntityId(assignment);
      const response = await assignmentAPI.getClassAssignmentSubmissions(classId, assignmentId);
      setSubmissions(response.data?.data || []);
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
      const classId = selectedAssignment?.classId || selectedAssignment?.class?._id || selectedAssignment?.class;
      const submissionId = getEntityId(submission);
      const response = await assignmentAPI.downloadClassSubmissionFile(classId, submissionId);
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
      setErrors({ submit: error.response?.data?.message || 'Failed to download file' });
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    try {
      const classId = assignment.classId || assignment.class?._id || assignment.class;
      const assignmentId = getEntityId(assignment);
      await assignmentAPI.deleteClassAssignment(classId, assignmentId);
      await fetchAllAssignments(classes);
    } catch (error) {
      console.error('Delete failed:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to delete assignment' });
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
        description="Create and manage assignments across your classes"
        action={
          !showCreateForm && !showSubmissions && (
            <Button onClick={() => setShowCreateForm(true)}>+ New Assignment</Button>
          )
        }
      />

      {isLoading && !assignments.length && (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      )}

      {/* Create Assignment Form */}
      {showCreateForm && !showSubmissions && (
        <Card className="mb-6 bg-white dark:bg-dark-card">
          <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100 mb-4">
            Create New Assignment
          </h3>

          {errors.submit && (
            <Alert type="error" className="mb-4" dismissible onDismiss={() => setErrors((prev) => ({ ...prev, submit: '' }))}>
              {errors.submit}
            </Alert>
          )}

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark dark:text-slate-200 mb-1">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  if (errors.classId) setErrors((prev) => ({ ...prev, classId: '' }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-primary-200 dark:border-dark-border bg-white dark:bg-dark-card text-text-dark dark:text-slate-100 focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              >
                <option value="">-- Choose a class --</option>
                {classes.map((cls) => (
                  <option key={cls._id || cls.id} value={cls._id || cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {errors.classId && <p className="text-error-500 text-sm mt-1.5">{errors.classId}</p>}
            </div>

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
              <label className="block text-sm font-medium text-text-dark dark:text-slate-200 mb-1">Attachment (Optional)</label>
              <div className="border-2 border-dashed border-primary-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-dark-hover transition-colors"
                onClick={() => document.getElementById('file-input').click()}
              >
                <p className="text-text-muted dark:text-slate-400">
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Assignment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', description: '', dueDate: '', file: null });
                  setSelectedClassId('');
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
              <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100">
                {selectedAssignment.title} - Submissions
              </h3>
              <p className="text-text-muted dark:text-slate-400 text-sm">
                Due: {formatDate(selectedAssignment.dueDate)}
                {selectedAssignment.className && (
                  <span className="ml-2">| Class: {selectedAssignment.className}</span>
                )}
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
            <EmptyState
              icon="📭"
              title="No submissions yet"
              description="Students haven't submitted their work yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50 dark:bg-dark-hover text-text-dark dark:text-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Submitted At</th>
                    <th className="px-4 py-3 text-left font-semibold">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100 dark:divide-dark-border">
                  {submissions.map((submission) => (
                    <tr key={getEntityId(submission)} className="hover:bg-bg-light dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3 text-text-dark dark:text-slate-100">
                        {submission.student?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-slate-400">
                        {submission.student?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-slate-400">
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
      {!showCreateForm && !showSubmissions && !isLoading && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No assignments yet"
              description="Create your first assignment to get started."
              action={<Button onClick={() => setShowCreateForm(true)}>+ Create Assignment</Button>}
            />
          ) : (
            assignments.map((assignment) => (
              <Card key={getEntityId(assignment)} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-dark dark:text-slate-100">
                      {assignment.title}
                    </h3>
                    <p className="text-text-muted dark:text-slate-400 text-sm mt-1">
                      {assignment.description.length > 100
                        ? assignment.description.substring(0, 100) + '...'
                        : assignment.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="primary">Due: {formatDate(assignment.dueDate)}</Badge>
                    {assignment.className && (
                      <Badge variant="neutral">{assignment.className}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-primary-100 dark:border-dark-border items-center">
                  {assignment.file && (
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadAssignment(assignment)}>
                      Download Attachment
                    </Button>
                  )}
                  {assignment.file && (
                    <span className="text-sm text-text-muted dark:text-slate-400">
                      {assignment.originalFileName}
                    </span>
                  )}
                  <div className="flex-1" />
                  <Button size="sm" onClick={() => handleViewSubmissions(assignment)}>
                    View Submissions
                  </Button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment)}
                    className="p-2 text-text-muted dark:text-slate-400 hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                    title="Delete Assignment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </MainLayout>
  );
}
