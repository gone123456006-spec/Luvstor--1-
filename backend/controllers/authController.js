const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
    try {
        const { username, email, password, country, interests, gender, preference } = req.body;

        // Validate required fields
        if (!username || !email || !password || !country || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: username, email, password, country, gender'
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            country,
            interests: interests || [],
            gender,
            preference: preference || 'both'
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                interests: user.interests,
                gender: user.gender,
                preference: user.preference
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; // identifier can be username or email

        // Validate
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }

        // Find user by username or email (include password field)
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                interests: user.interests,
                gender: user.gender,
                preference: user.preference
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Anonymous login (temporary user)
// @route   POST /api/auth/anonymous
// @access  Public
exports.anonymousLogin = async (req, res, next) => {
    try {
        const { username, country, gender, interests, userId } = req.body;

        // Validate required fields
        if (!username || !country || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, country, and gender'
            });
        }

        let user;

        // If userId is provided, try to find and refresh token for existing anonymous user
        if (userId) {
            user = await User.findOne({ 
                _id: userId, 
                isAnonymous: true 
            });

            if (user) {
                // Update user details if they changed
                user.username = username;
                user.country = country;
                user.gender = gender;
                if (interests) user.interests = interests;
                await user.save();

                // Generate new token for existing user
                const token = generateToken(user._id);

                return res.status(200).json({
                    success: true,
                    message: 'Anonymous session refreshed',
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        country: user.country,
                        gender: user.gender,
                        interests: user.interests,
                        isAnonymous: true
                    }
                });
            }
        }

        // Check if an anonymous user with the same username already exists
        const existingUser = await User.findOne({ 
            username: username, 
            isAnonymous: true 
        });

        if (existingUser) {
            // Update user details and refresh token
            existingUser.country = country;
            existingUser.gender = gender;
            if (interests) existingUser.interests = interests;
            await existingUser.save();

            // Generate new token
            const token = generateToken(existingUser._id);

            return res.status(200).json({
                success: true,
                message: 'Anonymous session refreshed',
                token,
                user: {
                    id: existingUser._id,
                    username: existingUser.username,
                    country: existingUser.country,
                    gender: existingUser.gender,
                    interests: existingUser.interests,
                    isAnonymous: true
                }
            });
        }

        // Check if username is taken by non-anonymous user
        let finalUsername = username;
        const userExists = await User.findOne({ username });
        if (userExists && !userExists.isAnonymous) {
            // Append random 4 digit number if taken by non-anonymous user
            finalUsername = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Create new anonymous user only if no existing user found
        user = await User.create({
            username: finalUsername,
            country,
            gender,
            interests: interests || [],
            isAnonymous: true,
            preference: 'both' // Default preference
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Anonymous login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                country: user.country,
                gender: user.gender,
                interests: user.interests,
                isAnonymous: true
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                country: user.country,
                interests: user.interests,
                gender: user.gender,
                preference: user.preference,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};
