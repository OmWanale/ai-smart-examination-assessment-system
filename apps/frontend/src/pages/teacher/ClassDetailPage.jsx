import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { useQuizStore } from '../store/quizStore';
import { MainLayout } from '../components/Layout';

export function ClassDetailPage() {
  const { classId } = useParams();
  const { classes, getQuizzesForClass, quizzes } = useQuizStore();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    const found = classes.find((c) => c._id === classId);
    setClassData(found);
    if (found) {
      getQuizzesForClass(classId);
    }
  }, [classId, classes]);

  if (!classData) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-gray-600">Loading class...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-text-dark">{classData.name}</h1>
          <p className="text-gray-600 mt-2">{classData.description}</p>
        </div>

        {/* Class Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-sm text-gray-600 mb-2">Join Code</h3>
            <p className="text-2xl font-mono font-bold text-primary-600">{classData.joinCode}</p>
            <p className="text-xs text-gray-500 mt-2">Share with students</p>
          </Card>
          <Card>
            <h3 className="text-sm text-gray-600 mb-2">Students</h3>
            <p className="text-2xl font-bold">{classData.students?.length || 0}</p>
          </Card>
          <Card>
            <h3 className="text-sm text-gray-600 mb-2">Quizzes</h3>
            <p className="text-2xl font-bold">{quizzes.length}</p>
          </Card>
        </div>

        {/* Students List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-dark mb-4">Students</h2>
          {classData.students && classData.students.length > 0 ? (
            <Card>
              <div className="space-y-2">
                {classData.students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="text-text-dark">{student.email}</span>
                    <Badge variant="secondary">Student</Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-center text-gray-600">No students joined yet</p>
            </Card>
          )}
        </div>

        {/* Quizzes */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-dark">Quizzes</h2>
            <Link to={`/teacher/create-quiz?classId=${classId}`}>
              <Button>+ Create Quiz</Button>
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No quizzes created yet</p>
                <Link to={`/teacher/create-quiz?classId=${classId}`}>
                  <Button>Create First Quiz</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <h3 className="text-xl font-bold text-text-dark mb-2">{quiz.title}</h3>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="primary">{quiz.difficulty}</Badge>
                    <span className="text-sm text-gray-600">{quiz.durationMinutes} min</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {quiz.questions?.length || 0} questions
                  </p>
                  <Link to={`/teacher/quiz/${quiz._id}/leaderboard`}>
                    <Button variant="outline" className="w-full">
                      View Leaderboard
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
