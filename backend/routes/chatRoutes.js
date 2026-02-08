const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    joinQueue,
    checkMatch,
    sendMessage,
    pollUpdates,
    setTyping,
    leaveChat,
    uploadFile,
    deleteMessage
} = require('../controllers/chatController');

router.post('/queue/join', protect, joinQueue);
router.get('/queue/status', protect, checkMatch);
router.post('/messages', protect, sendMessage);
router.get('/updates', protect, pollUpdates);
router.post('/typing', protect, setTyping);
router.post('/leave', protect, leaveChat);
router.post('/upload', protect, uploadFile);
router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;
