import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { OAuthCallback } from './pages/OAuthCallback';
import { NotFoundPage, UnauthorizedPage } from './pages/ErrorPages';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { CreateClass } from './pages/teacher/CreateClass';
import { ClassDetail } from './pages/teacher/ClassDetail';
import { CreateQuiz } from './pages/teacher/CreateQuiz';
import { Leaderboard } from './pages/teacher/Leaderboard';
import { TeacherQuizReview } from './pages/teacher/TeacherQuizReview';
import { TeacherSubmissionView } from './pages/teacher/TeacherSubmissionView';
import { TeacherAssignments } from './pages/teacher/Assignments';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentClasses } from './pages/student/StudentClasses';
import { StudentQuizzes } from './pages/student/StudentQuizzes';
import { JoinClass } from './pages/student/JoinClass';
import { StudentClassDetail } from './pages/student/StudentClassDetail';
import { QuizAttempt } from './pages/student/QuizAttempt';
import { QuizResult } from './pages/student/QuizResult';
import { StudentQuizReview } from './pages/student/StudentQuizReview';
import { StudentResults } from './pages/student/StudentResults';
import { StudentAssignments } from './pages/student/Assignments';
import { useAuthStore } from './store/authStore';
import './App.css';

function App() {
  const { user, initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* OAuth callback - must be public to receive token */}
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Root - Redirect based on auth status */}
        <Route
          path="/"
          element={
            user?.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : user?.role === 'student' ? (
              <Navigate to="/student/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute requiredRole="teacher">
              <Routes>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="create-class" element={<CreateClass />} />
                <Route path="class/:classId" element={<ClassDetail />} />
                <Route path="create-quiz" element={<CreateQuiz />} />
                <Route path="quiz/:quizId/leaderboard" element={<Leaderboard />} />
                <Route path="quiz/:quizId/review" element={<TeacherQuizReview />} />
                <Route path="quiz/:quizId/submissions" element={<TeacherSubmissionView />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute requiredRole="student">
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="classes" element={<StudentClasses />} />
                <Route path="quizzes" element={<StudentQuizzes />} />
                <Route path="join-class" element={<JoinClass />} />
                <Route path="class/:classId" element={<StudentClassDetail />} />
                <Route path="quiz/:quizId/attempt" element={<QuizAttempt />} />
                <Route path="quiz/:quizId/result" element={<QuizResult />} />
                <Route path="quiz/:quizId/review" element={<StudentQuizReview />} />
                <Route path="quiz/:quizId/leaderboard" element={<Leaderboard />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
