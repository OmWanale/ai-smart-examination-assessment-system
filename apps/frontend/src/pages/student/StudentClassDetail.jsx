import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Button, Alert, Badge, Spinner, EmptyState, Avatar, Input } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI, assignmentAPI, lectureAPI, submissionAPI } from '../../api/client';
export function StudentClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentError, setAssignmentError] = useState(null);
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [lectures, setLectures] = useState({ live: [], upcoming: [], past: [] });
  const [activeTab, setActiveTab] = useState('stream');
  const [focusedQuizId, setFocusedQuizId] = useState(null);

  const { quizzes, getQuizzesForClass } = useQuizStore();

  useEffect(() => {
    loadData();
    loadLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (activeTab !== 'quizzes' || !focusedQuizId) return;
    const element = document.getElementById(`quiz-card-${focusedQuizId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab, focusedQuizId, quizzes]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classResponse, quizzesForClass] = await Promise.all([
        classAPI.getClass(classId),
        getQuizzesForClass(classId),
      ]);
      const rawClassData = classResponse.data?.data?.class || classResponse.data?.class || classResponse.data;
      console.log('[StudentClassDetail] Raw class response:', classResponse.data);
      console.log('[StudentClassDetail] Extracted class data:', rawClassData);
      setClassData(rawClassData);

      const allSubmissions = {};

      try {
        const submissionsResponse = await submissionAPI.getStudentSubmissions();
        const submissionList = submissionsResponse.data?.data?.submissions || [];
        const classQuizIds = new Set(
          (Array.isArray(quizzesForClass) ? quizzesForClass : [])
            .map((quiz) => String(quiz.id || quiz._id || ''))
            .filter(Boolean)
        );

        (Array.isArray(submissionList) ? submissionList : []).forEach((submission) => {
          const quizId = String(
            submission?.quiz?.id || submission?.quiz?._id || submission?.quizId || submission?.quiz || ''
          );
          if (!quizId) return;
          if (classQuizIds.size > 0 && !classQuizIds.has(quizId)) return;

          allSubmissions[quizId] = {
            _id: submission.id || submission._id,
            ...submission,
          };
        });
      } catch (submissionErr) {
        console.error('[StudentClassDetail] Failed to load student submissions:', submissionErr);
      }

      setSubmissions(allSubmissions);
      await loadAssignments();
    } catch (err) {
      console.error('[StudentClassDetail] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await assignmentAPI.getClassAssignments(classId);
      const assignmentList = response.data?.data || [];
      setAssignments(Array.isArray(assignmentList) ? assignmentList : []);
    } catch (err) {
      console.error('[StudentClassDetail] Failed to load assignments:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to load assignments');
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
      console.error('[StudentClassDetail] Failed to load lectures:', err);
    }
  };

  const copyLectureLink = (roomId) => {
    const url = `${window.location.origin}${window.location.pathname}#/lecture/${roomId}`;
    navigator.clipboard.writeText(url);
    alert('Lecture link copied!');
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
      console.error('[StudentClassDetail] Failed to download assignment:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to download assignment file');
    }
  };

  const handleSelectSubmissionFile = (assignmentId, file) => {
    setAssignmentFiles((prev) => ({ ...prev, [assignmentId]: file || null }));
  };

  const handleSubmitAssignment = async (assignment) => {
    const file = assignmentFiles[assignment._id];
    if (!file) {
      setAssignmentError('Please select a file before submitting.');
      return;
    }

    setIsSubmittingAssignment(true);
    setAssignmentError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      await assignmentAPI.submitClassAssignment(classId, assignment._id, formData);
      setAssignmentFiles((prev) => ({ ...prev, [assignment._id]: null }));
      await loadAssignments();
    } catch (err) {
      console.error('[StudentClassDetail] Failed to submit assignment:', err);
      setAssignmentError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const getQuizStatus = (quiz) => {
    const quizId = quiz.id || quiz._id;
    if (submissions[quizId]) {
      return {
        status: 'submitted',
        score: submissions[quizId].score,
        maxScore: submissions[quizId].maxScore || 0,
      };
    }
    if (quiz.hasSubmitted) {
      return { status: 'submitted', score: 0, maxScore: 0 };
    }
    return { status: 'available' };
  };

  const getSubmissionForQuiz = (quizId) => submissions[String(quizId)] || null;

  const canViewQuizResultDetails = (quiz) => quiz?.showResultsToStudents !== false;

  const getQuizQuestionCount = (quiz) =>
    quiz?.questionCount || quiz?.questions?.length || quiz?.totalQuestions || quiz?.totalMarks || 0;

  const getQuizDurationMinutes = (quiz) =>
    quiz?.durationMinutes || quiz?.timeLimit || 0;

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

  const getAssignmentSubmissionStatus = (assignment) => {
    if (assignment?.submission?.status) return assignment.submission.status;
    if (assignment?.submissionStatus) return assignment.submissionStatus;
    if (assignment?.hasSubmitted) return 'Submitted';
    return 'Pending';
  };

  const streamItems = [
    ...(Array.isArray(assignments) ? assignments : []).map((assignment) => ({
      id: `assignment-${assignment._id}`,
      type: 'assignment',
      title: assignment.title,
      subtitle: `Due ${formatDate(assignment.dueDate)} • ${getAssignmentSubmissionStatus(assignment)}`,
      date: assignment.createdAt || assignment.updatedAt || assignment.dueDate || Date.now(),
    })),
    ...(Array.isArray(quizzes) ? quizzes : []).map((quiz) => {
      const quizId = quiz.id || quiz._id;
      const status = getQuizStatus(quiz);
      const isSubmitted = status.status === 'submitted';
      const submission = getSubmissionForQuiz(quizId);
      const hasResultAccess = canViewQuizResultDetails(quiz);
      return {
        id: `quiz-${quizId}`,
        type: 'quiz',
        quizId,
        title: quiz.title,
        subtitle: `${getQuizQuestionCount(quiz)} questions • ${getQuizDurationMinutes(quiz) || 'No'} min`,
        date: quiz.createdAt || quiz.updatedAt || Date.now(),
        isSubmitted,
        hasResultAccess,
        submissionId: submission?._id,
      };
    }),
    ...(lectures.live || []).map((lecture) => ({
      id: `lecture-live-${lecture._id}`,
      type: 'lecture-live',
      roomId: lecture.roomId,
      title: lecture.title,
      subtitle: `LIVE • Started ${formatDate(lecture.createdAt)}`,
      date: lecture.createdAt || Date.now(),
    })),
    ...(lectures.upcoming || []).map((lecture) => ({
      id: `lecture-upcoming-${lecture._id}`,
      type: 'lecture-upcoming',
      roomId: lecture.roomId,
      title: lecture.title,
      subtitle: `UPCOMING • ${formatDate(lecture.scheduledAt)}`,
      date: lecture.scheduledAt || Date.now(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingItems = [
    ...(Array.isArray(assignments) ? assignments : []).map((assignment) => ({
      id: `upcoming-assignment-${assignment._id}`,
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
    if (item.type === 'quiz') {
      if (!item.isSubmitted) {
        setActiveTab('quizzes');
        setFocusedQuizId(String(item.quizId));
        return;
      }

      if (item.hasResultAccess && item.submissionId) {
        navigate(`/student/quiz/${item.quizId}/result`, {
          state: { submissionId: item.submissionId },
        });
        return;
      }

      setActiveTab('quizzes');
      setFocusedQuizId(String(item.quizId));
      return;
    }

    if (item.type === 'assignment') {
      setActiveTab('assignments');
      return;
    }

    if (item.type === 'lecture-live' && item.roomId) {
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
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-[#5f6368] mb-4">
          <Link to="/student/dashboard" className="hover:text-[#1a73e8] transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#202124]">{classData.name}</span>
        </div>

        <div className="rounded-2xl bg-[#5f7485] min-h-[180px] p-6 md:p-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{classData.name}</h1>
            <p className="text-white/85 mt-2 text-base md:text-lg">{classData.description || 'Class stream and resources'}</p>
            <p className="text-white/75 mt-4 text-sm">{classData.teacher?.name || classData.teacher?.email || 'Teacher'}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/15 border border-white/30">
              <span className="text-white/90 text-sm">Class Code:</span>
              <span className="text-white font-semibold tracking-wide">{classData.joinCode || 'Not available'}</span>
            </div>
          </div>
          <div className="hidden md:flex w-24 h-24 rounded-2xl bg-white/10 items-center justify-center">
            <svg className="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="mt-4 border-b border-[#dadce0]">
          <div className="flex items-center gap-6 overflow-x-auto">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pt-2 pb-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#1a73e8] border-[#1a73e8] font-semibold'
                    : 'text-[#5f6368] border-transparent hover:text-[#202124]'
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
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] p-6">
                  <h3 className="text-2xl font-medium text-[#202124]">Upcoming</h3>
                  {upcomingItems.length === 0 ? (
                    <p className="text-[#5f6368] mt-4">Woohoo, no work due soon!</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {upcomingItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#e8eaed] p-3">
                          <p className="text-sm font-medium text-[#202124]">{item.title}</p>
                          <p className="text-xs text-[#5f6368] mt-1">{item.label}</p>
                          <p className="text-xs text-[#5f6368] mt-1">{formatDate(item.date)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d2e3fc] text-[#1967d2] px-5 py-3 font-medium hover:bg-[#c6dafc] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Announcement
                </button>

                {streamItems.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-[#e8eaed] p-6 text-[#5f6368]">
                    No stream activity yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streamItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleStreamItemClick(item)}
                        className="w-full text-left bg-white rounded-xl shadow-sm border border-[#e8eaed] p-4 hover:bg-[#f8f9fa] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-semibold">
                              {item.type.startsWith('lecture') ? 'L' : item.type.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#202124] truncate">{item.title}</p>
                              <p className="text-sm text-[#5f6368] mt-1">{item.subtitle}</p>
                              <p className="text-xs text-[#5f6368] mt-1">{formatDate(item.date)}</p>
                            </div>
                          </div>
                          <span className="w-8 h-8 rounded-full text-[#5f6368] flex items-center justify-center">
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
            <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8eaed] bg-[#f8fbff] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-[#202124]">Quizzes</h2>
                  <p className="text-sm text-[#5f6368] mt-1">Take tests and track your completion status</p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadData}>Refresh</Button>
              </div>

              <div className="p-6">

                {!quizzes || quizzes.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    title="No quizzes available yet"
                    description="Check back later for new quizzes from your teacher."
                  />
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(quizzes) ? quizzes : []).map((quiz) => {
                      const quizId = quiz.id || quiz._id;
                      const status = getQuizStatus(quiz);
                      const isSubmitted = status.status === 'submitted';
                      const submission = getSubmissionForQuiz(quizId);
                      const hasSubmissionId = Boolean(submission?._id);
                      const canViewResults = isSubmitted && canViewQuizResultDetails(quiz) && hasSubmissionId;
                      const canViewLeaderboard = isSubmitted && canViewQuizResultDetails(quiz);
                      const isFocused = focusedQuizId && String(quizId) === String(focusedQuizId);

                      return (
                        <div
                          id={`quiz-card-${quizId}`}
                          key={quizId}
                          className={`relative rounded-2xl border p-4 pl-5 bg-[#fcfdff] transition-colors ${
                            isFocused ? 'border-[#8ab4f8] ring-2 ring-[#d2e3fc]' : 'border-[#dfe5ee] hover:border-[#c6dafc]'
                          }`}
                        >
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#8ab4f8]"></div>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-[#202124]">{quiz.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="neutral" size="sm">{getQuizQuestionCount(quiz)} questions</Badge>
                                {getQuizDurationMinutes(quiz) > 0 && (
                                  <Badge variant="neutral" size="sm">{getQuizDurationMinutes(quiz)} min</Badge>
                                )}
                                <Badge
                                  variant={quiz.difficulty === 'hard' ? 'error' : quiz.difficulty === 'easy' ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {quiz.difficulty || 'medium'}
                                </Badge>
                                {isSubmitted && <Badge variant="success" size="sm">Completed</Badge>}
                                {isSubmitted && !canViewQuizResultDetails(quiz) && (
                                  <Badge variant="warning" size="sm">Results Locked</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isSubmitted ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canViewResults}
                                    title={
                                      canViewResults
                                        ? 'View your result'
                                        : !canViewQuizResultDetails(quiz)
                                          ? 'Teacher has disabled result access'
                                          : 'Submission details are unavailable'
                                    }
                                    onClick={() =>
                                      canViewResults &&
                                      navigate(`/student/quiz/${quizId}/result`, {
                                        state: { submissionId: submission?._id },
                                      })
                                    }
                                  >
                                    View Result
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={!canViewLeaderboard}
                                    title={
                                      canViewLeaderboard
                                        ? 'View Leaderboard'
                                        : 'Teacher has disabled result access'
                                    }
                                    onClick={() => canViewLeaderboard && navigate(`/student/quiz/${quizId}/leaderboard`)}
                                  >
                                    Leaderboard
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" onClick={() => navigate(`/student/quiz/${quizId}/attempt`)}>
                                  Start Quiz
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8eaed] bg-[#f8fbff] flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-[#202124]">Class Assignments</h2>
                  <p className="text-sm text-[#5f6368] mt-1">Submit work and keep track of due dates</p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadAssignments}>Refresh</Button>
              </div>

              <div className="p-6">

                {assignmentError && (
                  <Alert type="error" className="mb-4" dismissible onDismiss={() => setAssignmentError(null)}>
                    {assignmentError}
                  </Alert>
                )}

                {assignments.length === 0 ? (
                  <EmptyState
                    icon="📭"
                    title="No assignments posted yet"
                    description="Your teacher has not posted assignments for this class yet."
                  />
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment._id} className="relative rounded-2xl border border-[#dfe5ee] p-4 pl-5 bg-[#fcfdff]">
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#7cc6b8]"></div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-[#202124]">{assignment.title}</h3>
                            <p className="text-sm text-[#5f6368]">{assignment.description}</p>
                            <p className="text-xs text-[#5f6368] mt-1">Due: {formatDate(assignment.dueDate)}</p>
                            <p className="text-xs text-[#5f6368] mt-1">Submission status: {getAssignmentSubmissionStatus(assignment)}</p>
                          </div>
                          {assignment.file && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadAssignment(assignment)}>
                              Download Attachment
                            </Button>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#e8eaed] flex flex-col md:flex-row gap-3 md:items-end">
                          <div className="flex-1">
                            <Input
                              label="Upload Submission (PDF, DOC, DOCX)"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleSelectSubmissionFile(assignment._id, e.target.files?.[0] || null)}
                            />
                          </div>
                          <Button onClick={() => handleSubmitAssignment(assignment)} disabled={isSubmittingAssignment}>
                            {isSubmittingAssignment ? 'Submitting...' : 'Submit Assignment'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lectures' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8eaed] bg-[#f8fbff]">
                <h2 className="text-xl font-semibold text-[#202124]">Live Lectures</h2>
                <p className="text-sm text-[#5f6368] mt-1">Join active sessions and view upcoming timetable</p>
              </div>

              <div className="p-6">

                {lectures.live.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#202124] mb-2">LIVE</h3>
                    <div className="space-y-3">
                      {lectures.live.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-[#f2b8b5] bg-[#fff6f6] p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#202124]">{lec.title}</p>
                              <p className="text-xs text-[#5f6368]">Status: LIVE • By {lec.teacherId?.name || 'Teacher'}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>Copy Link</Button>
                              <Button size="sm" onClick={() => navigate(`/lecture/${lec.roomId}`)}>Join Now</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lectures.upcoming.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#202124] mb-2">UPCOMING</h3>
                    <div className="space-y-3">
                      {lectures.upcoming.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-[#dfe5ee] p-4 bg-[#fcfdff]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#202124]">{lec.title}</p>
                              <p className="text-xs text-[#5f6368]">Status: UPCOMING • {formatDate(lec.scheduledAt)}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>Copy Link</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lectures.past.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#202124] mb-2">ENDED</h3>
                    <div className="space-y-2">
                      {lectures.past.map((lec) => (
                        <div key={lec._id} className="rounded-2xl border border-[#e8eaed] p-4 bg-[#fbfbfb]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#202124]">{lec.title}</p>
                              <p className="text-xs text-[#5f6368]">Status: ENDED • {formatDate(lec.createdAt)}</p>
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
                    description="Your teacher hasn't started or scheduled any lectures for this class."
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] p-6">
                <h2 className="text-xl font-semibold text-[#202124] mb-4">Teacher</h2>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#dfe5ee] bg-[#fafcff]">
                  <Avatar name={classData.teacher?.name || classData.teacher?.email || 'Teacher'} size="md" />
                  <div>
                    <p className="text-[#202124] font-medium">{classData.teacher?.name || 'Class Teacher'}</p>
                    <p className="text-sm text-[#5f6368]">{classData.teacher?.email || 'No email available'}</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8]">Instructor</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#e8eaed] p-6">
                <h2 className="text-xl font-semibold text-[#202124] mb-4">Students</h2>
                {!Array.isArray(classData.students) || classData.students.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    }
                    title="No students joined yet"
                    description="Your classmates will appear here once they join."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(classData.students || []).map((student, index) => (
                      <div key={student._id || index} className="flex items-center gap-3 p-3 rounded-2xl border border-[#dfe5ee] bg-[#fcfdff] hover:border-[#c6dafc] transition-colors">
                        <Avatar name={student.email || 'Student'} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#202124] truncate">{student.email || 'Student'}</p>
                          <p className="text-xs text-[#5f6368]">Student</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
