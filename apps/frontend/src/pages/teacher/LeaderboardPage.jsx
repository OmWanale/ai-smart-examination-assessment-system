import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Badge } from '../components/UI';
import { useQuizStore } from '../store/quizStore';
import { MainLayout } from '../components/Layout';

export function LeaderboardPage() {
  const { quizId } = useParams();
  const { getLeaderboard, leaderboard, isLoading } = useQuizStore();

  useEffect(() => {
    getLeaderboard(quizId);
  }, [quizId]);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-dark mb-2">Quiz Leaderboard</h1>
        <p className="text-gray-600 mb-8">Student rankings and scores</p>

        {isLoading ? (
          <Card>
            <p className="text-center text-gray-600">Loading leaderboard...</p>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <p className="text-center text-gray-600 py-8">
              No submissions yet
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-text-dark">Rank</th>
                    <th className="text-left py-3 px-4 font-bold text-text-dark">Student</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark">Score</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark">Percentage</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark">Time (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'success' : 'primary'}>
                            #{index + 1}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-dark">
                        {submission.student?.email}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {submission.score}/{submission.quiz?.totalMarks || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary">
                          {submission.percentage}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {submission.timeTakenMinutes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
