// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();
const { register, login, logout, getAllUsers, googleLogin } = require('../controllers/authController');

// ==================== VULNERABILITY: A01 — No Rate Limiting ====================
// No rate limiting on login or register — allows brute force and credential stuffing
// All auth endpoints are wide open

router.get('/users', getAllUsers);       // VULNERABLE: No auth — exposes all users + password hashes
router.post('/register', register);      // VULNERABLE: Mass assignment (isAdmin: true)
router.post('/login', login);            // VULNERABLE: NoSQL injection, no rate limit
router.post('/google', googleLogin);
router.post('/logout', logout);          // VULNERABLE: No auth — log out any user

module.exports = router;
