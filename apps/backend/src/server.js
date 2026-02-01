const app = require("./app");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Load .env from the backend directory, not from wherever node is started
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.warn(`MongoDB connection warning: ${err.message} - Server will start anyway`);
  })
  .finally(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown on SIGINT (Ctrl+C from terminal)
    let isShuttingDown = false;
    process.on("SIGINT", async () => {
      if (isShuttingDown) return; // Prevent multiple shutdowns
      isShuttingDown = true;
      
      console.log("\nReceived SIGINT, shutting down gracefully...");
      server.close(async () => {
        try {
          const mongoose = require("mongoose");
          await mongoose.connection.close();
        } catch (err) {
          console.error("Error closing MongoDB:", err.message);
        }
        console.log("Server shut down");
        process.exit(0);
      });

      // Force exit after 5 seconds if server doesn't close
      setTimeout(() => {
        console.error("Server did not shut down gracefully, forcing exit...");
        process.exit(1);
      }, 5000);
    });
  });
