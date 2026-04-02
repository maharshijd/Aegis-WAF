// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { execSync } = require('child_process');

// ==================== VULNERABILITY: A01 — No Authentication ====================
// Auth middleware REMOVED — anyone can upload files without logging in

// ==================== VULNERABILITY: A08 — Unrestricted File Upload ====================
// No file type validation, no size limit, original filename preserved (path traversal)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // VULNERABLE: Uses original filename — allows path traversal and overwrite
        // Attack: Upload file named "../server.js" to overwrite the server
        // Attack: Upload file named "../../.env" to overwrite environment config
        cb(null, file.originalname);
    },
});

// VULNERABLE: No file filter — allows ANY file type including .js, .sh, .php, .exe
// VULNERABLE: No file size limit
const upload = multer({
    storage,
    // No fileFilter — all file types accepted
    // No limits — unlimited file size
});

// @route   POST /api/upload
// @desc    Upload a file (NO AUTH, NO RESTRICTIONS)
// ==================== VULNERABILITY: A08 — Unrestricted File Upload ====================
// Attack: Upload a malicious .js file, then trigger it via LFI
// Attack: Upload a .html file with script tags for stored XSS
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        let fileType = '';

        if (req.file.mimetype.startsWith('image')) fileType = 'image';
        else if (req.file.mimetype.startsWith('video')) fileType = 'video';
        else if (req.file.mimetype.startsWith('audio')) fileType = 'audio';
        else fileType = 'document';

        res.json({
            fileUrl,
            fileType,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            filePath: req.file.path,      // VULNERABLE: leaks server file path
            destination: req.file.destination,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// @route   POST /api/upload/avatar
// @desc    Upload profile picture (NO AUTH, NO RESTRICTIONS)
router.post('/avatar', upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ fileUrl, filePath: req.file.path });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// @route   POST /api/upload/exec
// @desc    Upload and execute a script (EXTREMELY DANGEROUS)
// ==================== VULNERABILITY: A08 + A03 — Upload & Execute ====================
// Attack: Upload a shell script, this endpoint executes it on the server
router.post('/exec', upload.single('script'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // VULNERABLE: Executes uploaded file as a shell command
        const filePath = path.join(process.cwd(), req.file.path);
        try {
            execSync(`chmod +x ${filePath}`);
            const output = execSync(`${filePath}`, { timeout: 10000 }).toString();
            res.json({ message: 'Script executed', output, filePath });
        } catch (execErr) {
            res.json({ message: 'Execution failed', error: execErr.message, stderr: execErr.stderr?.toString() });
        }
    } catch (error) {
        res.status(500).json({ message: 'Upload/exec failed', error: error.message });
    }
});

module.exports = router;
