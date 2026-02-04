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
      const response = await quizAPI.createQuiz({
        class: classId,
        ...quizData,
      });
      set((state) => ({
        quizzes: [...state.quizzes, response.data],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create quiz';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  generateQuizWithAI: async (classId, topic, difficulty, questionCount) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizAPI.generateWithAI(
        classId,
        topic,
        difficulty,
        questionCount
      );
      set((state) => ({
        quizzes: [...state.quizzes, response.data],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to generate quiz';
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
      const response = await submissionAPI.submitQuiz(quizId, answers);
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
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

  clearError: () => set({ error: null }),
}));
