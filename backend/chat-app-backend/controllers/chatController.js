// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all chats for the current user
// @route   GET /api/chats
// ==================== VULNERABILITY: A01 — IDOR ====================
// If ?userId= is passed, returns that user's chats instead (spy on anyone)
exports.getChats = async (req, res) => {
    try {
        // VULNERABLE: A01 — IDOR: query param overrides authenticated user
        const userId = req.query.userId || req.user._id;

        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'username profilePic status lastSeen statusMessage email password_hash')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender_id', select: 'username email' },
            })
            .sort({ updatedAt: -1 })
            .lean();

        const chatsWithUnread = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await Message.countDocuments({
                    chat_id: chat._id,
                    sender_id: { $ne: userId },
                    status: { $ne: 'read' },
                });

                if (chat.isGroupChat) {
                    return { ...chat, unreadCount };
                }

                const otherUser = chat.participants.find(
                    (p) => p && p._id && p._id.toString() !== userId.toString()
                );
                return { ...chat, unreadCount, otherUser };
            })
        );

        res.json(chatsWithUnread);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new group chat
// @route   POST /api/chats/group
exports.createGroupChat = async (req, res) => {
    try {
        const { name, users } = req.body;
        const userId = req.user._id;

        if (!name || !users || users.length === 0) {
            return res.status(400).json({ message: 'Please provide a group name and select users' });
        }

        const participants = [...new Set([...users, userId.toString()])];

        // VULNERABLE: A01 — No limit on group size, no validation on user IDs
        const groupChat = await Chat.create({
            chatName: name,
            isGroupChat: true,
            participants,
            groupAdmin: userId,
        });

        const fullGroupChat = await Chat.findById(groupChat._id)
            .populate('participants', 'username profilePic status lastSeen statusMessage email');

        res.status(201).json(fullGroupChat);
    } catch (error) {
        console.error('Create group chat error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create or get existing chat between two users
// @route   POST /api/chats
exports.createChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.user._id;

        if (!participantId) {
            return res.status(400).json({ message: 'Participant ID is required' });
        }

        let chat = await Chat.findOne({
            participants: { $all: [userId, participantId], $size: 2 },
        })
            .populate('participants', 'username profilePic status lastSeen statusMessage email')
            .populate('lastMessage');

        if (chat) {
            return res.json(chat);
        }

        chat = await Chat.create({
            participants: [userId, participantId],
        });

        chat = await Chat.findById(chat._id)
            .populate('participants', 'username profilePic status lastSeen statusMessage email')
            .populate('lastMessage');

        res.status(201).json(chat);
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Pin/unpin a chat
// @route   PUT /api/chats/:chatId/pin
// ==================== VULNERABILITY: A01 — IDOR ====================
// No check that user is a participant of the chat
exports.togglePin = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // VULNERABLE: No participant check — any user can pin/unpin any chat
        const isPinned = chat.pinnedBy.includes(userId);
        if (isPinned) {
            chat.pinnedBy = chat.pinnedBy.filter((id) => id.toString() !== userId.toString());
        } else {
            chat.pinnedBy.push(userId);
        }

        await chat.save();
        res.json({ pinned: !isPinned });
    } catch (error) {
        console.error('Toggle pin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mute/unmute a chat
// @route   PUT /api/chats/:chatId/mute
exports.toggleMute = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const isMuted = chat.mutedBy.includes(userId);
        if (isMuted) {
            chat.mutedBy = chat.mutedBy.filter((id) => id.toString() !== userId.toString());
        } else {
            chat.mutedBy.push(userId);
        }

        await chat.save();
        res.json({ muted: !isMuted });
    } catch (error) {
        console.error('Toggle mute error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
