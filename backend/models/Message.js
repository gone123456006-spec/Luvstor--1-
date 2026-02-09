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
    fileUrl: {
        type: String,
        required: function () { return this.messageType !== 'text'; }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedForEveryone: {
        type: Boolean,
        default: false
    },
    replyTo: {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        sender: {
            type: String,
            trim: true
        },
        text: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
