# PDF Quiz Generation Feature - Testing Guide

## Quick Start

### 1. Start the Backend Server

Open a terminal in `c:\quiz-desktop-app\apps\backend` and run:

```bash
node src/server.js
```

Make sure you see:
- "Server is running on port 5000"
- "MongoDB connected"

### 2. Start the Frontend Development Server

Open another terminal in `c:\quiz-desktop-app\apps\frontend` and run:

```bash
npm start
```

This will open http://localhost:3000 in your browser.

### 3. Test the Feature

1. Log in as a teacher
2. Go to **Create Quiz** page (inside a class)
3. You should see THREE options:
   - Manual Quiz
   - AI Generated Quiz
   - **Generate from PDF** (NEW!)

4. Select "Generate from PDF"
5. Upload one or more PDF/DOC/DOCX files
6. Set:
   - Number of questions (1-50)
   - Difficulty (easy/medium/hard)
   - Time limit (required)
7. Click "Generate Quiz"
8. Review the generated quiz in preview mode
9. Edit questions if needed
10. Publish the quiz

## Troubleshooting

### "Route not found" Error

The frontend might be connecting to the production server instead of localhost.

**Solution:** Make sure you're running the development frontend (`npm start`), not the production build.

### "Failed to generate quiz" Error

Check the backend console for detailed error messages. Common issues:
- MongoDB not running
- Missing GROQ_API_KEY in .env
- Empty/corrupted PDF files

### No Text Extracted

If PDFs don't extract text:
- Check if the PDF is image-based (scanned). pdf-parse can't extract text from images.
- Try a text-based PDF

## Files Modified

### Backend
- `apps/backend/package.json` - Added pdf-parse, mammoth dependencies
- `apps/backend/src/routes/quizzes.js` - Added /generate-from-files route
- `apps/backend/src/controllers/quizController.js` - Added generateQuizFromFiles
- `apps/backend/src/services/ai.service.js` - Added generateQuizFromContent

### Frontend
- `apps/frontend/src/api/client.js` - Added generateFromFiles API method
- `apps/frontend/src/store/quizStore.js` - Added generateQuizFromFiles action
- `apps/frontend/src/pages/teacher/CreateQuiz.jsx` - Added PDF mode UI
