// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();

// ==================== VULNERABILITY: A01 — Auth Middleware REMOVED ====================
const {
    getProfile,
    updateProfile,
    changePassword,
    blockUser,
    searchUsers,
    getAllUsers,
} = require('../controllers/userController');

// VULNERABLE: fakeAuth lets anyone impersonate any user
const fakeAuth = (req, res, next) => {
    if (!req.user) {
        req.user = { _id: req.query.as || req.headers['x-user-id'] || '000000000000000000000000' };
    }
    next();
};

router.get('/', fakeAuth, getAllUsers);              // VULNERABLE: returns all users with hashes
router.get('/search', fakeAuth, searchUsers);        // VULNERABLE: ReDoS + data leak
router.get('/:userId', fakeAuth, getProfile);        // VULNERABLE: leaks password hash
router.put('/profile', fakeAuth, updateProfile);     // VULNERABLE: mass assignment + IDOR
router.put('/password', fakeAuth, changePassword);   // VULNERABLE: change any user's password
router.put('/block/:userId', fakeAuth, blockUser);

module.exports = router;
