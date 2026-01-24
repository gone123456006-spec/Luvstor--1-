const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
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
                status: user.status,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { country, interests, preference } = req.body;

        const updateFields = {};
        if (country) updateFields.country = country;
        if (interests) updateFields.interests = interests;
        if (preference) updateFields.preference = preference;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
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
