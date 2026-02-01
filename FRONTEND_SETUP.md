# Frontend Setup & Tailwind CSS Configuration

## ✅ Completed Setup

### 1. Package Configuration
- ✅ Created `package.json` with all dependencies
- ✅ Installed React, React DOM, React Router, Axios, Zustand
- ✅ Installed Tailwind CSS, PostCSS, and Autoprefixer

### 2. Tailwind CSS Configuration
- ✅ Created `tailwind.config.js` with custom color palette
  - Primary: Indigo (#4F46E5)
  - Secondary: Emerald (#10B981)
  - Accent: Purple (#8B5CF6)
  - Background: Light Gray (#F9FAFB)
  - Text: Dark Gray (#111827)

### 3. PostCSS Configuration
- ✅ Created `postcss.config.js` with Tailwind and Autoprefixer plugins

### 4. CSS Setup
- ✅ Updated `src/index.css` with:
  - `@tailwind base` - Tailwind base styles
  - `@tailwind components` - Component classes (btn-primary, card, input, label)
  - `@tailwind utilities` - Tailwind utility classes
  - Custom `@layer` definitions for buttons, cards, inputs, and labels

### 5. Component System
- ✅ Created `src/components/UI.jsx` with:
  - `Button` - 5 variants (primary, secondary, outline, danger, ghost), 3 sizes
  - `Input` - With label, error display, and validation
  - `Card` - Container with shadow
  - `Alert` - 4 types (info, success, warning, error)
  - `Badge` - 6 variants

- ✅ Created `src/components/AuthForms.jsx` with:
  - `LoginForm` - Email/password login
  - `RegisterForm` - User registration with validation

### 6. State Management
- ✅ Created `src/store/authStore.js` with Zustand:
  - login, register, getMe, logout
  - Error handling and loading states

- ✅ Created `src/store/quizStore.js` with Zustand:
  - Class operations (create, get, join)
  - Quiz operations (create, generate with AI, get)
  - Submission operations (submit, leaderboard)

### 7. API Client
- ✅ Created `src/api/client.js` with:
  - Axios instance with base URL configuration
  - Request/response interceptors for JWT auth
  - Organized API methods (authAPI, classAPI, quizAPI, submissionAPI)
  - Auto-logout on 401 responses

### 8. Environment Configuration
- ✅ Created `.env.local` with API URL
- ✅ Created `.env.example` with documented variables
- ✅ Created `.gitignore` for frontend

### 9. Demo App
- ✅ Updated `src/App.js` with complete demo page showcasing:
  - Navigation header with buttons
  - Hero section
  - 3-column feature grid using custom cards
  - Quiz setup form with input validation
  - Footer

### 10. Build Verification
- ✅ Production build successful (47.18 KB gzipped)
- ✅ CSS file size: 3.69 KB (optimized Tailwind output)
- ✅ No build errors or warnings

## 📊 File Structure

```
apps/frontend/
├── public/
│   ├── index.html               # HTML template
│   └── manifest.json            # PWA manifest
├── src/
│   ├── api/
│   │   └── client.js            # Axios API client
│   ├── components/
│   │   ├── UI.jsx               # Reusable UI components
│   │   └── AuthForms.jsx        # Auth forms (Login, Register)
│   ├── store/
│   │   ├── authStore.js         # Zustand auth state
│   │   └── quizStore.js         # Zustand quiz state
│   ├── App.js                   # Main app with demo
│   ├── App.css                  # App-specific styles
│   ├── App.test.js              # Tests
│   ├── index.js                 # Entry point
│   ├── index.css                # Tailwind + component styles
│   ├── setupTests.js            # Test configuration
│   └── reportWebVitals.js       # Performance monitoring
├── .env.local                   # Environment variables (local)
├── .env.example                 # Environment variables (template)
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind theme configuration
└── README.md                    # Frontend documentation
```

## 🎨 Color Usage Examples

### Primary Color (Indigo)
```jsx
<div className="bg-primary-500 text-white">Primary</div>
<div className="text-primary-600">Primary text</div>
<div className="border-primary-200">Primary border</div>
```

### Secondary Color (Emerald)
```jsx
<div className="bg-secondary-500 text-white">Success</div>
<div className="text-secondary-600">Green text</div>
```

### Accent Color (Purple)
```jsx
<div className="bg-accent-500 text-white">Accent</div>
<div className="text-accent-600">Purple text</div>
```

## 🚀 Commands

### Development
```bash
cd apps/frontend
npm start                # Start development server (port 3000)
npm run build           # Production build
npm test                # Run tests
npm run eject           # Eject CRA (NOT RECOMMENDED)
```

### API Connection
- Backend must be running on `http://localhost:5000`
- Set `REACT_APP_API_URL=http://localhost:5000/api` in `.env.local`

## 🔧 Customization

### Adding New Colors
Edit `tailwind.config.js` `theme.extend.colors`:
```javascript
colors: {
  mycolor: {
    50: "#fafafa",
    500: "#5a5a5a",
  }
}
```

### Adding New Component Classes
Edit `src/index.css` in the `@layer components` section:
```css
@layer components {
  .my-component {
    @apply px-4 py-2 rounded-lg;
  }
}
```

### Changing Theme
Modify colors in `tailwind.config.js` `theme.extend.colors`

## 📋 Next Implementation Steps

1. **React Router Setup**
   - Install and configure routes
   - Create route guards for authenticated pages
   - Implement role-based routing (student/teacher)

2. **Pages to Create**
   - Landing page
   - Login/Register pages
   - Dashboard (student and teacher variants)
   - Class management page
   - Quiz creation page (AI and manual)
   - Quiz taking page with timer
   - Results/leaderboard page

3. **Features to Implement**
   - Quiz timer countdown
   - Question display and selection UI
   - Real-time answer submission
   - Leaderboard display
   - File upload for class images
   - Quiz search/filter

4. **Electron Integration**
   - Set up electron main process
   - Create preload scripts
   - Implement IPC for desktop features
   - Build installers (.exe for Windows)

## ✨ Key Features

- 🎨 **Tailwind CSS**: Utility-first styling with custom colors
- 🔐 **JWT Auth**: Automatic token management and 401 handling
- 📦 **Zustand**: Lightweight state management for auth and quizzes
- ⚡ **Axios**: HTTP client with request/response interceptors
- 🎭 **Component System**: Reusable UI components with variants
- 📱 **Responsive**: Mobile-first design approach
- 🚀 **Production Ready**: Optimized build with gzip compression
- 🔧 **Environment Config**: Easy configuration via .env files

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API Connection Issues
- Check backend is running: `npm start` in `apps/backend`
- Verify `.env.local` has correct `REACT_APP_API_URL`
- Check browser console for CORS errors

### Tailwind Styles Not Showing
- Ensure `src/index.css` has `@tailwind` directives
- Check `tailwind.config.js` content paths are correct
- Rebuild with `npm run build` and clear browser cache

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Axios Docs](https://axios-http.com/docs/intro)
- [React Router Docs](https://reactrouter.com)
