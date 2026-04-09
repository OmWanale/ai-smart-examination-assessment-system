import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Button, Alert, Badge, Spinner, EmptyState, Avatar, Input, Textarea } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI, assignmentAPI, lectureAPI, quizAPI } from '../../api/client';
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
  const [loadedSubmissionAssignments, setLoadedSubmissionAssignments] = useState({});
  const [lectures, setLectures] = useState({ live: [], upcoming: [], past: [] });
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [lectureForm, setLectureForm] = useState({ title: '', scheduledAt: '' });
  const [lectureLoading, setLectureLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stream');

  const getEntityId = (entity) => entity?._id || entity?.id;

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
      const normalizedAssignments = (Array.isArray(assignmentList) ? assignmentList : []).map((assignment) => ({
        ...assignment,
        assignmentId: getEntityId(assignment),
      }));
      setAssignments(normalizedAssignments);
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
    } catch (err) {
      console.error('[ClassDetail] Failed to download assignment file:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to download assignment file');
    }
  };

  const handleLoadSubmissions = async (assignmentId) => {
    try {
      setAssignmentError(null);
      const response = await assignmentAPI.getClassAssignmentSubmissions(classId, assignmentId);
      const submissionList = response.data?.data || [];
      setAssignmentSubmissions((prev) => ({
        ...prev,
        [assignmentId]: Array.isArray(submissionList) ? submissionList : [],
      }));
      setLoadedSubmissionAssignments((prev) => ({
        ...prev,
        [assignmentId]: true,
      }));
    } catch (err) {
      console.error('[ClassDetail] Failed to load assignment submissions:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to load assignment submissions');
    }
  };

  const handleDownloadSubmission = async (submission) => {
    try {
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
      const response = await lectureAPI.startLecture(lectureId);
      const roomId = response.data?.data?.lecture?.roomId;
      await loadLectures();
      if (roomId) navigate(`/lecture/${roomId}`);
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

  const handleDeleteClass = async () => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone and will remove all quizzes, assignments, and student enrollments.')) {
      return;
    }
    try {
      await classAPI.deleteClass(classId);
      navigate('/teacher/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }
    try {
      await quizAPI.deleteQuiz(quizId);
      await loadQuizzes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    try {
      await assignmentAPI.deleteClassAssignment(classId, assignmentId);
      await loadAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const tabItems = [
    { id: 'stream', label: 'Stream' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'lectures', label: 'Live Lectures' },
    { id: 'people', label: 'People' },
  ];

  const formatDate = (value) => {
    if (!value) return 'No date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'No date';
    return parsed.toLocaleString();
  };

  const getQuizQuestionCount = (quiz) =>
    quiz?.questionCount || quiz?.questions?.length || quiz?.totalQuestions || quiz?.totalMarks || 0;

  const streamItems = [
    ...(Array.isArray(assignments) ? assignments : []).map((assignment) => ({
      id: `assignment-${getEntityId(assignment)}`,
      kind: 'assignment',
      title: assignment.title,
      subtitle: assignment.dueDate ? `Assignment due ${formatDate(assignment.dueDate)}` : 'Assignment posted',
      type: 'Assignment',
      date: assignment.createdAt || assignment.updatedAt || assignment.dueDate || Date.now(),
    })),
    ...(Array.isArray(quizzes) ? quizzes : []).map((quiz) => {
      const quizId = quiz._id || quiz.id;
      return {
        id: `quiz-${quizId}`,
        kind: 'quiz',
        quizId,
        title: quiz.title,
        subtitle: `${getQuizQuestionCount(quiz)} questions • ${quiz.timeLimit || quiz.durationMinutes || 'No'} min`,
        type: 'Quiz',
        date: quiz.createdAt || quiz.updatedAt || Date.now(),
      };
    }),
    ...(lectures.live || []).map((lecture) => ({
      id: `lecture-live-${lecture._id}`,
      kind: 'lecture-live',
      roomId: lecture.roomId,
      title: lecture.title,
      subtitle: `Live now • Started ${formatDate(lecture.createdAt)}`,
      type: 'Lecture',
      date: lecture.createdAt || Date.now(),
    })),
    ...(lectures.upcoming || []).map((lecture) => ({
      id: `lecture-upcoming-${lecture._id}`,
      kind: 'lecture-upcoming',
      roomId: lecture.roomId,
      title: lecture.title,
      subtitle: `Scheduled for ${formatDate(lecture.scheduledAt)}`,
      type: 'Lecture',
      date: lecture.scheduledAt || Date.now(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingItems = [
    ...(Array.isArray(assignments) ? assignments : []).map((assignment) => ({
      id: `upcoming-assignment-${getEntityId(assignment)}`,
      title: assignment.title,
      label: 'Assignment',
      date: assignment.dueDate,
    })),
    ...(lectures.upcoming || []).map((lecture) => ({
      id: `upcoming-lecture-${lecture._id}`,
      title: lecture.title,
      label: 'Lecture',
      date: lecture.scheduledAt,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleStreamItemClick = (item) => {
    if (item.kind === 'assignment') {
      setActiveTab('assignments');
      return;
    }

    if (item.kind === 'quiz' && item.quizId) {
      navigate(`/teacher/quiz/${item.quizId}/review`);
      return;
    }

    if (item.kind === 'lecture-live' && item.roomId) {
      navigate(`/lecture/${item.roomId}`);
      return;
    }

    setActiveTab('lectures');
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
        <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 mb-4">
          <Link to="/teacher/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text-dark dark:text-slate-200">{classData.name}</span>
        </div>

        <div className="rounded-2xl bg-[#5f7485] min-h-[180px] p-6 md:p-8 flex items-start justify-between relative">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{classData.name}</h1>
            <p className="text-white/85 mt-2 text-base md:text-lg">{classData.description || 'Class stream and resources'}</p>
            <p className="text-white/75 mt-4 text-sm">
              {classData.teacher?.name || classData.teacher?.email || 'Teacher'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/15 border border-white/30">
              <span className="text-white/90 text-sm">Class Code:</span>
              <span className="text-white font-semibold tracking-wide">{classData.joinCode || 'Not available'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="hidden md:flex w-24 h-24 rounded-2xl bg-white/10 items-center justify-center">
              <svg className="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m0 0l-3-3m3 3l3-3M3 10a9 9 0 1118 0v4a2 2 0 01-2 2h-3.5a1.5 1.5 0 01-1.5-1.5v-2A1.5 1.5 0 0115.5 11H19v-.5a7 7 0 10-14 0V11h3.5A1.5 1.5 0 0110 12.5v2A1.5 1.5 0 018.5 16H5a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <button
              onClick={handleDeleteClass}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Delete Class"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Class
            </button>
          </div>
        </div>

        <div className="mt-4 border-b border-primary-100 dark:border-dark-border">
          <div className="flex items-center gap-6 overflow-x-auto">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pt-2 pb-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400 font-semibold'
                    : 'text-text-muted dark:text-slate-400 border-transparent hover:text-text-dark dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'stream' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border p-6">
                  <h3 className="text-2xl font-medium text-text-dark dark:text-slate-100">Upcoming</h3>
                  {upcomingItems.length === 0 ? (
                    <p className="text-text-muted dark:text-slate-400 mt-4">Woohoo, no work due soon!</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {upcomingItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-xl border border-primary-100 dark:border-dark-border p-3">
                          <p className="text-sm font-medium text-text-dark dark:text-slate-200">{item.title}</p>
                          <p className="text-xs text-text-muted dark:text-slate-400 mt-1">{item.label}</p>
                          <p className="text-xs text-text-muted dark:text-slate-400 mt-1">{formatDate(item.date)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <button
                  onClick={() => {
                    setActiveTab('assignments');
                    setShowAssignmentForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d2e3fc] text-[#1967d2] px-5 py-3 font-medium hover:bg-[#c6dafc] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Announcement
                </button>

                {streamItems.length === 0 ? (
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-primary-100 dark:border-dark-border p-6 text-text-muted dark:text-slate-400">
                    No stream activity yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streamItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleStreamItemClick(item)}
                        className="w-full text-left bg-white dark:bg-dark-card rounded-xl shadow-sm border border-primary-100 dark:border-dark-border p-4 hover:bg-bg-light dark:hover:bg-dark-hover transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                              {item.type.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-dark dark:text-slate-100 truncate">{item.title}</p>
                              <p className="text-sm text-text-muted dark:text-slate-400 mt-1">{item.subtitle}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400 mt-1">{formatDate(item.date)}</p>
                            </div>
                          </div>
                          <span className="w-8 h-8 rounded-full text-text-muted dark:text-slate-400 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border overflow-hidden">
              <div className="px-6 py-4 border-b border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-dark dark:text-slate-100">Quizzes</h2>
                  <p className="text-sm text-text-muted dark:text-slate-400 mt-1">Manage assessments and review outcomes</p>
                </div>
                <Link to={`/teacher/create-quiz?classId=${classId}`}>
                  <Button variant="outline" size="sm">Create Quiz</Button>
                </Link>
              </div>

              <div className="p-6">

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
                        <Button>Create First Quiz</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {(quizzes || []).map((quiz) => (
                      <div key={quiz._id} className="relative rounded-2xl border border-primary-100 dark:border-dark-border p-4 pl-5 bg-bg-light dark:bg-dark-surface hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary-400 dark:bg-primary-500"></div>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="font-semibold text-text-dark dark:text-slate-100">{quiz.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="neutral" size="sm">{getQuizQuestionCount(quiz)} questions</Badge>
                              {(quiz.timeLimit || quiz.durationMinutes) && (
                                <Badge variant="neutral" size="sm">{quiz.timeLimit || quiz.durationMinutes} min</Badge>
                              )}
                              <Badge
                                variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'easy' ? 'success' : 'warning'}
                                size="sm"
                              >
                                {quiz.difficulty || 'medium'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/teacher/quiz/${quiz._id || quiz.id}/review`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link to={`/teacher/quiz/${quiz._id || quiz.id}/submissions`}>
                              <Button variant="outline" size="sm">Submissions</Button>
                            </Link>
                            <Link to={`/teacher/quiz/${quiz._id || quiz.id}/leaderboard`}>
                              <Button variant="outline" size="sm">Leaderboard</Button>
                            </Link>
                            <button
                              onClick={() => handleDeleteQuiz(quiz._id || quiz.id)}
                              className="p-2 text-text-muted dark:text-slate-400 hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                              title="Delete Quiz"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border overflow-hidden">
              <div className="px-6 py-4 border-b border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-text-dark dark:text-slate-100">Assignments</h2>
                  <p className="text-sm text-text-muted dark:text-slate-400 mt-1">Distribute tasks and track submissions</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAssignmentForm((v) => !v)}>
                  {showAssignmentForm ? 'Close Form' : 'Create Assignment'}
                </Button>
              </div>

              <div className="p-6">

                {assignmentError && (
                  <Alert type="error" className="mb-4" dismissible onDismiss={() => setAssignmentError(null)}>
                    {assignmentError}
                  </Alert>
                )}

                {showAssignmentForm && (
                  <form onSubmit={handleCreateAssignment} className="mb-6 p-4 rounded-2xl border border-primary-100 dark:border-dark-border space-y-4 bg-bg-light dark:bg-dark-surface">
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
                      const assignmentId = getEntityId(assignment);
                      const subList = assignmentSubmissions[assignmentId] || [];
                      const submissionsLoaded = Boolean(loadedSubmissionAssignments[assignmentId]);
                      return (
                        <div key={assignmentId} className="relative rounded-2xl border border-primary-100 dark:border-dark-border p-4 pl-5 bg-bg-light dark:bg-dark-surface">
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-success-500 dark:bg-success-400"></div>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-text-dark dark:text-slate-100">{assignment.title}</h3>
                              <p className="text-sm text-text-muted dark:text-slate-400">{assignment.description}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400 mt-1">Due: {formatDate(assignment.dueDate)}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400 mt-1">
                                Submission status: {submissionsLoaded ? `${subList.length} submission${subList.length === 1 ? '' : 's'}` : 'Not loaded'}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap items-center">
                              {assignment.file && (
                                <Button size="sm" variant="outline" onClick={() => handleDownloadAssignment(assignment)}>
                                  Download Attachment
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => handleLoadSubmissions(assignmentId)}>
                                View Submissions
                              </Button>
                              <button
                                onClick={() => handleDeleteAssignment(assignmentId)}
                                className="p-2 text-text-muted dark:text-slate-400 hover:text-error-500 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                                title="Delete Assignment"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {submissionsLoaded && subList.length === 0 && (
                            <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border">
                              <p className="text-sm text-text-muted dark:text-slate-400">
                                No submissions yet for this assignment.
                              </p>
                            </div>
                          )}

                          {subList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border space-y-2">
                              {subList.map((submission) => (
                                <div key={getEntityId(submission)} className="flex items-center justify-between bg-bg-light dark:bg-dark-hover rounded-xl px-3 py-2 border border-primary-100 dark:border-dark-border">
                                  <div>
                                    <p className="text-sm font-medium text-text-dark dark:text-slate-200">
                                      {submission.student?.name || submission.student?.email || 'Student'}
                                    </p>
                                    <p className="text-xs text-text-muted dark:text-slate-400">Submitted: {formatDate(submission.submittedAt)}</p>
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
              </div>
            </div>
          )}

          {activeTab === 'lectures' && (
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border overflow-hidden">
              <div className="px-6 py-4 border-b border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-text-dark dark:text-slate-100">Live Lectures</h2>
                  <p className="text-sm text-text-muted dark:text-slate-400 mt-1">Run live sessions and schedule upcoming classes</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleStartInstantLecture} disabled={lectureLoading}>
                    Start Live Lecture
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLectureForm((v) => !v)}>
                    {showLectureForm ? 'Close' : 'Schedule Lecture'}
                  </Button>
                </div>
              </div>

              <div className="p-6">

                {showLectureForm && (
                  <form onSubmit={handleScheduleLecture} className="mb-6 p-4 rounded-2xl border border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface space-y-4">
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

                {lectures.live.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-text-dark dark:text-slate-100 mb-2">LIVE</h3>
                    <div className="space-y-3">
                      {lectures.live.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-error-300 dark:border-error-600 bg-error-50 dark:bg-error-900/20 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-semibold text-text-dark dark:text-slate-100">{lec.title}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400">Status: LIVE • Started {formatDate(lec.createdAt)}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>Copy Link</Button>
                              <Button size="sm" onClick={() => navigate(`/lecture/${lec.roomId}`)}>Join</Button>
                              <Button size="sm" variant="outline" onClick={() => handleEndLecture(lec._id)}>End</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lectures.upcoming.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-text-dark dark:text-slate-100 mb-2">UPCOMING</h3>
                    <div className="space-y-3">
                      {lectures.upcoming.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-primary-100 dark:border-dark-border p-4 bg-bg-light dark:bg-dark-surface">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-semibold text-text-dark dark:text-slate-100">{lec.title}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400">Status: UPCOMING • {formatDate(lec.scheduledAt)}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>Copy Link</Button>
                              <Button size="sm" onClick={() => handleStartScheduledLecture(lec._id)}>Start Now</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lectures.past.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-dark dark:text-slate-100 mb-2">ENDED</h3>
                    <div className="space-y-3">
                      {lectures.past.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-primary-100 dark:border-dark-border p-4 bg-bg-light dark:bg-dark-hover">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-text-dark dark:text-slate-100">{lec.title}</p>
                              <p className="text-xs text-text-muted dark:text-slate-400">Status: ENDED • {formatDate(lec.createdAt)}</p>
                            </div>
                            <Badge variant="secondary">Ended</Badge>
                          </div>
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
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border p-6">
                <h2 className="text-xl font-semibold text-text-dark dark:text-slate-100 mb-4">Teacher</h2>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface">
                  <Avatar name={classData.teacher?.name || classData.teacher?.email || 'Teacher'} size="md" />
                  <div>
                    <p className="text-text-dark dark:text-slate-100 font-medium">{classData.teacher?.name || 'Class Teacher'}</p>
                    <p className="text-sm text-text-muted dark:text-slate-400">{classData.teacher?.email || 'No email available'}</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">Instructor</span>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-primary-100 dark:border-dark-border p-6">
                <h2 className="text-xl font-semibold text-text-dark dark:text-slate-100 mb-4">Students</h2>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(classData.students || []).map((student, index) => (
                      <div key={student._id || index} className="flex items-center gap-3 p-3 rounded-2xl border border-primary-100 dark:border-dark-border bg-bg-light dark:bg-dark-surface hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                        <Avatar name={student.email || 'Student'} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-dark dark:text-slate-200 truncate">{student.email || 'Student'}</p>
                          <p className="text-xs text-text-muted dark:text-slate-400">Student</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
