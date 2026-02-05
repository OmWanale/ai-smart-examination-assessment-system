import { create } from 'zustand';
import { classAPI, quizAPI, submissionAPI } from '../api/client';

export const useQuizStore = create((set) => ({
  classes: [],
  quizzes: [],
  currentClass: null,
  currentQuiz: null,
  leaderboard: [],
  isLoading: false,
  error: null,

  // Class operations
  createClass: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await classAPI.createClass(name, description);
      // Backend returns: { success, message, data: { class: { ... } } }
      const classData = response.data?.data?.class || response.data?.class || response.data;
      console.log('[QuizStore] createClass response:', response.data);
      console.log('[QuizStore] Extracted class data:', classData);
      set((state) => ({
        classes: [...state.classes, classData],
        isLoading: false,
      }));
      return { success: true, data: classData };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create class';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  getMyClasses: async () => {
    set({ isLoading: true });
    try {
      const response = await classAPI.getMyClasses();
      // Backend returns: { success, data: { classes: [...] } }
      const classesArray = response.data?.data?.classes || response.data?.classes || [];
      console.log('[QuizStore] getMyClasses response:', response.data);
      console.log('[QuizStore] Extracted classes:', classesArray);
      set({ classes: Array.isArray(classesArray) ? classesArray : [], isLoading: false });
      return classesArray;
    } catch (error) {
      console.error('[QuizStore] Failed to fetch classes:', error);
      set({ error: 'Failed to fetch classes', classes: [], isLoading: false });
      return [];
    }
  },

  joinClass: async (joinCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await classAPI.joinByCode(joinCode);
      // Backend returns: { success, message, data: { class: { ... } } }
      const classData = response.data?.data?.class || response.data?.class || response.data;
      console.log('[QuizStore] joinClass response:', response.data);
      console.log('[QuizStore] Extracted class data:', classData);
      set((state) => ({
        classes: [...state.classes, classData],
        isLoading: false,
      }));
      return { success: true, data: classData };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join class';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  setCurrentClass: (classData) => set({ currentClass: classData }),

  // Quiz operations
  createQuiz: async (classId, quizData) => {
    set({ isLoading: true, error: null });
    try {
      // Transform frontend format to backend format
      const transformedQuestions = (quizData.questions || []).map((q) => ({
        questionText: q.question || q.questionText,
        options: q.options,
        correctOptionIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correctOptionIndex,
      }));

      const payload = {
        classId,
        title: quizData.title,
        description: quizData.description,
        difficulty: quizData.difficulty || 'medium',
        durationMinutes: quizData.timeLimit || quizData.durationMinutes || 30,
        questions: transformedQuestions,
      };

      console.log('[QuizStore] createQuiz payload:', payload);

      const response = await quizAPI.createQuiz(payload);
      // Backend returns: { success, data: { quiz: { ... } } }
      const quizResult = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('[QuizStore] createQuiz response:', response.data);
      console.log('[QuizStore] Extracted quiz:', quizResult);

      set((state) => ({
        quizzes: [...state.quizzes, quizResult],
        isLoading: false,
      }));
      return { success: true, data: quizResult };
    } catch (error) {
      console.error('[QuizStore] createQuiz error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to create quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  generateQuizWithAI: async (classId, topic, difficulty, questionCount, durationMinutes = 30) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        classId,
        topic,
        difficulty,
        numberOfQuestions: questionCount,
        durationMinutes,
      };
      console.log('[QuizStore] generateQuizWithAI payload:', payload);

      const response = await quizAPI.generateWithAI(payload);
      // Backend returns: { success, data: { quiz: { ... } } }
      const quizResult = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('[QuizStore] generateQuizWithAI response:', response.data);
      console.log('[QuizStore] Extracted quiz:', quizResult);

      set((state) => ({
        quizzes: [...state.quizzes, quizResult],
        isLoading: false,
      }));
      return { success: true, data: quizResult };
    } catch (error) {
      console.error('[QuizStore] generateQuizWithAI error:', error.response?.data || error.message);
      const message =
        error.response?.data?.message || 'Failed to generate quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Preview AI quiz without saving
  previewQuizWithAI: async (classId, topic, difficulty, questionCount, durationMinutes) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        classId,
        topic,
        difficulty,
        numberOfQuestions: questionCount,
        durationMinutes,
      };
      console.log('[QuizStore] previewQuizWithAI payload:', payload);

      const response = await quizAPI.previewWithAI(payload);
      // Backend returns: { success, data: { preview: { ... } } }
      const previewData = response.data?.data?.preview || response.data?.preview || response.data;
      console.log('[QuizStore] previewQuizWithAI response:', response.data);
      console.log('[QuizStore] Preview data:', previewData);

      set({ isLoading: false });
      return { success: true, data: previewData };
    } catch (error) {
      console.error('[QuizStore] previewQuizWithAI error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to generate quiz preview';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Publish a previewed quiz
  publishQuizFromPreview: async (classId, quizData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        classId,
        title: quizData.title,
        description: quizData.description,
        difficulty: quizData.difficulty,
        durationMinutes: quizData.durationMinutes,
        questions: quizData.questions,
        showCorrectAnswers: quizData.showCorrectAnswers ?? true,
        showExplanations: quizData.showExplanations ?? true,
        showResultsToStudents: quizData.showResultsToStudents ?? true,
      };
      console.log('[QuizStore] publishQuizFromPreview payload:', payload);

      const response = await quizAPI.publishFromPreview(payload);
      // Backend returns: { success, data: { quiz: { ... } } }
      const quizResult = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('[QuizStore] publishQuizFromPreview response:', response.data);
      console.log('[QuizStore] Published quiz:', quizResult);

      set((state) => ({
        quizzes: [...state.quizzes, quizResult],
        isLoading: false,
      }));
      return { success: true, data: quizResult };
    } catch (error) {
      console.error('[QuizStore] publishQuizFromPreview error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to publish quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  getQuizzesForClass: async (classId) => {
    set({ isLoading: true });
    try {
      const response = await quizAPI.getQuizzesForClass(classId);
      // Backend may return: { success, data: { quizzes: [...] } } or { quizzes: [...] } or [...]
      const rawData = response.data?.data?.quizzes || response.data?.quizzes || response.data;
      console.log('[QuizStore] getQuizzesForClass raw response:', response.data);
      console.log('[QuizStore] Extracted quizzes:', rawData);
      // Ensure we always have an array
      const quizzesArray = Array.isArray(rawData) ? rawData : [];
      set({ quizzes: quizzesArray, isLoading: false });
      return quizzesArray;
    } catch (error) {
      console.error('[QuizStore] Failed to fetch quizzes:', error);
      set({ error: 'Failed to fetch quizzes', quizzes: [], isLoading: false });
      return [];
    }
  },

  setCurrentQuiz: (quizData) => set({ currentQuiz: quizData }),

  // Submission operations
  submitQuiz: async (quizId, answers) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[QuizStore] submitQuiz payload:', { quizId, answers });
      const response = await submissionAPI.submitQuiz(quizId, answers);
      console.log('[QuizStore] submitQuiz response:', response.data);
      // Backend returns: { success, message, data: { submission: {...} } }
      const submissionData = response.data?.data?.submission || response.data?.submission || response.data;
      set({ isLoading: false });
      return { success: true, data: submissionData };
    } catch (error) {
      console.error('[QuizStore] submitQuiz error:', error.response?.data || error.message);
      const message =
        error.response?.data?.message || 'Failed to submit quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  getLeaderboard: async (quizId) => {
    set({ isLoading: true });
    try {
      const response = await submissionAPI.getLeaderboard(quizId);
      set({ leaderboard: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch leaderboard', isLoading: false });
      return [];
    }
  },

  // Teacher: Get full quiz with answers
  getQuizForTeacher: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizAPI.getQuizForTeacher(quizId);
      const quizData = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('[QuizStore] getQuizForTeacher:', quizData);
      set({ currentQuiz: quizData, isLoading: false });
      return { success: true, data: quizData };
    } catch (error) {
      console.error('[QuizStore] getQuizForTeacher error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to load quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Student: Get quiz for attempt (no answers)
  getQuizForAttempt: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizAPI.getQuizForAttempt(quizId);
      const quizData = response.data?.data?.quiz || response.data?.quiz || response.data;
      console.log('[QuizStore] getQuizForAttempt:', quizData);
      set({ currentQuiz: quizData, isLoading: false });
      return { success: true, data: quizData };
    } catch (error) {
      console.error('[QuizStore] getQuizForAttempt error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to load quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Teacher: Get all submissions for a quiz
  getQuizSubmissions: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizAPI.getQuizSubmissions(quizId);
      const data = response.data?.data || response.data;
      console.log('[QuizStore] getQuizSubmissions:', data);
      set({ isLoading: false });
      return { success: true, data };
    } catch (error) {
      console.error('[QuizStore] getQuizSubmissions error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to load submissions';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Student: Get quiz review after submission
  getQuizReviewForStudent: async (quizId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizAPI.getQuizReviewForStudent(quizId);
      const data = response.data?.data || response.data;
      console.log('[QuizStore] getQuizReviewForStudent:', data);
      set({ isLoading: false });
      return { success: true, data };
    } catch (error) {
      console.error('[QuizStore] getQuizReviewForStudent error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to load review';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));
