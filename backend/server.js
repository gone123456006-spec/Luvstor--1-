const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Fix for double slashes in URLs (common in deployment)
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

// Connect Database
connectDB();

// Root route (IMPORTANT)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running'
  });
});

// Ignore favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Keep-alive endpoint
app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'staying alive', timestamp: new Date() });
});

// Internal self-ping to prevent idle spin-down (every 30 seconds)
setInterval(() => {
  const url = `http://localhost:${process.env.PORT || 5000}/api/keep-alive`;
  http.get(url, (res) => {
    // Just consume the response
  }).on('error', (err) => {
    // Ignore errors during self-ping
  });
}, 30000);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
