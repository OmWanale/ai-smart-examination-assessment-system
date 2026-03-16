# Quiz Desktop - React Frontend

A modern, responsive React frontend for the Quiz Desktop application, built with Tailwind CSS and integrated with the Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Backend running on `https://classyn-ai.onrender.com`

### Installation

```bash
cd apps/frontend
npm install
```

### Development
```bash
npm start
```
Opens [https://classyn-ai.onrender.com](https://classyn-ai.onrender.com) in your browser.

### Production Build
```bash
npm run build
```
Builds the app for production to the `build` folder.

## 🎨 Tailwind CSS Setup

The frontend uses **Tailwind CSS v3.4** for styling with custom color configuration:

### Color System
- **Primary**: Indigo (#4F46E5) - Primary actions and highlights
- **Secondary**: Emerald (#10B981) - Positive/success states
- **Accent**: Purple (#8B5CF6) - Special features
- **Background**: Light Gray (#F9FAFB) - Page background
- **Text**: Dark Gray (#111827) - Main text

### Configuration Files
- `tailwind.config.js` - Color overrides and theme extensions
- `postcss.config.js` - PostCSS pipeline for Tailwind
- `src/index.css` - Tailwind directives and component classes

### Usage

#### Utility Classes
```jsx
<div className="bg-primary-50 text-primary-900 p-4 rounded-lg">
  Primary color example
</div>
```

#### Component Classes
The following component classes are predefined in `index.css`:

```jsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-outline">Outline Button</button>

<div className="card">
  <h2>Card Content</h2>
  <p>Cards with shadow and padding</p>
</div>

<input className="input" placeholder="Text input" />
<label className="label">Form Label</label>
```

## 📁 Project Structure

```
src/
├── api/
│   └── client.js          # Axios API client with interceptors
├── components/
│   ├── UI.jsx            # Reusable UI components (Button, Input, Card, Badge, Alert)
│   └── AuthForms.jsx     # Login and Register form components
├── store/
│   ├── authStore.js      # Zustand auth state management
│   └── quizStore.js      # Zustand quiz state management
├── App.js                # Main App component with demo page
├── index.js              # React entry point
└── index.css             # Tailwind directives and component classes
```

## 🔗 API Integration

The frontend is configured to connect to the backend API at `https://classyn-ai.onrender.com/api`.

### Configuration
Set the API URL via environment variable:
```
REACT_APP_API_URL=https://classyn-ai.onrender.com/api
```

See `.env.example` for all available configuration options.

### Available API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user
- `POST /auth/google` - Google OAuth login

#### Classes
- `POST /classes` - Create new class (teacher only)
- `GET /classes` - Get user's classes
- `POST /classes/join` - Join class by code (student)
- `GET /classes/:id` - Get class details

#### Quizzes
- `POST /quizzes` - Create new quiz
- `GET /quizzes/class/:classId` - Get quizzes for class
- `GET /quizzes/:id` - Get quiz details
- `POST /quizzes/ai-generate` - Generate quiz with AI

#### Submissions
- `POST /submissions` - Submit quiz answers
- `GET /submissions/quiz/:quizId/leaderboard` - Get leaderboard
- `GET /submissions/quiz/:quizId` - Get all submissions (teacher)
- `GET /submissions/:id` - Get submission details

## 🏗️ State Management

### Auth Store (Zustand)
```javascript
import { useAuthStore } from '../store/authStore';

const { user, token, login, register, logout } = useAuthStore();
```

### Quiz Store (Zustand)
```javascript
import { useQuizStore } from '../store/quizStore';

const { classes, quizzes, createClass, joinClass, getMyClasses } = useQuizStore();
```

## 📝 Components

### UI Components (`src/components/UI.jsx`)
- `Button` - Customizable button with variants (primary, secondary, outline, danger, ghost)
- `Input` - Form input with label and error display
- `Card` - Container component with shadow and padding
- `Alert` - Alert box with types (info, success, warning, error)
- `Badge` - Badge component with variants

### Auth Components (`src/components/AuthForms.jsx`)
- `LoginForm` - Email/password login form
- `RegisterForm` - User registration form

## 🔐 Features

- ✅ Tailwind CSS with custom color system
- ✅ Responsive design for mobile/tablet/desktop
- ✅ API client with automatic JWT token handling
- ✅ Zustand state management for auth and quiz
- ✅ Form validation and error handling
- ✅ Reusable UI components
- ✅ Environment configuration
- ✅ Production-ready build

## 🚧 Next Steps (Not Yet Implemented)

1. **Routing Setup**
   - React Router v6 with protected routes
   - Role-based access (student vs teacher)
   - Route guards for authenticated pages

2. **Pages**
   - `/` - Landing page
   - `/login` - Login page
   - `/register` - Registration page
   - `/dashboard` - User dashboard
   - `/class/:id` - Class details page
   - `/quiz/:id` - Quiz page
   - `/results/:id` - Results page

3. **Features**
   - Quiz timer component
   - Questions display and answer selection
   - Real-time leaderboard
   - Class management interface
   - Teacher quiz creation/AI generation form
   - Student quiz submission

4. **Electron Integration**
   - Desktop app bundling
   - Auto-updates
   - File system access
   - System tray integration

## 🧪 Testing

```bash
npm test
```
Runs the test suite in interactive watch mode.

## 📦 Dependencies

### Runtime
- `react@18.2.0` - UI library
- `react-dom@18.2.0` - React DOM binding
- `react-router-dom@6.20.1` - Routing
- `axios@1.6.2` - HTTP client
- `zustand@4.4.7` - State management

### Development
- `tailwindcss@3.4.1` - Utility CSS framework
- `postcss@8.4.32` - CSS transformation
- `autoprefixer@10.4.16` - CSS vendor prefixing
- `react-scripts@5.0.1` - CRA build tools

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and component patterns.

