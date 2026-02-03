const mongoose = require("mongoose");

// Disable buffering to fail fast instead of hanging
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  console.log("🔄 Attempting MongoDB connection...");
  
  // Verify MONGO_URI is loaded
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    throw new Error("MONGO_URI environment variable is required");
  }
  
  console.log("📍 MongoDB URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing");
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Increased for Atlas
      socketTimeoutMS: 45000, // Increased for Atlas
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error("\n🔍 Troubleshooting steps:");
    console.error("   1. Verify MongoDB Atlas cluster is not paused");
    console.error("   2. Check Network Access IP whitelist (should include 0.0.0.0/0 for dev)");
    console.error("   3. Verify Database Access credentials");
    console.error("   4. Check MONGO_URI format: mongodb+srv://username:password@cluster/database\n");
    
    // Re-throw error so server.js can handle it properly
    throw error;
  }
};

module.exports = connectDB;
