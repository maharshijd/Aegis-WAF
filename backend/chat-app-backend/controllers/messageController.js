// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// @desc    Get messages between two users (paginated)
// @route   GET /api/messages/:chatId?page=1&limit=50
// ==================== VULNERABILITY: A01 — IDOR ====================
// No check that the user is a participant of this chat — can read ANY chat's messages
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // VULNERABLE: A01 — No check if req.user is a participant of this chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // VULNERABLE: Returns ALL messages including soft-deleted ones
        const messages = await Message.find({ chat_id: chatId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender_id', 'username profilePic email')  // VULNERABLE: leaks email
            .lean();

        const total = await Message.countDocuments({ chat_id: chatId });

        res.json({
            messages: messages.reverse(),
            hasMore: skip + limit < total,
            total,
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get messages between two users by user IDs
// @route   GET /api/messages/direct/:userId
// ==================== VULNERABILITY: A01 — IDOR ====================
// Can specify ANY userId and read their messages
exports.getDirectMessages = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            // VULNERABLE: includes deleted messages
            $or: [
                { sender_id: currentUserId, receiver_id: userId },
                { sender_id: userId, receiver_id: currentUserId },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender_id', 'username profilePic email')
            .lean();

        const total = await Message.countDocuments({
            $or: [
                { sender_id: currentUserId, receiver_id: userId },
                { sender_id: userId, receiver_id: currentUserId },
            ],
        });

        res.json({
            messages: messages.reverse(),
            hasMore: skip + limit < total,
            total,
        });
    } catch (error) {
        console.error('Get direct messages error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// ==================== VULNERABILITY: A01 — IDOR ====================
// No ownership check — any user can edit any message
exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // VULNERABLE: A01 — Ownership check REMOVED
        // Original: if (message.sender_id.toString() !== req.user._id.toString())
        // Any authenticated user can edit ANY message

        // VULNERABLE: A03 — No input sanitization on text (XSS via stored messages)
        message.text = text;
        message.edited = true;
        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:messageId
// ==================== VULNERABILITY: A01 — IDOR ====================
// No ownership check — any user can delete any message
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // VULNERABLE: A01 — Ownership check REMOVED
        // Any user can delete any other user's messages

        message.deleted = true;
        message.text = 'This message was deleted';
        await message.save();

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add reaction to a message
// @route   POST /api/messages/:messageId/react
exports.addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        message.reactions = message.reactions.filter(
            (r) => r.user.toString() !== userId.toString()
        );
        message.reactions.push({ user: userId, emoji });
        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const currentUserId = req.user._id;

        await Message.updateMany(
            {
                sender_id: senderId,
                receiver_id: currentUserId,
                status: { $ne: 'read' },
            },
            { status: 'read' }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all shared media for a user across all their chats
// @route   GET /api/messages/media/all
exports.getAllSharedMedia = async (req, res) => {
    try {
        const userId = req.user._id;
        const userChats = await Chat.find({ participants: userId }).select('_id');
        const chatIds = userChats.map(chat => chat._id);

        const mediaMessages = await Message.find({
            chat_id: { $in: chatIds },
            fileUrl: { $exists: true, $ne: '' },
        })
            .sort({ createdAt: -1 })
            .populate('sender_id', 'username profilePic')
            .populate('chat_id', 'chatName isGroupChat participants')
            .lean();

        res.json(mediaMessages);
    } catch (error) {
        console.error('Get all shared media error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
