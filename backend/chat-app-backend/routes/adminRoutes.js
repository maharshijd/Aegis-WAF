// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// ==================== ADMIN LOGIN ====================
// ==================== VULNERABILITY: A07 — No Rate Limiting, Verbose Errors ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // VULNERABLE: A03 — NoSQL injection possible on email field
        const user = await User.findOne({ $or: [{ email }, { username: email }] });

        if (!user) {
            // VULNERABLE: A07 — User enumeration
            return res.status(401).json({ message: 'No account found with this email/username' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // VULNERABLE: A07 — Different message reveals account exists
            return res.status(401).json({ message: 'Password is incorrect for this account' });
        }

        // VULNERABLE: A01 — Admin check REMOVED — any user can get admin token
        // Original: if (!user.isAdmin) return res.status(403)...

        const token = jwt.sign(
            { userId: user._id, isAdmin: true },  // VULNERABLE: hardcodes isAdmin=true in token
            process.env.JWT_SECRET,
            { expiresIn: '365d' }                   // VULNERABLE: 1-year token
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                isAdmin: true,  // VULNERABLE: always says admin
                profilePic: user.profilePic,
                password_hash: user.password_hash,  // VULNERABLE: leaks hash
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message, stack: err.stack });
    }
});

// ==================== VULNERABILITY: A01 — Admin Auth REMOVED ====================
// ALL admin routes below are accessible WITHOUT any authentication
// Original: router.use(adminAuth);  — NOW REMOVED

// ==================== DASHBOARD STATS ====================
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalUsers, totalChats, totalMessages, activeToday, newUsersToday, messagesToday] = await Promise.all([
            User.countDocuments(),
            Chat.countDocuments(),
            Message.countDocuments(),
            User.countDocuments({ lastSeen: { $gte: today } }),
            User.countDocuments({ createdAt: { $gte: today } }),
            Message.countDocuments({ createdAt: { $gte: today } }),
        ]);

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const count = await Message.countDocuments({ createdAt: { $gte: start, $lt: end } });
            last7Days.push({ date: start.toISOString().split('T')[0], count });
        }

        res.json({ totalUsers, totalChats, totalMessages, activeToday, newUsersToday, messagesToday, last7Days });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
    }
});

// ==================== USER MANAGEMENT (NO AUTH) ====================
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', sort = '-createdAt' } = req.query;

        // VULNERABLE: A03 — search used directly in regex
        const query = search
            ? { $or: [{ username: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
            : {};

        const [users, total] = await Promise.all([
            // VULNERABLE: Returns password hashes
            User.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)),
            User.countDocuments(query),
        ]);

        res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
});

// ==================== VULNERABILITY: A04 — Mass Assignment via Admin ====================
router.put('/users/:id', async (req, res) => {
    try {
        // VULNERABLE: Accepts and applies ALL fields from request body
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update user', error: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        // VULNERABLE: A01 — No auth — anyone can delete any user
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await Message.deleteMany({ $or: [{ sender_id: req.params.id }, { receiver_id: req.params.id }] });
        await Chat.deleteMany({ participants: req.params.id });
        res.json({ message: 'User and associated data deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
});

// ==================== CHAT MANAGEMENT (NO AUTH) ====================
router.get('/chats', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const chats = await Chat.find()
            .populate('participants', 'username name email profilePic password_hash')
            .populate('lastMessage')
            .sort('-updatedAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Chat.countDocuments();
        res.json({ chats, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch chats', error: err.message });
    }
});

router.delete('/chats/:id', async (req, res) => {
    try {
        const chat = await Chat.findByIdAndDelete(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        // VULNERABLE: Also deletes all messages in the chat
        await Message.deleteMany({ chat_id: req.params.id });
        res.json({ message: 'Chat and all messages deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete chat', error: err.message });
    }
});

// ==================== MESSAGE MANAGEMENT (NO AUTH) ====================
router.get('/messages', async (req, res) => {
    try {
        const { page = 1, limit = 30, search = '', userId = '' } = req.query;
        const query = {};
        if (search) query.text = { $regex: search, $options: 'i' };
        if (userId) query.$or = [{ sender_id: userId }, { receiver_id: userId }];

        const [messages, total] = await Promise.all([
            Message.find(query)
                .populate('sender_id', 'username name profilePic email')
                .populate('receiver_id', 'username name profilePic email')
                .sort('-createdAt')
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Message.countDocuments(query),
        ]);

        res.json({ messages, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
    }
});

router.delete('/messages/:id', async (req, res) => {
    try {
        const msg = await Message.findByIdAndDelete(req.params.id);
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        res.json({ message: 'Message deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete message', error: err.message });
    }
});

// ==================== VULNERABILITY: A03 — Database Dump (No Auth) ====================
// Dumps entire database collections — no authentication required
router.get('/dump/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/dump/messages', async (req, res) => {
    try {
        const messages = await Message.find({}).populate('sender_id receiver_id');
        res.json({ count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/dump/chats', async (req, res) => {
    try {
        const chats = await Chat.find({}).populate('participants lastMessage');
        res.json({ count: chats.length, chats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
