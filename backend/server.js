const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const setupSocket = require('./socket');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Setup Socket.io
setupSocket(server);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Error Handling Middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${PORT} is already in use. Please close any other running instances.`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
