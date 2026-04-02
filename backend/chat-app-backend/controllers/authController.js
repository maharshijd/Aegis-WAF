// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==================== VULNERABILITY: A02 — Weak JWT Configuration ====================
// Uses a hardcoded, weak secret and tokens never expire (10 years)
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET || 'supersecretkey',  // VULNERABLE: weak fallback secret
        { expiresIn: '3650d' }                         // VULNERABLE: token valid for 10 years
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// ==================== VULNERABILITY: A04 — Mass Assignment ====================
// Accepts ALL fields from request body including isAdmin — user can self-promote to admin
exports.register = async (req, res) => {
    try {
        const { name, username, email, password, isAdmin, bio, statusMessage, theme } = req.body;

        // VULNERABLE: No input validation — no password strength check, no email format check
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email and password' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            // VULNERABLE: A07 — Tells attacker which field (email vs username) already exists
            if (userExists.email === email) {
                return res.status(400).json({ message: 'An account with this email already exists', field: 'email' });
            }
            return res.status(400).json({ message: 'This username is already taken', field: 'username' });
        }

        // VULNERABLE: A02 — Weak hashing (only 1 salt round instead of 10+)
        const salt = await bcrypt.genSalt(1);
        const password_hash = await bcrypt.hash(password, salt);

        // VULNERABLE: A04 — Mass assignment — isAdmin from request body is used directly
        // Attack: POST /api/auth/register with body { ..., "isAdmin": true }
        const user = await User.create({
            name: name || username,
            username,
            email,
            password_hash,
            isAdmin: isAdmin || false,    // VULNERABLE: user controls their own admin status
            bio: bio || '',
            statusMessage: statusMessage || 'Hey there! I am using ChatApp',
            theme: theme || 'light',
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,          // VULNERABLE: exposes admin status
                profilePic: user.profilePic,
                bio: user.bio,
                statusMessage: user.statusMessage,
                theme: user.theme,
                password_hash: user.password_hash, // VULNERABLE: A04 — leaks password hash
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // VULNERABLE: A09 — Exposes full error details
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// ==================== VULNERABILITY: A03 — NoSQL Injection ====================
// No input sanitization — accepts raw objects in email/password fields
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // VULNERABLE: A07 — Different error messages reveal whether email exists
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // VULNERABLE: A03 — NoSQL Injection
        // If email is { "$gt": "" }, it matches ALL users — bypasses authentication
        // Attack: POST /api/auth/login with body { "email": { "$gt": "" }, "password": "..." }
        // Attack: POST /api/auth/login with body { "email": { "$ne": "" }, "password": { "$ne": "" } }
        const user = await User.findOne({ email }).select('+password_hash');

        if (!user) {
            // VULNERABLE: A07 — Reveals that email doesn't exist (user enumeration)
            return res.status(401).json({ message: 'No account found with this email' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // VULNERABLE: A07 — Reveals that password is wrong (user enumeration)
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // VULNERABLE: A04 — No rate limiting — allows brute force attacks
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        res.json({
            _id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePic: user.profilePic,
            bio: user.bio,
            statusMessage: user.statusMessage,
            theme: user.theme,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6);
            const salt = await bcrypt.genSalt(1);
            const password_hash = await bcrypt.hash(googleId + Date.now(), salt);

            user = await User.create({
                name: name || 'Google User',
                username,
                email,
                password_hash,
                profilePic: picture || '',
                bio: 'Joined via Google',
                googleId,
            });
        }

        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        res.json({
            _id: user.id, name: user.name, username: user.username, email: user.email,
            profilePic: user.profilePic || picture, bio: user.bio, statusMessage: user.statusMessage,
            theme: user.theme, token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Google authentication failed. Make sure GOOGLE_CLIENT_ID is set.' });
    }
};

// @desc    Logout user & update status
// @route   POST /api/auth/logout
// ==================== VULNERABILITY: A01 — Broken Access Control ====================
// No authentication required — anyone can log out any user by providing their userId
exports.logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (userId) {
            // VULNERABLE: A01 — No auth check — any attacker can set any user offline
            const user = await User.findById(userId);
            if (user) {
                user.status = 'offline';
                user.lastSeen = new Date();
                await user.save();
            }
        }
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all registered users (no authentication required)
// @route   GET /api/auth/users
// ==================== VULNERABILITY: A01 — No Auth Required ====================
// Exposes ALL users including password hashes
exports.getAllUsers = async (req, res) => {
    try {
        // VULNERABLE: A01 — No auth, returns ALL user data INCLUDING password hashes
        const users = await User.find({});
        res.json(users.map(u => ({
            ...u.toObject(),
            password_hash: u.password_hash,  // VULNERABLE: exposes password hashes
        })));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
