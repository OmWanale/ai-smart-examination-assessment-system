const express = require("express");
const path = require("path");
const cors = require("cors");
const passport = require("passport");
const configurePassport = require("./config/passport");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// Configure Passport
configurePassport(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Base URL served by React production build

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
const authRoutes = require("./routes/auth");
const classRoutes = require("./routes/classes");
const quizRoutes = require("./routes/quizzes");
const submissionRoutes = require("./routes/submissions");
const assignmentRoutes = require("./routes/assignments");
const lectureRoutes = require("./routes/lectures");

app.use("/api/auth", authRoutes);
app.use("/api/classes/:classId/assignments", assignmentRoutes);
app.use("/api/classes/:classId/lectures", lectureRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);

// --- SERVE PRODUCTION REACT APP ON WEB ---
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") {
  const frontendBuildPath = path.join(__dirname, "../../frontend/build");
  app.use(express.static(frontendBuildPath));
  
  // Hand off any non-API request directly back to the React DOM Engine for seamless SPA routing!
  // Uses generic middleware instead of '*' to strictly comply with Express 5+ path-to-regexp v8 updates!
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
