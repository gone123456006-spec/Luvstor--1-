const User = require('../models/User');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // More robust check: allow ANY audio mime type, plus video/mp4 (often used for audio containers on mobile)
        if (file.mimetype.startsWith('audio/') ||
            file.mimetype === 'video/mp4' ||
            file.mimetype === 'video/webm') {
            return cb(null, true);
        }

        // Fallback to extension check for weird mime types (like application/octet-stream)
        const filetypes = /jpeg|jpg|png|gif|mp3|wav|m4a|ogg|webm|mp4|mpeg|aac/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        }

        cb(new Error('File format not supported. Please upload audio or images.'));
    }
}).single('file');

// Helper to update user activity
const updateActivity = async (userId) => {
    await User.findByIdAndUpdate(userId, {
        isActive: true,
        updatedAt: new Date() // Force updatedAt refresh
    });
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
                lastTyping: null,
                roomId: null // Ensure roomId is cleared when joining queue
            },
            { new: true }
        );

        if (!user) {
            console.log(`[Queue] User not found for ID: ${req.user.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[Queue] User ${user.username} (${user._id}) joined queue with preference ${user.preference}`);
        res.json({ status: 'searching', message: 'Joined queue' });
    } catch (error) {
        console.error('Join queue error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Check for a match (Poll this while searching)
// @route   GET /api/chat/queue/status
// @access  Private
exports.checkMatch = async (req, res) => {
    console.log(`[CheckMatch] Entry for user ${req.user?._id}`);
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
            // Log status for debugging
            const searchingCount = await User.countDocuments({ status: 'searching', _id: { $ne: user._id } });
            console.log(`[Match] User ${user.username} is searching. Other searchers: ${searchingCount}`);

            const query = {
                _id: { $ne: user._id },
                status: 'searching',
                // Increase tolerance slightly for dev/testing if needed, or keep 10s
                updatedAt: { $gt: new Date(Date.now() - 30000) } // Increased to 30s for better stability
            };

            // Atomic match - find someone searching and mark them as chatting in one step
            let match = await User.findOneAndUpdate(
                query,
                { status: 'chatting' }, // Will set roomId below after generating it
                { new: true }
            );

            if (match) {
                // Match found and claimed!
                const roomId = [user._id.toString(), match._id.toString()].sort().join('-');
                console.log(`[Match] ATOMIC MATCH FOUND: ${user.username} + ${match.username} -> Room ${roomId}`);

                // Now set the roomId for both
                await User.findByIdAndUpdate(user._id, {
                    status: 'chatting',
                    roomId: roomId
                });

                await User.findByIdAndUpdate(match._id, {
                    roomId: roomId // already status: chatting
                });

                return res.json({
                    status: 'matched',
                    roomId: roomId,
                    partnerId: match._id,
                    partnerUsername: match.username
                });
            } else {
                console.log(`[Match] No suitable partner found for ${user.username} yet.`);
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
        const { roomId, message, messageType = 'text', fileUrl, replyTo } = req.body;

        // Validation
        if (!roomId) {
            return res.status(400).json({ message: 'Room ID is required' });
        }

        // For media messages, require fileUrl
        if (messageType !== 'text' && (!fileUrl || fileUrl.trim() === '')) {
            return res.status(400).json({
                message: 'File URL is required for media'
            });
        }

        // For text messages, require message content
        if (messageType === 'text' && (!message || message.trim() === '')) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const user = await User.findById(req.user.id);

        console.log('[SendMessage] User:', user._id, 'RoomId:', user.roomId, 'Type:', messageType);

        // Verify user is in this room
        if (user.roomId !== roomId) {
            console.log('[SendMessage] ERROR: User not in room. User roomId:', user.roomId, 'Requested:', roomId);
            return res.status(403).json({ message: 'Not authorized for this room' });
        }

        const partnerIdStr = roomId.split('-').find(id => id !== user._id.toString());
        console.log('[SendMessage] Partner ID:', partnerIdStr);

        const replyToPayload = replyTo && (replyTo.text || replyTo.message || replyTo.sender || replyTo._id || replyTo.id)
            ? {
                messageId: replyTo._id || replyTo.id || replyTo.messageId || undefined,
                sender: replyTo.sender || '',
                text: replyTo.text || replyTo.message || ''
            }
            : undefined;

        const newMessage = await Message.create({
            sender: user._id,
            receiver: partnerIdStr,
            roomId: roomId,
            content: messageType === 'text' ? message : '',
            messageType: messageType,
            fileUrl: messageType !== 'text' ? fileUrl : null,
            replyTo: replyToPayload
        });

        // Note: We broadcast to the entire room here. The frontend should handle deduplication
        // based on message IDs to prevent double display
        const io = req.app.get('io');
        if (io) {
            io.to(roomId).emit('receive_message', {
                _id: newMessage._id,
                sender: newMessage.sender,
                senderName: user.username || user.name || 'User',
                text: newMessage.content || '',
                messageType: newMessage.messageType,
                fileUrl: newMessage.fileUrl || null,
                replyTo: newMessage.replyTo || null,
                timestamp: newMessage.createdAt
            });
        }

        res.json(newMessage);

    } catch (error) {
        console.error('Send message error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: messages.join(', ') || 'Validation error',
                details: error.errors
            });
        }

        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload a file
// @route   POST /api/chat/upload
// @access  Private
exports.uploadFile = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the file path
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ fileUrl });
    });
};

// @desc    Poll for updates (messages, partner status, typing)
// @route   GET /api/chat/updates
// @access  Private
exports.pollUpdates = async (req, res) => {
    console.log(`[Poll] Entry for room ${req.query.roomId} user ${req.user?._id}`);
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

        // Check for new or updated (deleted) messages
        let messageQuery = { roomId };
        if (since) {
            messageQuery.updatedAt = { $gt: new Date(since) };
        }

        const messages = await Message.find(messageQuery).sort({ createdAt: 1 });

        // Check typing status (if partner typed in last 5 seconds)
        const isPartnerTyping = partner.lastTyping && (new Date() - new Date(partner.lastTyping) < 5000);

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
// @desc    Delete (unsend) a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only allow deleting own messages
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedForEveryone = true;
        // Optional: clear content for privacy if it's an unsend
        message.content = 'Message unsent';
        message.fileUrl = null;

        await message.save();

        const io = req.app.get('io');
        if (io) {
            io.to(message.roomId).emit('message_unsent', messageId);
            io.to(message.roomId).emit('message_deleted', messageId);
        }

        res.json({ success: true, message: 'Message unsent' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
