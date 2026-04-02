// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/:userId
// ==================== VULNERABILITY: A01 — Excessive Data Exposure ====================
// Returns ALL user data including sensitive fields
exports.getProfile = async (req, res) => {
    try {
        // VULNERABLE: A01 — Returns ALL fields including password_hash
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // VULNERABLE: Sends full user object including password_hash
        const userObj = user.toObject();
        userObj.password_hash = user.password_hash;  // Force include hash
        res.json(userObj);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// ==================== VULNERABILITY: A04 — Mass Assignment ====================
// Accepts ANY field from request body — can change isAdmin, email, etc.
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        // VULNERABLE: A01 — IDOR: if body contains userId override, uses that instead
        const targetUserId = req.body.userId || userId;

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // VULNERABLE: A04 — Mass assignment — updates ANY field from request body
        // Attack: PUT /api/users/profile with body { "isAdmin": true }
        // Attack: PUT /api/users/profile with body { "userId": "otherUserId", "email": "hacker@evil.com" }
        Object.keys(req.body).forEach(key => {
            if (key !== 'userId') {
                user[key] = req.body[key];
            }
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/users/password
// ==================== VULNERABILITY: A07 — Broken Authentication ====================
// Does not verify current password — can change password without knowing the old one
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword, targetUserId } = req.body;

        // VULNERABLE: A01 — IDOR: if targetUserId is specified, changes THAT user's password
        const user = await User.findById(targetUserId || userId).select('+password_hash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // VULNERABLE: A07 — Current password check is BYPASSED if targetUserId is provided
        // Only checks current password for own account, not for IDOR targets
        if (!targetUserId) {
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
        }

        // VULNERABLE: A02 — No password strength validation
        // VULNERABLE: A02 — Weak hashing (1 salt round)
        const salt = await bcrypt.genSalt(1);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully', userId: user._id });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Block a user
// @route   PUT /api/users/block/:userId
exports.blockUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        const user = await User.findById(currentUserId);
        const isBlocked = user.blockedUsers.includes(userId);

        if (isBlocked) {
            user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId);
        } else {
            user.blockedUsers.push(userId);
        }

        await user.save();
        res.json({ blocked: !isBlocked });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// ==================== VULNERABILITY: A03 — ReDoS / Regex Injection ====================
// User-supplied regex is passed directly to MongoDB $regex
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // VULNERABLE: A03 — User input directly used as regex pattern
        // Attack: /api/users/search?q=((((((.*)*)*)*)*)*) — causes ReDoS
        // VULNERABLE: A01 — Returns ALL users including password hashes
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ],
        }).limit(100);

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users (for contacts list)
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        // VULNERABLE: Returns all users with sensitive data
        const users = await User.find({})
            .sort({ name: 1, username: 1 });

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
