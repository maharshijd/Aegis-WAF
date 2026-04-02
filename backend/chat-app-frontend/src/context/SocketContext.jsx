import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user, API_URL } = useAuth();
    const socketRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});

    useEffect(() => {
        if (!user?._id) return;

        socketRef.current = io(API_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected');
            socketRef.current.emit('join_app', user._id);
        });

        socketRef.current.on('active_users', (users) => {
            setOnlineUsers(users);
        });

        socketRef.current.on('user_status_change', ({ userId, status }) => {
            setOnlineUsers((prev) => {
                if (status === 'online' && !prev.includes(userId)) {
                    return [...prev, userId];
                } else if (status === 'offline') {
                    return prev.filter((id) => id !== userId);
                }
                return prev;
            });
        });

        socketRef.current.on('display_typing', ({ senderId, isTyping }) => {
            setTypingUsers((prev) => {
                if (isTyping) return { ...prev, [senderId]: true };
                const next = { ...prev };
                delete next[senderId];
                return next;
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user?._id, API_URL]);

    const sendMessage = useCallback((data) => {
        socketRef.current?.emit('send_private_message', data);
    }, []);

    const emitTyping = useCallback((senderId, receiverId, isTyping, isGroup = false) => {
        socketRef.current?.emit('typing', { senderId, receiverId, isTyping, isGroup });
    }, []);

    const markRead = useCallback((senderId, receiverId) => {
        socketRef.current?.emit('mark_read', { senderId, receiverId });
    }, []);

    const editMessage = useCallback((messageId, newText, receiverId) => {
        socketRef.current?.emit('edit_message', { messageId, newText, receiverId });
    }, []);

    const deleteMessage = useCallback((messageId, receiverId) => {
        socketRef.current?.emit('delete_message', { messageId, receiverId });
    }, []);

    const reactMessage = useCallback((messageId, emoji, userId, receiverId) => {
        socketRef.current?.emit('react_message', { messageId, emoji, userId, receiverId });
    }, []);

    return (
        <SocketContext.Provider value={{
            socket: socketRef,
            onlineUsers,
            typingUsers,
            sendMessage,
            emitTyping,
            markRead,
            editMessage,
            deleteMessage,
            reactMessage,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within a SocketProvider');
    return context;
};

export default SocketContext;
