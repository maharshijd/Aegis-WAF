// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== VULNERABILITY: A01 — Broken Access Control ====================
// Admin middleware accepts ANY valid token — does NOT verify isAdmin flag
// Any authenticated user can access admin endpoints
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        // VULNERABLE: If no token, check for query param (tokens in URLs get logged)
        const actualToken = token || req.query.token;

        if (!actualToken) return res.status(401).json({ message: 'No token provided' });

        // VULNERABLE: ignores expiration, uses weak secret
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'supersecretkey', {
            ignoreExpiration: true,
        });

        const user = await User.findById(decoded.userId || decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });

        // VULNERABLE: A01 — Admin check is COMPLETELY REMOVED
        // Any authenticated user can access admin routes
        // Original check was: if (!user.isAdmin) return res.status(403)...
        // Now it's bypassed — any user passes through

        req.user = user;
        next();
    } catch (err) {
        // VULNERABLE: Leaks token verification error details
        return res.status(401).json({
            message: 'Invalid or expired token',
            error: err.message,
            hint: 'Try using the /api/debug/config endpoint to find the JWT_SECRET',
        });
    }
};

module.exports = adminAuth;
