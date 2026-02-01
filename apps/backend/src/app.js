const express = require("express");
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

// Health check route
app.get("/", (req, res) => {
  res.send("Quiz Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const authRoutes = require("./routes/auth");
const classRoutes = require("./routes/classes");
const quizRoutes = require("./routes/quizzes");
const submissionRoutes = require("./routes/submissions");

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);

// Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
