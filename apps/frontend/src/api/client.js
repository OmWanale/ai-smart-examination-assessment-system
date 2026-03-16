// API Client with axios
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://classyn-ai.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password, name, role) =>
    apiClient.post('/auth/register', { email, password, name, role }),
  registerTeacher: (email, password, name) =>
    apiClient.post('/auth/register/teacher', { email, password, name }),
  registerStudent: (email, password, name) =>
    apiClient.post('/auth/register/student', { email, password, name }),
  login: (email, password, role) =>
    apiClient.post('/auth/login', { email, password, role }),
  getMe: () => apiClient.get('/auth/me'),
  googleLogin: (code) =>
    apiClient.post('/auth/google', { code }),
};

export const classAPI = {
  createClass: (name, description) =>
    apiClient.post('/classes', { name, description }),
  getMyClasses: () => apiClient.get('/classes'),
  joinByCode: (joinCode) =>
    apiClient.post('/classes/join', { joinCode }),
  getClass: (classId) => apiClient.get(`/classes/${classId}`),
};

export const quizAPI = {
  createQuiz: (data) => apiClient.post('/quizzes', data),
  getQuizzesForClass: (classId) =>
    apiClient.get(`/quizzes/class/${classId}`),
  getQuiz: (quizId) => apiClient.get(`/quizzes/${quizId}`),
  getQuizForTeacher: (quizId) => apiClient.get(`/quizzes/${quizId}/teacher-view`),
  getQuizForAttempt: (quizId) => apiClient.get(`/quizzes/${quizId}/attempt`),
  getQuizSubmissions: (quizId) => apiClient.get(`/quizzes/${quizId}/submissions`),
  getQuizReviewForStudent: (quizId) => apiClient.get(`/quizzes/${quizId}/student-review`),
  generateWithAI: (data) =>
    apiClient.post('/quizzes/ai-generate', data),
  previewWithAI: (data) =>
    apiClient.post('/quizzes/ai-preview', data),
  publishFromPreview: (data) =>
    apiClient.post('/quizzes/ai-publish', data),
};

export const submissionAPI = {
  submitQuiz: (quizId, answers) =>
    apiClient.post('/submissions', { quizId, answers }),
  getLeaderboard: (quizId) =>
    apiClient.get(`/submissions/quiz/${quizId}/leaderboard`),
  getSubmissionsForQuiz: (quizId) =>
    apiClient.get(`/submissions/quiz/${quizId}`),
  getSubmission: (submissionId) =>
    apiClient.get(`/submissions/${submissionId}`),
  getStudentSubmissions: () =>
    apiClient.get('/submissions/student'),
};

export const assignmentAPI = {
  createClassAssignment: (classId, formData) =>
    apiClient.post(`/classes/${classId}/assignments/create`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getClassAssignments: (classId) =>
    apiClient.get(`/classes/${classId}/assignments`),
  downloadClassAssignmentFile: (classId, assignmentId) =>
    apiClient.get(`/classes/${classId}/assignments/${assignmentId}/download`, {
      responseType: 'blob',
    }),
  submitClassAssignment: (classId, assignmentId, formData) =>
    apiClient.post(`/classes/${classId}/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getClassAssignmentSubmissions: (classId, assignmentId) =>
    apiClient.get(`/classes/${classId}/assignments/${assignmentId}/submissions`),
  downloadClassSubmissionFile: (classId, submissionId) =>
    apiClient.get(`/classes/${classId}/assignments/submissions/${submissionId}/download`, {
      responseType: 'blob',
    }),

  // Backward-compatibility aliases for existing pages/components.
  createAssignment: (classId, formData) =>
    apiClient.post(`/classes/${classId}/assignments/create`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAssignments: (classId) =>
    apiClient.get(`/classes/${classId}/assignments`),
  downloadAssignmentFile: (classId, assignmentId) =>
    apiClient.get(`/classes/${classId}/assignments/${assignmentId}/download`, {
      responseType: 'blob',
    }),
  submitAssignment: (classId, assignmentId, formData) =>
    apiClient.post(`/classes/${classId}/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSubmissions: (classId, assignmentId) =>
    apiClient.get(`/classes/${classId}/assignments/${assignmentId}/submissions`),
  downloadSubmissionFile: (classId, submissionId) =>
    apiClient.get(`/classes/${classId}/assignments/submissions/${submissionId}/download`, {
      responseType: 'blob',
    }),
};

export default apiClient;
