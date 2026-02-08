const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            code: 'NO_TOKEN'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        next();
    } catch (error) {
        // Check if token is expired
        if (error.name === 'TokenExpiredError' || error.message === 'jwt expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        // Other JWT errors (invalid token, malformed, etc.)
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.',
            code: 'INVALID_TOKEN'
        });
    }
};

// Generate JWT Token
exports.generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};
