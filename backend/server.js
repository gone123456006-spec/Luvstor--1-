const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const setupSocket = require('./socket');
const connectDB = require('./config/db');

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
