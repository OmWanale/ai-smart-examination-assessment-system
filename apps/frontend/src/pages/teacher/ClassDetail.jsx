import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState, Avatar, Input, Textarea } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI, assignmentAPI, lectureAPI } from '../../api/client';
export function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentError, setAssignmentError] = useState(null);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null,
  });
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [lectures, setLectures] = useState({ live: [], upcoming: [], past: [] });
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [lectureForm, setLectureForm] = useState({ title: '', scheduledAt: '' });
  const [lectureLoading, setLectureLoading] = useState(false);

  const { quizzes, getQuizzesForClass } = useQuizStore();

  useEffect(() => {
    loadClassData();
    loadQuizzes();
    loadAssignments();
    loadLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadClassData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await classAPI.getClass(classId);
      const rawData = response.data?.data?.class || response.data?.class || response.data;
      console.log('[ClassDetail] Raw API response:', response.data);
      console.log('[ClassDetail] Extracted class data:', rawData);
      
      const normalizedData = {
        ...rawData,
        students: Array.isArray(rawData?.students) ? rawData.students : [],
        quizzes: Array.isArray(rawData?.quizzes) ? rawData.quizzes : [],
      };
      console.log('[ClassDetail] Normalized class data:', normalizedData);
      
      setClassData(normalizedData);
    } catch (err) {
      console.error('[ClassDetail] Error loading class:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuizzes = async () => {
    await getQuizzesForClass(classId);
  };

  const loadAssignments = async () => {
    setIsAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await assignmentAPI.getClassAssignments(classId);
      const assignmentList = response.data?.data || [];
      setAssignments(Array.isArray(assignmentList) ? assignmentList : []);
    } catch (err) {
      console.error('[ClassDetail] Failed to load assignments:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setIsAssignmentLoading(false);
    }
  };

  const handleAssignmentFormChange = (field, value) => {
    setAssignmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignmentError(null);

    if (!assignmentForm.title.trim() || !assignmentForm.description.trim() || !assignmentForm.dueDate) {
      setAssignmentError('Title, description, and due date are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', assignmentForm.title.trim());
      formData.append('description', assignmentForm.description.trim());
      formData.append('dueDate', assignmentForm.dueDate);
      if (assignmentForm.file) {
        formData.append('file', assignmentForm.file);
      }

      await assignmentAPI.createClassAssignment(classId, formData);
      setAssignmentForm({ title: '', description: '', dueDate: '', file: null });
      setShowAssignmentForm(false);
      await loadAssignments();
    } catch (err) {
      console.error('[ClassDetail] Failed to create assignment:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleDownloadAssignment = async (assignment) => {
    try {
      const response = await assignmentAPI.downloadClassAssignmentFile(classId, assignment._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', assignment.originalFileName || 'assignment');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ClassDetail] Failed to download assignment file:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to download assignment file');
    }
  };

  const handleLoadSubmissions = async (assignmentId) => {
    try {
      const response = await assignmentAPI.getClassAssignmentSubmissions(classId, assignmentId);
      const submissionList = response.data?.data || [];
      setAssignmentSubmissions((prev) => ({
        ...prev,
        [assignmentId]: Array.isArray(submissionList) ? submissionList : [],
      }));
    } catch (err) {
      console.error('[ClassDetail] Failed to load assignment submissions:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to load assignment submissions');
    }
  };

  const handleDownloadSubmission = async (submission) => {
    try {
      const response = await assignmentAPI.downloadClassSubmissionFile(classId, submission._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', submission.originalFileName || 'submission');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ClassDetail] Failed to download submission file:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to download submission file');
    }
  };

  const loadLectures = async () => {
    try {
      const response = await lectureAPI.getClassLectures(classId);
      const data = response.data?.data || {};
      setLectures({
        live: data.live || [],
        upcoming: data.upcoming || [],
        past: data.past || [],
      });
    } catch (err) {
      console.error('[ClassDetail] Failed to load lectures:', err);
    }
  };

  const handleStartInstantLecture = async () => {
    const title = prompt('Enter lecture title:');
    if (!title) return;
    setLectureLoading(true);
    try {
      const response = await lectureAPI.createLecture({ classId, title });
      const joinLink = response.data?.data?.joinLink;
      await loadLectures();
      if (joinLink) navigate(joinLink);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start lecture');
    } finally {
      setLectureLoading(false);
    }
  };

  const handleScheduleLecture = async (e) => {
    e.preventDefault();
    if (!lectureForm.title || !lectureForm.scheduledAt) return;
    setLectureLoading(true);
    try {
      await lectureAPI.createLecture({
        classId,
        title: lectureForm.title,
        scheduledAt: lectureForm.scheduledAt,
      });
      setLectureForm({ title: '', scheduledAt: '' });
      setShowLectureForm(false);
      await loadLectures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule lecture');
    } finally {
      setLectureLoading(false);
    }
  };

  const handleStartScheduledLecture = async (lectureId) => {
    try {
      await lectureAPI.startLecture(lectureId);
      await loadLectures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start lecture');
    }
  };

  const handleEndLecture = async (lectureId) => {
    try {
      await lectureAPI.endLecture(lectureId);
      await loadLectures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end lecture');
    }
  };

  const copyLectureLink = (roomId) => {
    const url = `${window.location.origin}${window.location.pathname}#/lecture/${roomId}`;
    navigator.clipboard.writeText(url);
    alert('Lecture link copied!');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-text-muted dark:text-slate-400 mt-4">Loading class details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !classData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error || 'Class not found'}
          </Alert>
          <Button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 mb-4">
          <Link to="/teacher/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text-dark dark:text-slate-200">{classData.name}</span>
        </div>

        {/* Class Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 -m-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">{classData.name}</h1>
                {classData.description && (
                  <p className="text-white/80">{classData.description}</p>
                )}
              </div>
              <Link to={`/teacher/create-quiz?classId=${classId}`}>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Quiz
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join Code Card */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>🔑</span> Join Code
            </h2>
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 text-center">
              <p className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400 tracking-widest font-mono">
                {classData.joinCode}
              </p>
              <p className="text-xs text-text-muted dark:text-slate-400 mt-3">Share this code with your students</p>
            </div>
          </Card>

          {/* Stats Cards */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>👥</span> Students
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-display font-bold text-primary-600 dark:text-primary-400">
                {classData.students?.length || 0}
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-display font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>📝</span> Quizzes
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-display font-bold text-secondary-600 dark:text-secondary-400">
                {quizzes?.length || 0}
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Students List */}
        <Card className="mt-6">
          <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>🎓</span> Enrolled Students
          </h2>
          {!Array.isArray(classData.students) || classData.students.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              title="No students have joined yet"
              description="Share the join code with your students to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(classData.students || []).map((student, index) => (
                <div
                  key={student._id || index}
                  className="flex items-center gap-3 p-4 bg-bg-light dark:bg-dark-hover rounded-xl hover:shadow-warm transition-all duration-200"
                >
                  <Avatar name={student.email || 'Student'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark dark:text-slate-200 truncate">
                      {student.email || 'Student'}
                    </p>
                    <p className="text-xs text-text-muted dark:text-slate-400">Student</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quizzes List */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2">
              <span>📋</span> Quizzes
            </h2>
            <Link to={`/teacher/create-quiz?classId=${classId}`}>
              <Button variant="outline" size="sm">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Quiz
                </span>
              </Button>
            </Link>
          </div>

          {!Array.isArray(quizzes) || quizzes.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="No quizzes created yet"
              description="Create your first quiz to get started."
              action={
                <Link to={`/teacher/create-quiz?classId=${classId}`}>
                  <Button>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Quiz
                    </span>
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {(quizzes || []).map((quiz) => (
                <div
                  key={quiz._id}
                  className="flex items-center justify-between p-4 bg-bg-light dark:bg-dark-hover rounded-xl hover:shadow-warm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-dark dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {quiz.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="neutral" size="sm">{quiz.questions?.length || 0} questions</Badge>
                        {quiz.timeLimit && <Badge variant="neutral" size="sm">{quiz.timeLimit} min</Badge>}
                        <Badge 
                          variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'easy' ? 'success' : 'warning'} 
                          size="sm"
                        >
                          {quiz.difficulty || 'medium'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/teacher/quiz/${quiz._id || quiz.id}/review`}>
                      <Button variant="ghost" size="sm">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </span>
                      </Button>
                    </Link>
                    <Link to={`/teacher/quiz/${quiz._id || quiz.id}/submissions`}>
                      <Button variant="outline" size="sm">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Submissions
                        </span>
                      </Button>
                    </Link>
                    <Link to={`/teacher/quiz/${quiz._id || quiz.id}/leaderboard`}>
                      <Button variant="outline" size="sm">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Leaderboard
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assignments Section */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2">
              <span>📎</span> Assignments
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowAssignmentForm((v) => !v)}>
              {showAssignmentForm ? 'Close Form' : 'Create Assignment'}
            </Button>
          </div>

          {assignmentError && (
            <Alert type="error" className="mb-4" dismissible onDismiss={() => setAssignmentError(null)}>
              {assignmentError}
            </Alert>
          )}

          {showAssignmentForm && (
            <form onSubmit={handleCreateAssignment} className="mb-6 p-4 rounded-xl border border-primary-100 dark:border-dark-border space-y-4">
              <Input
                label="Title"
                value={assignmentForm.title}
                onChange={(e) => handleAssignmentFormChange('title', e.target.value)}
                placeholder="Assignment title"
              />
              <Textarea
                label="Description"
                value={assignmentForm.description}
                onChange={(e) => handleAssignmentFormChange('description', e.target.value)}
                placeholder="Instructions for students"
                rows={4}
              />
              <Input
                label="Due Date"
                type="datetime-local"
                value={assignmentForm.dueDate}
                onChange={(e) => handleAssignmentFormChange('dueDate', e.target.value)}
              />
              <Input
                label="Attachment (Optional: PDF, DOC, DOCX)"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleAssignmentFormChange('file', e.target.files?.[0] || null)}
              />
              <Button type="submit">Post Assignment</Button>
            </form>
          )}

          {isAssignmentLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No assignments yet"
              description="Create your first class assignment for enrolled students."
            />
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const subList = assignmentSubmissions[assignment._id] || [];
                return (
                  <div key={assignment._id} className="p-4 rounded-xl border border-primary-100 dark:border-dark-border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-text-dark dark:text-slate-100">{assignment.title}</h3>
                        <p className="text-sm text-text-muted dark:text-slate-400">{assignment.description}</p>
                        <p className="text-xs text-text-muted dark:text-slate-500 mt-1">
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {assignment.file && (
                          <Button size="sm" variant="outline" onClick={() => handleDownloadAssignment(assignment)}>
                            Download Attachment
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleLoadSubmissions(assignment._id)}>
                          View Submissions
                        </Button>
                      </div>
                    </div>

                    {subList.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border space-y-2">
                        {subList.map((submission) => (
                          <div key={submission._id} className="flex items-center justify-between bg-bg-light dark:bg-dark-hover rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-text-dark dark:text-slate-100">
                                {submission.student?.name || submission.student?.email || 'Student'}
                              </p>
                              <p className="text-xs text-text-muted dark:text-slate-400">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleDownloadSubmission(submission)}>
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Lectures Section */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2">
              <span>🎥</span> Live Lectures
            </h2>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleStartInstantLecture} disabled={lectureLoading}>
                🔴 Start Live Lecture
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLectureForm((v) => !v)}>
                {showLectureForm ? 'Close' : '📅 Schedule Lecture'}
              </Button>
            </div>
          </div>

          {showLectureForm && (
            <form onSubmit={handleScheduleLecture} className="mb-6 p-4 rounded-xl border border-primary-100 dark:border-dark-border space-y-4">
              <Input
                label="Lecture Title"
                value={lectureForm.title}
                onChange={(e) => setLectureForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 5 Review"
                required
              />
              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                value={lectureForm.scheduledAt}
                onChange={(e) => setLectureForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                required
              />
              <Button type="submit" disabled={lectureLoading}>Schedule Lecture</Button>
            </form>
          )}

          {/* Live Now */}
          {lectures.live.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Now
              </h3>
              <div className="space-y-3">
                {lectures.live.map((lec) => (
                  <div key={lec._id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <div>
                      <p className="font-medium text-text-dark dark:text-slate-100">{lec.title}</p>
                      <p className="text-xs text-text-muted dark:text-slate-400">Started {new Date(lec.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>📋 Copy Link</Button>
                      <Button size="sm" onClick={() => navigate(`/lecture/${lec.roomId}`)}>Join</Button>
                      <Button size="sm" variant="outline" onClick={() => handleEndLecture(lec._id)}>End</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {lectures.upcoming.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">📅 Upcoming</h3>
              <div className="space-y-3">
                {lectures.upcoming.map((lec) => (
                  <div key={lec._id} className="flex items-center justify-between p-3 rounded-lg border border-primary-100 dark:border-dark-border">
                    <div>
                      <p className="font-medium text-text-dark dark:text-slate-100">{lec.title}</p>
                      <p className="text-xs text-text-muted dark:text-slate-400">Scheduled: {new Date(lec.scheduledAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>📋 Copy Link</Button>
                      <Button size="sm" onClick={() => handleStartScheduledLecture(lec._id)}>Start Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {lectures.past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted dark:text-slate-400 mb-2">📁 Past Lectures</h3>
              <div className="space-y-2">
                {lectures.past.map((lec) => (
                  <div key={lec._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-dark-border opacity-75">
                    <div>
                      <p className="font-medium text-text-dark dark:text-slate-100">{lec.title}</p>
                      <p className="text-xs text-text-muted dark:text-slate-400">{new Date(lec.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary">Ended</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lectures.live.length === 0 && lectures.upcoming.length === 0 && lectures.past.length === 0 && (
            <EmptyState
              icon="🎥"
              title="No lectures yet"
              description="Start a live lecture or schedule one for later."
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
