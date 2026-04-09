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
        <h1 className="text-3xl font-bold text-text-dark dark:text-slate-100 mb-2">Quiz Leaderboard</h1>
        <p className="text-text-muted dark:text-slate-400 mb-8">Student rankings and scores</p>

        {isLoading ? (
          <Card>
            <p className="text-center text-text-muted dark:text-slate-400">Loading leaderboard...</p>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <p className="text-center text-text-muted dark:text-slate-400 py-8">
              No submissions yet
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary-200 dark:border-dark-border">
                    <th className="text-left py-3 px-4 font-bold text-text-dark dark:text-slate-100">Rank</th>
                    <th className="text-left py-3 px-4 font-bold text-text-dark dark:text-slate-100">Student</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark dark:text-slate-100">Score</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark dark:text-slate-100">Percentage</th>
                    <th className="text-center py-3 px-4 font-bold text-text-dark dark:text-slate-100">Time (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className="border-b border-primary-100 dark:border-dark-border hover:bg-bg-light dark:hover:bg-dark-hover"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'success' : 'primary'}>
                            #{index + 1}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-dark dark:text-slate-200">
                        {submission.student?.email}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-text-dark dark:text-slate-200">
                        {submission.score}/{submission.quiz?.totalMarks || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary">
                          {submission.percentage}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-text-muted dark:text-slate-400">
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
