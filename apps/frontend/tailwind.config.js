/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary colors - Warm Golden/Amber
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Secondary colors - Warm Terracotta/Coral
        secondary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Accent colors - Rich Gold/Yellow
        accent: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        // Warm neutral backgrounds
        bg: {
          light: '#FFFCF5',
          DEFAULT: '#FFF9EB',
          warm: '#FEF3D6',
          card: '#FFFFFF',
        },
        // Dark mode backgrounds - cool black/blue palette
        dark: {
          bg: '#0B1120',
          card: '#111827',
          surface: '#1E293B',
          border: '#334155',
          hover: '#1F2937',
        },
        // Text colors - Warm charcoal tones
        text: {
          light: '#A8A29E',
          muted: '#78716C',
          DEFAULT: '#57534E',
          dark: '#1C1917',
        },
        // Semantic colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(120, 53, 15, 0.03)",
        DEFAULT: "0 1px 3px 0 rgba(120, 53, 15, 0.06), 0 1px 2px 0 rgba(120, 53, 15, 0.04)",
        md: "0 4px 6px -1px rgba(120, 53, 15, 0.07), 0 2px 4px -1px rgba(120, 53, 15, 0.04)",
        lg: "0 10px 15px -3px rgba(120, 53, 15, 0.08), 0 4px 6px -2px rgba(120, 53, 15, 0.04)",
        xl: "0 20px 25px -5px rgba(120, 53, 15, 0.08), 0 10px 10px -5px rgba(120, 53, 15, 0.03)",
        "warm": "0 4px 14px 0 rgba(217, 119, 6, 0.15)",
        "warm-lg": "0 10px 30px 0 rgba(217, 119, 6, 0.2)",
        "dark": "0 4px 14px 0 rgba(0, 0, 0, 0.3)",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
