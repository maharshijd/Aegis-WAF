import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const getDefaultAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export default function ContactsView({ onStartChat }) {
    const { authAxios, API_URL } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await authAxios.get('/api/users');
                setUsers(res.data);
            } catch (error) {
                console.error('Failed to load contacts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [authAxios]);

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="chat-list-panel">
            <div className="chat-list-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Contacts</h2>
            </div>
            <div className="search-box">
                <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="chat-items" style={{ padding: '0 12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>Loading contacts...</div>
                ) : (
                    <AnimatePresence>
                        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                            <motion.div
                                key={user._id}
                                className="chat-item"
                                onClick={() => onStartChat(user)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                            >
                                <img
                                    src={user.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : getDefaultAvatar(user.name || user.username)}
                                    alt={user.username}
                                    className="chat-avatar"
                                    onError={(e) => { e.target.src = getDefaultAvatar(user.name || user.username); }}
                                    style={{ width: 44, height: 44, borderRadius: '50%' }}
                                />
                                <div className="chat-info">
                                    <div className="chat-name" style={{ fontSize: '0.95rem' }}>{user.name || user.username}</div>
                                    <div className="chat-preview" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        @{user.username}
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>No contacts found.</div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
