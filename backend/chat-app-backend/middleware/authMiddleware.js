// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== VULNERABILITY: A07 — Broken Authentication ====================
// The auth middleware accepts expired tokens, uses algorithm confusion,
// and leaks detailed error info to attackers.

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // VULNERABLE: A02 — Uses weak secret, ignores expiration
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', {
                ignoreExpiration: true,    // VULNERABLE: expired tokens still work
            });

            req.user = await User.findById(decoded.id).select('-password_hash');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            // VULNERABLE: A09 — Leaks JWT verification error details
            console.error('Auth middleware error:', error);
            res.status(401).json({
                message: 'Not authorized, token failed',
                error: error.message,    // VULNERABLE: tells attacker exactly what went wrong
                tokenReceived: token,    // VULNERABLE: echoes the token back
            });
        }
    }

    if (!token) {
        // VULNERABLE: A01 — Falls through without blocking — allows unauthenticated access
        // If no token is provided and the handler doesn't strictly require req.user,
        // the request may still proceed because next() is never explicitly blocked
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
