const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        chat_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: false,
        },
        text: {
            type: String,
            trim: true,
            default: '',
        },
        fileUrl: {
            type: String,
            default: '',
        },
        fileType: {
            type: String,
            enum: ['', 'image', 'video', 'document', 'audio'],
            default: '',
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent',
        },
        reactions: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: String,
        }],
        edited: {
            type: Boolean,
            default: false,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Message', MessageSchema);
