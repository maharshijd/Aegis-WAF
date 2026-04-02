// ⚠️ WARNING: THIS APPLICATION IS INTENTIONALLY VULNERABLE — FOR EDUCATIONAL USE ONLY ⚠️
// DO NOT DEPLOY TO PRODUCTION. This is a deliberately insecure application
// designed for learning about web application security vulnerabilities.
// Vulnerability categories covered: OWASP Top 10 (2021)

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const { initSocket } = require('./socket.js');
initSocket(server);

// ==================== VULNERABILITY: A05 — Security Misconfiguration ====================
// CORS is completely open — allows ANY origin to make requests
// This means any website can make authenticated requests to this API
app.use(cors({
    origin: true,           // VULNERABLE: allows ALL origins
    credentials: true,      // VULNERABLE: sends cookies/auth headers cross-origin to ANY site
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'],  // VULNERABLE: allows any header
}));

// VULNERABLE: No request size limit — allows denial-of-service via huge payloads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// ==================== VULNERABILITY: A05 — Verbose Error Details ====================
// Exposes full stack traces and internal errors to clients
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
        stack: err.stack,           // VULNERABLE: exposes full stack trace
        env: process.env.NODE_ENV,  // VULNERABLE: leaks environment info
    });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// VULNERABLE: directory listing enabled for uploads
app.use('/uploads', express.static(uploadsDir, { dotfiles: 'allow' }));

// ==================== VULNERABILITY: A09 — No Security Headers ====================
// No Helmet, no X-Content-Type-Options, no X-Frame-Options, etc.
// This enables clickjacking, MIME sniffing, and other attacks.
app.use((req, res, next) => {
    // VULNERABLE: Explicitly REMOVE security headers to make attacks easier
    res.removeHeader('X-Powered-By');
    // No Content-Security-Policy = allows XSS
    // No X-Frame-Options = allows clickjacking
    // No X-Content-Type-Options = allows MIME sniffing
    // No Strict-Transport-Security = allows MitM downgrade
    next();
});

// ==================== VULNERABILITY: A07 — Debug/Info Endpoints ====================
// Exposes server environment, configs, and internal state
app.get('/api/debug/env', (req, res) => {
    // VULNERABLE: exposes ALL environment variables including secrets
    res.json({
        env: process.env,
        cwd: process.cwd(),
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
    });
});

app.get('/api/debug/config', (req, res) => {
    // VULNERABLE: exposes database connection string, JWT secret, etc.
    res.json({
        mongoUri: process.env.MONGO_URI,
        jwtSecret: process.env.JWT_SECRET,
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        port: process.env.PORT,
        clientUrl: process.env.CLIENT_URL,
    });
});

// ==================== VULNERABILITY: A03 — Command Injection ====================
// Executes user-supplied input as shell commands
app.get('/api/debug/ping', (req, res) => {
    const { host } = req.query;
    if (!host) return res.status(400).json({ message: 'Host parameter required' });

    // VULNERABLE: user input directly concatenated into shell command
    // Attack: /api/debug/ping?host=127.0.0.1;cat /etc/passwd
    // Attack: /api/debug/ping?host=127.0.0.1 && whoami
    const { execSync } = require('child_process');
    try {
        const output = execSync(`ping -c 2 ${host}`, { timeout: 10000 }).toString();
        res.json({ host, output });
    } catch (err) {
        res.json({ host, error: err.message, output: err.stdout?.toString() || '' });
    }
});

// ==================== VULNERABILITY: A03 — Eval Injection ====================
// Evaluates user-supplied JavaScript code on the server
app.post('/api/debug/eval', (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code parameter required' });

    // VULNERABLE: executes arbitrary JavaScript — Remote Code Execution
    // Attack: POST with body { "code": "process.env" }
    // Attack: POST with body { "code": "require('child_process').execSync('ls -la').toString()" }
    try {
        const result = eval(code);
        res.json({ result: String(result) });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Route Imports
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const templateRoutes = require('./routes/templateRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/files', fileRoutes);

// Health check — also leaks server info
app.get('/', (req, res) => {
    res.json({
        status: '⚠️ VULNERABLE Chat App Backend — EDUCATIONAL USE ONLY',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
    });
});

// Database Connection
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        console.log('⚠️  WARNING: This server is INTENTIONALLY VULNERABLE');
        console.log('⚠️  DO NOT expose this to the internet!');
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
