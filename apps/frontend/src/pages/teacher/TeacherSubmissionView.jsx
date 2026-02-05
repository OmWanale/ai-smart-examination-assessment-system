import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner } from '../../components/UI.jsx';
import { quizAPI } from '../../api/client';

// Student Submission Card Component
function SubmissionCard({ submission, isExpanded, onToggle }) {
  const scorePercentage = submission.percentage;
  const getScoreBadge = () => {
    if (scorePercentage >= 80) return { variant: 'success', label: 'Excellent' };
    if (scorePercentage >= 60) return { variant: 'warning', label: 'Good' };
    return { variant: 'error', label: 'Needs Improvement' };
  };

  const badge = getScoreBadge();

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header - Always Visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {submission.student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-text-dark dark:text-dark-text">
              {submission.student.name}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-dark-muted">
              {submission.student.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {submission.score}/{submission.totalQuestions}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-neutral-500">{scorePercentage.toFixed(0)}%</div>
              <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors">
            <svg 
              className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-dark-border">
          {/* Time Info */}
          <div className="flex items-center gap-6 mb-6 text-sm text-neutral-500 dark:text-dark-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Time: {submission.timeTakenMinutes || 'N/A'} min</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Answers */}
          <h4 className="font-semibold text-text-dark dark:text-dark-text mb-4">Answers</h4>
          <div className="space-y-4">
            {submission.answers.map((answer, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  answer.isCorrect 
                    ? 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700' 
                    : 'bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-dark-muted">
                    Question {answer.questionIndex + 1}
                  </span>
                  {answer.isCorrect ? (
                    <Badge variant="success" size="sm">✓ Correct</Badge>
                  ) : (
                    <Badge variant="error" size="sm">✗ Incorrect</Badge>
                  )}
                </div>

                <p className="font-medium text-text-dark dark:text-dark-text mb-3">
                  {answer.questionText}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 dark:text-dark-muted">Student answered:</span>
                    <span className={answer.isCorrect ? 'text-success-600 dark:text-success-400 font-medium' : 'text-error-600 dark:text-error-400 font-medium'}>
                      {answer.selectedOption}
                    </span>
                  </div>
                  
                  {!answer.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-dark-muted">Correct answer:</span>
                      <span className="text-success-600 dark:text-success-400 font-medium">
                        {answer.correctOption}
                      </span>
                    </div>
                  )}

                  {answer.explanation && (
                    <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-primary-700 dark:text-primary-300">{answer.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function TeacherSubmissionView() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await quizAPI.getQuizSubmissions(quizId);
      const result = response.data?.data || response.data;
      console.log('TeacherSubmissionView: loaded data:', result);
      setData(result);
    } catch (err) {
      console.error('TeacherSubmissionView: load error:', err);
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="text-neutral-500 dark:text-dark-muted mt-4">Loading submissions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" className="mb-4">
            {error || 'Failed to load submissions'}
          </Alert>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  const { quiz, submissions, submissionCount } = data;

  // Calculate stats
  const avgScore = submissions.length > 0 
    ? (submissions.reduce((sum, s) => sum + s.percentage, 0) / submissions.length).toFixed(1)
    : 0;
  
  const passedCount = submissions.filter(s => s.percentage >= 60).length;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-600 dark:text-dark-muted hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-secondary-500 to-accent-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">Student Submissions</h1>
              <p className="text-white/80 text-sm mt-1">{quiz.title}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
              {submissionCount}
            </div>
            <p className="text-sm text-neutral-500 dark:text-dark-muted">Total Submissions</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-secondary-600 dark:text-secondary-400">
              {avgScore}%
            </div>
            <p className="text-sm text-neutral-500 dark:text-dark-muted">Average Score</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-success-600 dark:text-success-400">
              {passedCount}
            </div>
            <p className="text-sm text-neutral-500 dark:text-dark-muted">Passed (≥60%)</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-display font-bold text-accent-600 dark:text-accent-400">
              {quiz.questionCount}
            </div>
            <p className="text-sm text-neutral-500 dark:text-dark-muted">Questions</p>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text mb-4 flex items-center gap-2">
            <span>👨‍🎓</span> Students ({submissionCount})
          </h3>

          {submissions.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-neutral-500 dark:text-dark-muted">No submissions yet</p>
            </Card>
          ) : (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                isExpanded={expandedId === submission.id}
                onToggle={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
              />
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/quiz/${quizId}/review`)}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Quiz
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/quiz/${quizId}/leaderboard`)}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Leaderboard
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
