// API Client with axios
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      window.location.href = '/login';
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
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
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
  generateWithAI: (classId, topic, difficulty, questionCount) =>
    apiClient.post('/quizzes/ai-generate', {
      classId,
      topic,
      difficulty,
      questionCount,
    }),
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
};

export default apiClient;
