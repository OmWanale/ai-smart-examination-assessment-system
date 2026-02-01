import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge } from '../../components/UI.jsx';
import { submissionAPI, quizAPI } from '../../api/client';

export function QuizResult() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const submissionId = location.state?.submissionId;

  const [submission, setSubmission] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, submissionId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subResponse, quizResponse] = await Promise.all([
        submissionId ? submissionAPI.getSubmission(submissionId) : Promise.resolve(null),
        quizAPI.getQuiz(quizId),
      ]);

      if (subResponse) {
        setSubmission(subResponse.data);
      }
      setQuiz(quizResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load result');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error || 'Result not found'}
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  if (!submission) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            Submission not found
          </Alert>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  const percentage = ((submission.score / (quiz.questions?.length || 1)) * 100).toFixed(1);
  const passed = percentage >= 70;

  const getPerformanceColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = () => {
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 70) return 'Great Job!';
    if (percentage >= 50) return 'Good Try!';
    return 'Keep Practicing!';
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Result Summary Card */}
        <Card className="mb-6">
          <div className="text-center py-8">
            {passed ? (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 110 18 9 9 0 010-18z"
                  />
                </svg>
              </div>
            )}

            <h2 className="text-3xl font-bold text-text-dark mb-2">{quiz.title}</h2>
            <p className={`text-2xl font-bold mb-4 ${getPerformanceColor()}`}>
              {getPerformanceLabel()}
            </p>
          </div>
        </Card>

        {/* Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor()}`}>
                {percentage}%
              </div>
              <p className="text-gray-600">Your Score</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {submission.score}
              </div>
              <p className="text-gray-600">
                Out of {quiz.questions?.length || submission.maxScore}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-600 mb-2">
                {Math.floor((submission.timeSpent || 0) / 60)}m
              </div>
              <p className="text-gray-600">Time Spent</p>
            </div>
          </Card>
        </div>

        {/* Correct/Incorrect Breakdown */}
        <Card className="mb-6">
          <h3 className="text-xl font-semibold text-text-dark mb-4">Performance Breakdown</h3>

          <div className="space-y-3">
            {/* Correct */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Correct Answers</span>
                <Badge variant="secondary">{submission.score}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${(submission.score / (quiz.questions?.length || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Incorrect */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Incorrect Answers</span>
                <Badge variant="primary">
                  {(quiz.questions?.length || 1) - submission.score}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      (((quiz.questions?.length || 1) - submission.score) /
                        (quiz.questions?.length || 1)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-text-dark mb-4">Details</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted at</span>
              <span className="font-medium text-text-dark">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
            </div>
            {quiz.difficulty && (
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty</span>
                <span className="font-medium text-text-dark capitalize">{quiz.difficulty}</span>
              </div>
            )}
            {quiz.timeLimit && (
              <div className="flex justify-between">
                <span className="text-gray-600">Time Limit</span>
                <span className="font-medium text-text-dark">{quiz.timeLimit} minutes</span>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/student/class/${quiz.class}`, { replace: true })
              }
            >
              Back to Class
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/student/dashboard', { replace: true })}
            >
              Dashboard
            </Button>
          </div>
          {submission && (
            <Link to={`/teacher/quiz/${quizId}/leaderboard`}>
              <Button variant="outline">
                View Leaderboard →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
