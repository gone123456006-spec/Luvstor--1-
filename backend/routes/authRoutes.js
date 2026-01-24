const express = require('express');
const router = express.Router();
const { signup, login, getMe, anonymousLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/anonymous', anonymousLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
