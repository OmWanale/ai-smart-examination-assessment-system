import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark' | 'system'
      
      // Get the effective theme (resolves 'system' to actual theme)
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
      },
      
      setTheme: (newTheme) => {
        set({ theme: newTheme });
        
        // Apply theme to document
        const effectiveTheme = newTheme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : newTheme;
        
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      toggleTheme: () => {
        const { theme, setTheme } = get();
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      },
      
      // Initialize theme on app load
      initializeTheme: () => {
        const { theme } = get();
        const effectiveTheme = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
        
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Listen for system theme changes
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', (e) => {
            if (get().theme === 'system') {
              if (e.matches) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }
          });
        }
      },
    }),
    {
      name: 'quiz-theme-storage',
    }
  )
);
