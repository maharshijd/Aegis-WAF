import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getDefaultAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export default function NotificationsView({ chats, onSelectChat }) {
    const unreadChats = chats?.filter(chat => chat.unreadCount > 0) || [];

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-list-panel">
            <div className="chat-list-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0' }}>Notifications</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    You have {unreadChats.length} unread {unreadChats.length === 1 ? 'message' : 'messages'}
                </div>
            </div>

            <div className="chat-items" style={{ padding: '0 12px' }}>
                <AnimatePresence>
                    {unreadChats.length > 0 ? unreadChats.map((chat) => {
                        const displayName = chat.isGroupChat ? chat.chatName : (chat.otherUser?.name || chat.otherUser?.username);
                        const avatarSrc = chat.isGroupChat
                            ? null
                            : (chat.otherUser?.profilePic?.startsWith('http') ? chat.otherUser.profilePic : getDefaultAvatar(displayName));
                        const lastMsg = chat.lastMessage?.text || 'Sent an attachment';

                        return (
                            <motion.div
                                key={chat._id}
                                className="chat-item"
                                onClick={() => onSelectChat(chat)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ background: 'var(--color-primary-ultra-light)', borderLeft: '3px solid var(--color-primary)' }}
                                layout
                            >
                                <div style={{ marginRight: '12px' }}>
                                    {chat.isGroupChat ? (
                                        <div className="user-avatar-initials" style={{ background: 'var(--color-primary)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'white', fontWeight: 'bold' }}>
                                            {displayName?.charAt(0).toUpperCase() || 'G'}
                                        </div>
                                    ) : (
                                        <img
                                            src={avatarSrc}
                                            alt={displayName}
                                            className="chat-avatar"
                                            onError={(e) => { e.target.src = getDefaultAvatar(displayName); }}
                                            style={{ width: 44, height: 44, borderRadius: '50%' }}
                                        />
                                    )}
                                </div>
                                <div className="chat-info" style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                        <div className="chat-name" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{displayName}</div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                            {chat.unreadCount} new
                                        </span>
                                    </div>
                                    <div className="chat-preview" style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                                        {lastMsg}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {chat.lastMessage?.createdAt && formatTime(chat.lastMessage.createdAt)}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.5 }}>📭</div>
                            No new notifications
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
