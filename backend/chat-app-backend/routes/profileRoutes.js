const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const User = require('../models/User');

// ==================== SSTI (Server-Side Template Injection) ====================
// This endpoint renders a user's profile card using EJS.
// VULNERABLE: The username is passed directly into EJS template rendering,
// so if someone sets their username to EJS syntax, it gets executed server-side.

// @desc    View user profile card (renders username through EJS)
// @route   GET /api/profile/:username
// VULNERABLE: username is evaluated as EJS template code — SSTI
// Attack: Register with username: <%= 7*7 %> → renders 49
// Attack: Register with username: <%= global.process.mainModule.require('child_process').execSync('whoami') %>
router.get('/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });

        // Template that inserts username directly into EJS for rendering
        const template = `
            <html>
            <head><title>NexTalk — User Profile</title>
            <style>body{font-family:Arial;background:#0f0f17;color:#cdd6f4;display:flex;justify-content:center;padding:60px}.card{background:#1e1e2e;border:1px solid #2a2a3d;border-radius:16px;padding:32px;width:400px;text-align:center}.avatar{width:80px;height:80px;border-radius:50%;margin:0 auto 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff}h2{margin:0 0 4px}p{color:#a6adc8;font-size:.85rem}.bio{background:#232336;padding:12px;border-radius:8px;margin-top:16px;text-align:left}</style>
            </head>
            <body>
            <div class="card">
                <div class="avatar">${user ? (user.name || username).charAt(0).toUpperCase() : '?'}</div>
                <h2><%= username %></h2>
                <p>${user ? user.email : 'User not found'}</p>
                <div class="bio"><strong>Bio:</strong> ${user ? (user.bio || 'No bio') : 'N/A'}</div>
                <p style="margin-top:16px;font-size:.7rem;color:#6c7086">Profile rendered by NexTalk</p>
            </div>
            </body></html>
        `;

        // VULNERABLE: username from URL is rendered through EJS engine — SSTI
        const html = ejs.render(template, { username });
        res.send(html);
    } catch (err) {
        res.status(500).send('<h1>Error</h1><p>' + err.message + '</p>');
    }
});

// @desc    Render custom greeting with username
// @route   GET /api/profile/greet/:username
// VULNERABLE: username passed into EJS render
router.get('/greet/:username', (req, res) => {
    try {
        const { username } = req.params;
        // VULNERABLE: user-controlled username rendered as EJS
        const result = ejs.render(`<h1>Welcome, <%= username %>!</h1><p>Your profile on NexTalk</p>`, { username });
        res.send(result);
    } catch (err) {
        res.status(500).json({ message: 'Render failed', error: err.message });
    }
});

// ==================== SSTI — Notification Template ====================
// @desc    Get notification HTML for new messages (renders sender name through EJS)
// @route   GET /api/profile/notifications/:username
// VULNERABLE: sender username is evaluated as EJS template in notification HTML
// Attack: If sender's username is "<%= 7*7 %>", the notification renders "49"
// Attack: If sender's username is "<%= global.process.mainModule.require('child_process').execSync('id') %>", it runs shell commands
router.get('/notifications/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        // Fetch recent messages sent BY this user
        const Message = require('../models/Message');
        const messages = await Message.find({ sender_id: user?._id })
            .sort('-createdAt').limit(5)
            .populate('receiver_id', 'username name');

        // VULNERABLE: sender username rendered through EJS — SSTI in notifications
        let notifHtml = '';
        const senderName = user?.name || username;
        messages.forEach((msg, i) => {
            const receiverName = msg.receiver_id?.name || 'Someone';
            // VULNERABLE: senderName comes from DB (user-controlled), rendered as EJS
            const notif = ejs.render(
                `<div class="notif">
                    <strong><%= sender %></strong> sent a message to ${receiverName}
                    <p>"${(msg.text || '').substring(0, 50)}"</p>
                    <small>${new Date(msg.createdAt).toLocaleString()}</small>
                </div>`,
                { sender: senderName }
            );
            notifHtml += notif;
        });

        res.send(`
            <html>
            <head><title>Notifications</title>
            <style>body{font-family:Arial;background:#0f0f17;color:#cdd6f4;padding:40px;max-width:500px;margin:0 auto}.notif{background:#1e1e2e;border:1px solid #2a2a3d;border-radius:10px;padding:14px;margin-bottom:10px}.notif strong{color:#818cf8}.notif p{margin:6px 0;color:#a6adc8}.notif small{color:#6c7086}</style>
            </head>
            <body>
                <h2>🔔 Notifications for messages from: <%= sender %></h2>
                ${notifHtml || '<p style="color:#6c7086">No notifications</p>'}
            </body></html>
        `);
    } catch (err) {
        res.status(500).json({ message: 'Notification render failed', error: err.message });
    }
});

module.exports = router;
