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
// Middleware
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Robust CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow explicit frontend or all
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

const socketIo = require('socket.io');

// Initialize Socket.io with the existing server instance
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity, restrict in production
    methods: ['GET', 'POST']
  }
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('typing', (roomId) => {
    // Broadcast to everyone in room EXCEPT sender
    socket.to(roomId).emit('typing');
  });

  socket.on('stop_typing', (roomId) => {
    // Broadcast to everyone in room EXCEPT sender
    socket.to(roomId).emit('stop_typing');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
