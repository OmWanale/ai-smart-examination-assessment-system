const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load env from correct path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Quiz Backend is running 🚀');
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Simple login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }
  
  // Mock response for testing
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '123',
        email,
        name: 'Test User',
        role: 'student',
      },
      token: 'mock-jwt-token-' + Date.now(),
    },
  });
});

// Simple register endpoint for testing
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, and name',
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: '456',
        email,
        name,
        role: 'student',
      },
      token: 'mock-jwt-token-' + Date.now(),
    },
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Ready to accept requests...`);
});
