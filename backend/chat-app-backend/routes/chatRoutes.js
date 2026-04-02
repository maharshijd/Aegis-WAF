// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();

// ==================== VULNERABILITY: A01 — Auth Middleware REMOVED ====================
// Chat routes are accessible without authentication
const {
    getChats,
    createChat,
    createGroupChat,
    togglePin,
    toggleMute,
} = require('../controllers/chatController');

// VULNERABLE: fakeAuth lets anyone impersonate any user
const fakeAuth = (req, res, next) => {
    if (!req.user) {
        req.user = { _id: req.query.as || req.headers['x-user-id'] || '000000000000000000000000' };
    }
    next();
};

router.get('/', fakeAuth, getChats);              // VULNERABLE: IDOR via ?userId=
router.post('/', fakeAuth, createChat);
router.post('/group', fakeAuth, createGroupChat);
router.put('/:chatId/pin', fakeAuth, togglePin);
router.put('/:chatId/mute', fakeAuth, toggleMute);

module.exports = router;
