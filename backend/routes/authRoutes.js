const express = require('express');
const router = express.Router();
const { getMe, anonymousLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/anonymous', anonymousLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
