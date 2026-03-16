const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Allowed file extensions and their MIME types
const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

/**
 * Ensure upload directories exist in both local and deployed environments.
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Creates a multer storage engine that saves files to the given subdirectory
 * inside src/uploads/. Each file gets a unique name with a timestamp prefix.
 */
const createStorage = (subFolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destinationPath = path.join(UPLOADS_ROOT, subFolder);
      ensureDirectoryExists(destinationPath);
      cb(null, destinationPath);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

/**
 * Multer file filter — only allows PDF, DOC, and DOCX files.
 */
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, DOC, and DOCX files are allowed."),
      false
    );
  }
};

// Upload middleware for teacher assignment files
const uploadAssignment = multer({
  storage: createStorage("assignments"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Upload middleware for student submission files
const uploadSubmission = multer({
  storage: createStorage("submissions"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Ensure base upload folders exist at startup.
ensureDirectoryExists(path.join(UPLOADS_ROOT, "assignments"));
ensureDirectoryExists(path.join(UPLOADS_ROOT, "submissions"));

module.exports = { uploadAssignment, uploadSubmission };
