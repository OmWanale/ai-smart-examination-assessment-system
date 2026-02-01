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
      set((state) => ({
        classes: [...state.classes, response.data],
        isLoading: false,
      }));
      return { success: true, data: response.data };
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
      set({ classes: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch classes', isLoading: false });
      return [];
    }
  },

  joinClass: async (joinCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await classAPI.joinByCode(joinCode);
      set((state) => ({
        classes: [...state.classes, response.data],
        isLoading: false,
      }));
      return { success: true, data: response.data };
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
      set({ quizzes: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch quizzes', isLoading: false });
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
