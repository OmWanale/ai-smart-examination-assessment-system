// API Client with axios
import axios from 'axios';

// Check if running locally (Electron dev mode or localhost browser)
const isLocalEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const { hostname, protocol } = window.location;
  return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
};

// Prefer local backend if environment variable is set or running locally
const LOCAL_BACKEND_URL = 'http://localhost:5000/api';
const PRODUCTION_URL = 'https://classyn-ai.onrender.com/api';

// Use REACT_APP_API_URL if set, otherwise determine based on environment
export const API_BASE_URL = 
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' && !isLocalEnvironment()
    ? PRODUCTION_URL
    : LOCAL_BACKEND_URL);

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
  deleteClass: (classId) => apiClient.delete(`/classes/${classId}`),
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
  generateFromFiles: (formData) =>
    apiClient.post('/quizzes/generate-from-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteQuiz: (quizId) => apiClient.delete(`/quizzes/${quizId}`),
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
  deleteClassAssignment: (classId, assignmentId) =>
    apiClient.delete(`/classes/${classId}/assignments/${assignmentId}`),

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
  deleteAssignment: (classId, assignmentId) =>
    apiClient.delete(`/classes/${classId}/assignments/${assignmentId}`),
};

export const lectureAPI = {
  createLecture: (data) =>
    apiClient.post('/lectures/create', data),
  getClassLectures: (classId) =>
    apiClient.get(`/classes/${classId}/lectures`),
  getLectureToken: async (roomId) => {
    const base = apiClient.defaults.baseURL || '';
    const classId = roomId?.startsWith('ClassynAI-') ? roomId.split('-')[1] : null;
    const isElectronRuntime = typeof window !== 'undefined' && !!window.electron;
    const isLocalRuntimeOrigin =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    const tryLectureTokenEndpoints = async (client, baseURLLabel) => {
      try {
        console.log('[lectureAPI] trying GET', `${baseURLLabel}/lectures/token?roomId=${encodeURIComponent(roomId)}`);
        return await client.get('/lectures/token', { params: { roomId } });
      } catch (error) {
        if (error?.response?.status === 404) {
          try {
            console.log('[lectureAPI] fallback GET', `${baseURLLabel}/lectures/${encodeURIComponent(roomId)}/token`);
            return await client.get(`/lectures/${roomId}/token`);
          } catch (error2) {
            if (error2?.response?.status === 404) {
              try {
                console.log('[lectureAPI] fallback POST', `${baseURLLabel}/lectures/token`);
                return await client.post('/lectures/token', { roomId });
              } catch (error3) {
                if (error3?.response?.status === 404 && classId) {
                  try {
                    console.log('[lectureAPI] class fallback GET', `${baseURLLabel}/classes/${classId}/lectures/token?roomId=${encodeURIComponent(roomId)}`);
                    return await client.get(`/classes/${classId}/lectures/token`, { params: { roomId } });
                  } catch (error4) {
                    if (error4?.response?.status === 404) {
                      try {
                        console.log('[lectureAPI] class fallback GET by param', `${baseURLLabel}/classes/${classId}/lectures/${encodeURIComponent(roomId)}/token`);
                        return await client.get(`/classes/${classId}/lectures/${roomId}/token`);
                      } catch (error5) {
                        if (error5?.response?.status === 404) {
                          console.log('[lectureAPI] class fallback POST', `${baseURLLabel}/classes/${classId}/lectures/token`);
                          return client.post(`/classes/${classId}/lectures/token`, { roomId });
                        }
                        throw error5;
                      }
                    }
                    throw error4;
                  }
                }
                throw error3;
              }
            }
            throw error2;
          }
        }
        throw error;
      }
    };

    console.log('[lectureAPI] token request start', { baseURL: base, roomId });
    try {
      return await tryLectureTokenEndpoints(apiClient, base);
    } catch (error) {
      throw error;
    }
  },
  startLecture: (lectureId) =>
    apiClient.post(`/lectures/${lectureId}/start`),
  endLecture: (lectureId) =>
    apiClient.post(`/lectures/${lectureId}/end`),
};

export const paperAPI = {
  generatePaper: (formData) =>
    apiClient.post('/papers/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadPaper: (data) =>
    apiClient.post('/papers/download', data, {
      responseType: 'blob',
    }),
};

export default apiClient;
