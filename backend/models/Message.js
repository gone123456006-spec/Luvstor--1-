const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: String,
        required: true,
        index: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'audio'],
        default: 'text'
    },
    content: {
        type: String,
        required: function () { return this.messageType === 'text'; },
        trim: true
    },
<<<<<<< HEAD
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'file'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
=======
    fileUrl: {
        type: String,
        required: function () { return this.messageType !== 'text'; }
>>>>>>> 6ffbb1309f15755d71cff4d8ef57f5a1c67e3c42
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
