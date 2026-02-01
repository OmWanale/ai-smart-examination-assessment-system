import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { quizAPI } from '../../api/client';

export function Leaderboard() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { leaderboard, getLeaderboard } = useQuizStore();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quizResponse] = await Promise.all([
        quizAPI.getQuiz(quizId),
        getLeaderboard(quizId),
      ]);
      setQuizData(quizResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMedalIcon = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
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

  if (error || !quizData) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Alert type="error" className="mb-4">
            {error || 'Quiz not found'}
          </Alert>
          <Button onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  const maxScore = quizData.questions?.length || 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link to="/teacher/dashboard" className="hover:text-primary-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              to={`/teacher/class/${quizData.class}`}
              className="hover:text-primary-600"
            >
              Class
            </Link>
            <span>/</span>
            <span className="text-text-dark">Leaderboard</span>
          </div>
          <h1 className="text-3xl font-bold text-text-dark mb-2">{quizData.title}</h1>
          <p className="text-gray-600">View student submissions and rankings</p>
        </div>

        {/* Quiz Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {leaderboard?.length || 0}
              </div>
              <p className="text-gray-600 text-sm">Submissions</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">{maxScore}</div>
              <p className="text-gray-600 text-sm">Questions</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">
                {leaderboard && leaderboard.length > 0
                  ? ((leaderboard.reduce((sum, s) => sum + s.score, 0) /
                      (leaderboard.length * maxScore)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-gray-600 text-sm">Avg Score</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 capitalize">
                {quizData.difficulty || 'Medium'}
              </div>
              <p className="text-gray-600 text-sm">Difficulty</p>
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-dark">Rankings</h2>
            <Button variant="outline" size="sm" onClick={loadData}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>
          </div>

          {!leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No submissions yet</p>
              <p className="text-sm mt-1">Students haven't started taking this quiz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl">{getMedalIcon(index)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-semibold">
                              {submission.student?.email
                                ? submission.student.email[0].toUpperCase()
                                : 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-dark">
                              {submission.student?.email || 'Anonymous'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div
                          className={`text-lg font-bold ${getScoreColor(
                            submission.score,
                            maxScore
                          )}`}
                        >
                          {submission.score}/{maxScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((submission.score / maxScore) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant="secondary">
                          {formatTime(submission.timeSpent || 0)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <Button variant="outline" onClick={() => navigate(`/teacher/class/${quizData.class}`)}>
            View Class
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
