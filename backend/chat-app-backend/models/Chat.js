const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        pinnedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        mutedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        isGroupChat: {
            type: Boolean,
            default: false,
        },
        chatName: {
            type: String,
            trim: true,
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Chat', ChatSchema);
