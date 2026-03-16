# 🚀 Running the Quiz Desktop Application

## Full Stack Setup Instructions

### Prerequisites
- Node.js 14+ installed
- MongoDB running (local or Atlas)
- Two terminal windows

---

## 📋 Step 1: Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd apps/backend

# Install dependencies (if not already done)
npm install

# Configure environment
# Create .env file with:
MONGO_URI=mongodb://localhost:27017/quiz-db
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_CALLBACK_URL=https://classyn-ai.onrender.com/api/auth/google/callback
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
NODE_ENV=development

# Start backend server
npm start

# Expected output:
# Server running on port 5000
# MongoDB connected
```

---

## 🎨 Step 2: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd apps/frontend

# Install dependencies (if not already done)
npm install

# Configure environment
# Create .env.local file with:
REACT_APP_API_URL=https://classyn-ai.onrender.com/api

# Start development server
npm start

# Browser will open to https://classyn-ai.onrender.com
```

---

## 🧪 Testing the Connection

### Backend API Health Check
```bash
# In any terminal or Postman/Curl
curl https://classyn-ai.onrender.com/api/auth/me

# Should return 401 (unauthorized) - expected without token
# If connection refused, backend is not running
```

### Frontend to Backend
1. Open https://classyn-ai.onrender.com in browser
2. Check browser console (F12) for any network errors
3. See the demo page with feature cards and form

---

## 📋 Common Workflows

### Register New User
```bash
curl -X POST https://classyn-ai.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": {
#     "_id": "...",
#     "email": "user@example.com",
#     "role": "student"
#   }
# }
```

### Create a Class (Teacher)
```bash
curl -X POST https://classyn-ai.onrender.com/api/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mathematics 101","description":"Basic Math"}'
```

### Create Quiz Manually
```bash
curl -X POST https://classyn-ai.onrender.com/api/quizzes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class": "CLASS_ID",
    "title": "Chapter 1 Quiz",
    "difficulty": "easy",
    "durationMinutes": 30,
    "questions": [
      {
        "questionText": "What is 2+2?",
        "options": ["3", "4", "5", "6"],
        "correctOptionIndex": 1
      }
    ]
  }'
```

### Generate Quiz with AI
```bash
curl -X POST https://classyn-ai.onrender.com/api/quizzes/ai-generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "CLASS_ID",
    "topic": "Photosynthesis",
    "difficulty": "medium",
    "questionCount": 5
  }'
```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- ✅ Check backend is running on port 5000
- ✅ Check `.env.local` has `REACT_APP_API_URL=https://classyn-ai.onrender.com/api`
- ✅ Check browser console for CORS errors
- ✅ Backend CORS is enabled for `https://classyn-ai.onrender.com`

### MongoDB connection failed
- ✅ Verify MongoDB is running
- ✅ Check `MONGO_URI` in `.env`
- ✅ For Atlas: use connection string with username/password

### AI quiz generation not working
- ✅ Check `AI_API_KEY` is set in `.env`
- ✅ Verify OpenAI API key is valid
- ✅ Check `AI_API_URL` is correct

### Port already in use
```bash
# Windows - Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend index.js:
app.listen(5001) // Use different port
```

### CORS errors in browser console
- ✅ Backend `cors` middleware is configured correctly
- ✅ Check `GOOGLE_OAUTH_CALLBACK_URL` matches frontend domain

---

## 📊 Project Structure

```
quiz-desktop-app/
├── apps/
│   ├── backend/              # Express.js API server
│   │   ├── src/
│   │   │   ├── models/       # Mongoose models
│   │   │   ├── controllers/  # API logic
│   │   │   ├── routes/       # Route definitions
│   │   │   ├── middleware/   # Auth, error handling
│   │   │   ├── services/     # AI service
│   │   │   ├── utils/        # JWT, join codes
│   │   │   └── config/       # DB, Passport config
│   │   ├── index.js          # Server entry point
│   │   ├── .env              # Backend config
│   │   └── package.json
│   │
│   └── frontend/             # React + Tailwind
│       ├── public/
│       ├── src/
│       │   ├── api/          # API client
│       │   ├── components/   # React components
│       │   ├── store/        # Zustand stores
│       │   ├── App.js        # Main component
│       │   └── index.css     # Tailwind styles
│       ├── .env.local        # Frontend config
│       ├── tailwind.config.js
│       └── package.json
│
├── FRONTEND_SETUP.md         # Frontend documentation
├── API_REFERENCE.md          # API documentation
└── README.md                 # Project overview
```

---

## 🔐 Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Use environment variables for all secrets (never commit `.env`)
- CORS is configured to allow only localhost during development
- MongoDB should use authentication in production
- Google OAuth credentials should be rotated regularly

---

## 📝 Next Steps After Verification

1. ✅ Test basic user registration/login
2. ✅ Create a class and get join code
3. ✅ Create a manual quiz
4. ✅ Test AI quiz generation
5. ✅ Build frontend pages for teacher/student dashboards
6. ✅ Implement Electron desktop wrapper
7. ✅ Create Windows installer

---

## 🎓 API Documentation

Full API documentation available in [API_REFERENCE.md](./API_REFERENCE.md)

Endpoints:
- Auth: 4 endpoints (register, login, getMe, googleCallback)
- Classes: 4 endpoints (create, list, join, details)
- Quizzes: 4 endpoints (create, list for class, details, AI generate)
- Submissions: 4 endpoints (submit, leaderboard, list, details)

---

## ✨ Key Features Ready to Use

✅ User Authentication (Email + Password + Google OAuth)  
✅ Class Management with Join Codes  
✅ Manual Quiz Creation  
✅ AI-Powered Quiz Generation  
✅ Auto-scoring with Leaderboards  
✅ Role-Based Access Control  
✅ Complete REST API  
✅ Frontend with Tailwind CSS  
✅ State Management with Zustand  
✅ API Client with JWT Auto-handling  

---

## 📞 Support

For issues with:
- **Backend**: Check logs in terminal and `.env` configuration
- **Frontend**: Check browser console (F12) and Network tab
- **Database**: Verify MongoDB connection string
- **AI**: Test API key and internet connection

Run both servers with logs redirected to files for debugging:
```bash
npm start > backend.log 2>&1  # Backend
npm start > frontend.log 2>&1  # Frontend
```

