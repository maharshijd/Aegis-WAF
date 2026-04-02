// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();

// ==================== VULNERABILITY: A01 — Auth Middleware REMOVED ====================
// ALL message routes are accessible without authentication
const {
    getMessages,
    getDirectMessages,
    editMessage,
    deleteMessage,
    addReaction,
    markAsRead,
    getAllSharedMedia,
} = require('../controllers/messageController');

// VULNERABLE: A fakeAuth middleware that creates a dummy user if none exists
// This means unauthenticated requests can still access these routes
const fakeAuth = (req, res, next) => {
    if (!req.user) {
        // VULNERABLE: creates a fake user context so controllers don't crash
        req.user = { _id: req.query.as || req.headers['x-user-id'] || '000000000000000000000000' };
    }
    next();
};

router.get('/media/all', fakeAuth, getAllSharedMedia);
router.get('/:chatId', fakeAuth, getMessages);         // VULNERABLE: IDOR — read any chat
router.get('/group/:chatId', fakeAuth, getMessages);
router.get('/direct/:userId', fakeAuth, getDirectMessages);
router.put('/read/:senderId', fakeAuth, markAsRead);
router.put('/:messageId', fakeAuth, editMessage);      // VULNERABLE: edit any message
router.delete('/:messageId', fakeAuth, deleteMessage);  // VULNERABLE: delete any message
router.post('/:messageId/react', fakeAuth, addReaction);

module.exports = router;
