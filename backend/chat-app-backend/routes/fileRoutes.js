const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// ==================== LFI (Local File Inclusion) ====================
// @desc    View application files (vulnerable — reads arbitrary local files)
// @route   GET /api/files/view?file=...
// VULNERABLE: no path validation — allows directory traversal
// Attack: /api/files/view?file=../../../../etc/passwd
// Attack: /api/files/view?file=../.env (reads database credentials)
router.get('/view', (req, res) => {
    try {
        const file = req.query.file;
        if (!file) return res.status(400).json({ message: 'File parameter required' });

        // VULNERABLE: path.join does NOT prevent traversal — LFI
        const filePath = path.join(__dirname, '..', 'uploads', file);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(content);
    } catch (err) {
        res.status(500).json({ message: 'Failed to read file', error: err.message });
    }
});

// @desc    Download application files (vulnerable — same LFI via download)
// @route   GET /api/files/download?file=...
// VULNERABLE: serves arbitrary files as downloads
// Attack: /api/files/download?file=../server.js
// Attack: /api/files/download?file=../../../etc/shadow
router.get('/download', (req, res) => {
    try {
        const file = req.query.file;
        if (!file) return res.status(400).json({ message: 'File parameter required' });

        // VULNERABLE: no path sanitization — allows traversal to any file
        const filePath = path.join(__dirname, '..', 'uploads', file);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath);
    } catch (err) {
        res.status(500).json({ message: 'Download failed', error: err.message });
    }
});

// @desc    List files in a directory (vulnerable — directory listing)
// @route   GET /api/files/list?dir=...
// VULNERABLE: lists contents of arbitrary directories
// Attack: /api/files/list?dir=../../
router.get('/list', (req, res) => {
    try {
        const dir = req.query.dir || '.';

        // VULNERABLE: lists arbitrary directories — information disclosure
        const dirPath = path.join(__dirname, '..', 'uploads', dir);

        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            return res.status(404).json({ message: 'Directory not found' });
        }

        const files = fs.readdirSync(dirPath).map(f => {
            const stats = fs.statSync(path.join(dirPath, f));
            return { name: f, size: stats.size, isDir: stats.isDirectory(), modified: stats.mtime };
        });

        res.json({ directory: dir, files });
    } catch (err) {
        res.status(500).json({ message: 'Failed to list directory', error: err.message });
    }
});

module.exports = router;
