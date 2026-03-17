import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState, Avatar, Input } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { classAPI, assignmentAPI, lectureAPI } from '../../api/client';
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

  const { quizzes, getQuizzesForClass } = useQuizStore();

  useEffect(() => {
    loadData();
    loadLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classResponse] = await Promise.all([classAPI.getClass(classId)]);
      const rawClassData = classResponse.data?.data?.class || classResponse.data?.class || classResponse.data;
      console.log('[StudentClassDetail] Raw class response:', classResponse.data);
      console.log('[StudentClassDetail] Extracted class data:', rawClassData);
      setClassData(rawClassData);

      await getQuizzesForClass(classId);
      const allSubmissions = {};
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 mb-4">
          <Link to="/student/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
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
            <h1 className="text-3xl font-display font-bold text-white mb-2">{classData.name}</h1>
            {classData.description && (
              <p className="text-white/80">{classData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={classData.teacher?.email} size="md" />
            <div>
              <p className="text-sm text-text-muted dark:text-slate-400">Taught by</p>
              <p className="font-semibold text-text-dark dark:text-slate-200">{classData.teacher?.email}</p>
            </div>
          </div>
        </Card>

        {/* Class Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
              {classData.students?.length || 0}
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm mt-1">Students</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-secondary-600 dark:text-secondary-400">
              {quizzes?.length || 0}
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm mt-1">Quizzes</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400">
              {Object.keys(submissions).length}
            </div>
            <p className="text-text-muted dark:text-slate-400 text-sm mt-1">Completed</p>
          </Card>
        </div>

        {/* Quizzes List */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2">
              <span>📝</span> Available Quizzes
            </h2>
            <Button variant="ghost" size="sm" onClick={loadData}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            </Button>
          </div>

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

                return (
                  <div
                    key={quizId}
                    className="flex items-center justify-between p-4 bg-bg-light dark:bg-dark-hover rounded-xl hover:shadow-warm transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSubmitted 
                            ? 'bg-success-100 dark:bg-success-600/20' 
                            : 'bg-primary-100 dark:bg-primary-600/20'
                        }`}>
                          {isSubmitted ? (
                            <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
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
                            {isSubmitted && (
                              <Badge variant="success" size="sm">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isSubmitted ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/student/quiz/${quizId}/result`, {
                                state: { submissionId: submissions[quizId]?._id },
                              })
                            }
                          >
                            View Result
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/student/quiz/${quizId}/leaderboard`)}
                            title="View Leaderboard"
                          >
                            🏆
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/student/quiz/${quizId}/attempt`)}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Quiz
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Assignments List */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2">
              <span>📎</span> Class Assignments
            </h2>
            <Button variant="ghost" size="sm" onClick={loadAssignments}>Refresh</Button>
          </div>

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
                <div key={assignment._id} className="p-4 rounded-xl border border-primary-100 dark:border-dark-border">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-dark dark:text-slate-100">{assignment.title}</h3>
                      <p className="text-sm text-text-muted dark:text-slate-400">{assignment.description}</p>
                      <p className="text-xs text-text-muted dark:text-slate-500 mt-1">
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </p>
                    </div>
                    {assignment.file && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadAssignment(assignment)}>
                        Download Attachment
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="flex-1">
                      <Input
                        label="Upload Submission (PDF, DOC, DOCX)"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleSelectSubmissionFile(assignment._id, e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button
                      onClick={() => handleSubmitAssignment(assignment)}
                      disabled={isSubmittingAssignment}
                    >
                      {isSubmittingAssignment ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lectures Section */}
        <Card className="mt-6">
          <h2 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100 flex items-center gap-2 mb-4">
            <span>🎥</span> Live Lectures
          </h2>

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
                      <p className="text-xs text-text-muted dark:text-slate-400">By {lec.teacherId?.name || 'Teacher'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>📋 Copy Link</Button>
                      <Button size="sm" onClick={() => navigate(`/lecture/${lec.roomId}`)}>🔴 Join Now</Button>
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
                    <Button size="sm" variant="outline" onClick={() => copyLectureLink(lec.roomId)}>📋 Copy Link</Button>
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
              description="Your teacher hasn't started or scheduled any lectures for this class."
            />
          )}
        </Card>

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
