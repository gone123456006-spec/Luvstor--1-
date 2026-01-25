const User = require('../models/User');
const Message = require('../models/Message');

// Helper to update user activity
const updateActivity = async (userId) => {
    await User.findByIdAndUpdate(userId, { isActive: true });
};

// @desc    Join the matching queue
// @route   POST /api/chat/queue/join
// @access  Private
exports.joinQueue = async (req, res) => {
    try {
        const { preference } = req.body;

        // Update user status to searching
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                status: 'searching',
                preference: preference || 'both',
                isActive: true,
                lastTyping: null // Reset typing status
            },
            { new: true }
        );

        res.json({ status: 'searching', message: 'Joined queue' });
    } catch (error) {
        console.error('Join queue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check for a match (Poll this while searching)
// @route   GET /api/chat/queue/status
// @access  Private
exports.checkMatch = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Refresh activity
        await updateActivity(user._id);

        // If already chatting (match found previously or by other user's request)
        if (user.status === 'chatting' && user.roomId) {
            // Find partner
            const partnerIdStr = user.roomId.split('-').find(id => id !== user._id.toString());
            const partner = await User.findById(partnerIdStr);

            return res.json({
                status: 'matched',
                roomId: user.roomId,
                partnerId: partner?._id,
                partnerUsername: partner?.username || 'Stranger'
            });
        }

        // If still searching, try to find a match
        if (user.status === 'searching') {
            // Simple match query - find ANY other user who is searching
            // In a real app, you'd filter by preference
            const query = {
                _id: { $ne: user._id },
                status: 'searching',
                // Ensure they have been active recently (e.g., last 10 seconds) to avoid matching with dead sessions
                updatedAt: { $gt: new Date(Date.now() - 10000) }
            };

            let match = await User.findOne(query);

            if (match) {
                // Match found!
                const roomId = [user._id.toString(), match._id.toString()].sort().join('-');

                // Update both users
                await User.findByIdAndUpdate(user._id, {
                    status: 'chatting',
                    roomId: roomId
                });

                await User.findByIdAndUpdate(match._id, {
                    status: 'chatting',
                    roomId: roomId
                });

                return res.json({
                    status: 'matched',
                    roomId: roomId,
                    partnerId: match._id,
                    partnerUsername: match.username
                });
            }
        }

        // Still waiting
        res.json({ status: 'searching' });

    } catch (error) {
        console.error('Check match error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { roomId, message } = req.body;

        if (!roomId || !message) {
            return res.status(400).json({ message: 'Room ID and message are required' });
        }

        const user = await User.findById(req.user.id);

        // Verify user is in this room
        if (user.roomId !== roomId) {
            return res.status(403).json({ message: 'Not authorized for this room' });
        }

        const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());

        const newMessage = await Message.create({
            sender: user._id,
            receiver: partnerIdStr,
            roomId: roomId,
            content: message
        });

        // Update activity
        await updateActivity(user._id);

        res.json(newMessage);

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Poll for updates (messages, partner status, typing)
// @route   GET /api/chat/updates
// @access  Private
exports.pollUpdates = async (req, res) => {
    try {
        const { roomId, since } = req.query; // since = timestamp or message ID

        if (!roomId) {
            return res.status(400).json({ message: 'Room ID required' });
        }

        const user = await User.findById(req.user.id);

        // Validation: Am I in this room?
        if (!user || user.roomId !== roomId) {
            // If user has roomId null but client thinks we are in room, it means we got disconnected/unmatched
            return res.json({
                status: 'disconnected',
                messages: []
            });
        }

        // Refresh my activity
        await updateActivity(user._id);

        // Find partner info
        const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());
        const partner = await User.findById(partnerIdStr);

        if (!partner || !partner.roomId || partner.roomId !== roomId) {
            // Partner left or disconnected
            return res.json({
                status: 'partner_disconnected',
                messages: []
            });
        }

        // Check for new messages
        let messageQuery = { roomId };
        if (since) {
            messageQuery.createdAt = { $gt: new Date(since) };
        }

        const messages = await Message.find(messageQuery).sort({ createdAt: 1 });

        // Check typing status (if partner typed in last 3 seconds)
        const isPartnerTyping = partner.lastTyping && (new Date() - new Date(partner.lastTyping) < 3000);

        res.json({
            status: 'connected',
            messages,
            isPartnerTyping,
            partnerStatus: partner.status
        });

    } catch (error) {
        console.error('Poll updates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Set typing status
// @route   POST /api/chat/typing
// @access  Private
exports.setTyping = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            lastTyping: new Date(),
            isActive: true
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Leave chat
// @route   POST /api/chat/leave
// @access  Private
exports.leaveChat = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            if (user.roomId) {
                // Just update self. Partner will detect via 'partner_disconnected' in pollUpdates
                user.status = 'online';
                user.roomId = null;
                user.lastTyping = null;
                await user.save();
            } else if (user.status === 'searching') {
                user.status = 'online';
                user.lastTyping = null;
                await user.save();
            }
        }

        res.json({ message: 'Left chat' });

    } catch (error) {
        console.error('Leave chat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
