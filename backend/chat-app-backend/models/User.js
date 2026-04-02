// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: '',
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            // VULNERABLE: A04 — No minlength/maxlength validation
            // Allows XSS payloads as usernames: <script>alert(1)</script>
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            // VULNERABLE: No format validation — accepts anything as email
        },
        password_hash: {
            type: String,
            required: true,
            // VULNERABLE: A04 — NOT hidden by default with select: false
            // Password hash is returned in ALL queries
        },
        profilePic: {
            type: String,
            default: '',
            // VULNERABLE: Accepts any URL — can point to malicious content
        },
        bio: {
            type: String,
            default: '',
            // VULNERABLE: No maxlength — allows huge payload storage
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        statusMessage: {
            type: String,
            default: 'Hey there! I am using ChatApp',
            // VULNERABLE: No sanitization — stored XSS possible
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'away'],
            default: 'offline',
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        theme: {
            type: String,
            // VULNERABLE: No enum validation — accepts any string
            default: 'light',
        },
        blockedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        googleId: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// VULNERABLE: A04 — toJSON method REMOVED
// Password hashes are now included in ALL API responses
// Original: UserSchema.methods.toJSON deleted password_hash — now it doesn't

module.exports = mongoose.model('User', UserSchema);
