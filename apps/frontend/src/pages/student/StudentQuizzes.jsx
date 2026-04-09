import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, PageHeader } from '../../components/Layout.jsx';
import { Card, Button, Alert, Badge, Spinner, EmptyState } from '../../components/UI.jsx';
import { useQuizStore } from '../../store/quizStore';
import { quizAPI } from '../../api/client';

export function StudentQuizzes() {
  const { classes, getMyClasses } = useQuizStore();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuizzes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First get all classes
      const classesData = await getMyClasses();
      
      // Then fetch quizzes for each class
      const allQuizzes = [];
      for (const cls of classesData) {
        try {
          const classId = cls.id || cls._id;
          const response = await quizAPI.getQuizzesForClass(classId);
          const classQuizzes = response.data?.data?.quizzes || response.data?.quizzes || [];
          // Add class info to each quiz
          classQuizzes.forEach(quiz => {
            allQuizzes.push({
              ...quiz,
              className: cls.name,
              classId: classId,
            });
          });
        } catch (err) {
          console.error(`Failed to fetch quizzes for class ${cls.name}:`, err);
        }
      }
      
      setQuizzes(allQuizzes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuizStatus = (quiz) => {
    if (quiz.hasSubmitted) return { label: 'Completed', variant: 'secondary' };
    if (!quiz.isActive) return { label: 'Inactive', variant: 'danger' };
    return { label: 'Available', variant: 'primary' };
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <PageHeader
            title="My Quizzes"
            subtitle="View and take quizzes from all your classes"
          />
          <Link to="/student/join-class">
            <Button variant="outline" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Join More Classes
            </Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No quizzes available"
            description={classes.length === 0 ? 'Join a class to access quizzes.' : "Your teachers haven't created any quizzes yet."}
            action={classes.length === 0 && (
              <Link to="/student/join-class">
                <Button>Join a Class</Button>
              </Link>
            )}
          />
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              const quizId = quiz.id || quiz._id;
              return (
                <Card key={quizId} className="hover:shadow-warm hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-display font-semibold text-text-dark dark:text-slate-100">{quiz.title}</h3>
                      <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">From: {quiz.className}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-slate-400 mb-5">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {quiz.questions?.length || quiz.questionCount || 0} questions
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {quiz.durationMinutes || quiz.timeLimit || 30} minutes
                    </span>
                    <span className="flex items-center gap-2 capitalize">
                      <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {quiz.difficulty || 'medium'}
                    </span>
                  </div>

                  <div className="flex justify-end border-t border-neutral-100 dark:border-dark-border pt-4">
                    {quiz.hasSubmitted ? (
                      <Link to={`/student/quiz/${quizId}/result`}>
                        <Button variant="outline">View Results</Button>
                      </Link>
                    ) : quiz.isActive !== false ? (
                      <Link to={`/student/quiz/${quizId}/attempt`}>
                        <Button>Start Quiz</Button>
                      </Link>
                    ) : (
                      <Button disabled>Quiz Inactive</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
