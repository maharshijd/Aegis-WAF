import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const avatarColors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)',
    'linear-gradient(135deg, #f6d365, #fda085)',
    'linear-gradient(135deg, #84fab0, #8fd3f4)',
    'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
];
const getAvatarColor = (n) => { let h = 0; for (let i = 0; i < (n || '').length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };
const getDefaultAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'now';
    if (diff < 60) return `${diff}m`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (hrs < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GroupAvatar = ({ name }) => (
    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
        {name ? name.charAt(0).toUpperCase() : 'G'}
    </div>
);

const ChatList = ({ chats, activeChat, onSelectChat, onNewChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [creatingGroup, setCreatingGroup] = useState(false);

    const { user, API_URL, authAxios } = useAuth();
    const { onlineUsers } = useSocket();

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const q = searchQuery.toLowerCase();
        return chats.filter((c) => {
            if (c.isGroupChat) return c.chatName?.toLowerCase().includes(q);
            const o = c.otherUser;
            return o?.username?.toLowerCase().includes(q) || o?.name?.toLowerCase().includes(q);
        });
    }, [chats, searchQuery]);

    // Handle user search in modal
    const handleSearchUsers = async (e) => {
        const query = e.target.value;
        setUserSearch(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await authAxios.get(`/api/auth/users?search=${query}`);
            setSearchResults(res.data.filter(u => u._id !== user._id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) return;
        setCreatingGroup(true);
        try {
            const res = await authAxios.post('/api/chats/group', {
                name: groupName,
                users: selectedUsers.map(u => u._id),
            });
            onSelectChat(res.data);
            setShowGroupModal(false);
            setGroupName('');
            setSelectedUsers([]);
            setUserSearch('');
            setSearchResults([]);
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingGroup(false);
        }
    };

    const toggleUserSelection = (u) => {
        if (selectedUsers.find(su => su._id === u._id)) {
            setSelectedUsers(selectedUsers.filter(su => su._id !== u._id));
        } else {
            setSelectedUsers([...selectedUsers, u]);
        }
    };

    return (
        <div className="chat-list-panel">
            <div className="chat-list-header">
                <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src={user?.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : getDefaultAvatar(user?.name || user?.username)}
                            alt="" className="user-avatar"
                            onError={(e) => { e.target.src = getDefaultAvatar(user?.name || user?.username); }}
                        />
                        <span className="user-name-display">{user?.name || user?.username}</span>
                    </div>
                    <button onClick={() => setShowGroupModal(true)} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="New Group">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>

            <div className="search-box">
                <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="chat-items">
                <AnimatePresence>
                    {filteredChats.map((chat, i) => {
                        const isActive = activeChat?._id === chat._id;
                        const lastMsg = chat.lastMessage;

                        if (chat.isGroupChat) {
                            return (
                                <motion.div
                                    key={chat._id}
                                    className={`chat-item ${isActive ? 'active' : ''}`}
                                    onClick={() => onSelectChat(chat)}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    layout
                                >
                                    <GroupAvatar name={chat.chatName} />
                                    <div className="chat-info">
                                        <div className="chat-name">{chat.chatName}</div>
                                        <div className="chat-preview">{lastMsg?.text || 'No messages yet'}</div>
                                    </div>
                                    <div className="chat-meta">
                                        <span className="chat-time">{lastMsg ? formatTime(lastMsg.createdAt) : ''}</span>
                                        {chat.unreadCount > 0 && (
                                            <motion.span className="unread-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>{chat.unreadCount}</motion.span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        }

                        const other = chat.otherUser;
                        if (!other) return null;
                        const isOnline = onlineUsers.includes(other._id);

                        return (
                            <motion.div
                                key={chat._id}
                                className={`chat-item ${isActive ? 'active' : ''}`}
                                onClick={() => onSelectChat(chat)}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                layout
                            >
                                <div className="avatar-wrapper">
                                    <img
                                        src={other.profilePic ? (other.profilePic.startsWith('http') ? other.profilePic : `${API_URL}${other.profilePic}`) : getDefaultAvatar(other.name || other.username)}
                                        alt="" className="avatar"
                                        onError={(e) => { e.target.src = getDefaultAvatar(other.name || other.username); }}
                                    />
                                    {isOnline && <span className="online-dot" />}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-name">{other.name || other.username}</div>
                                    <div className="chat-preview">{lastMsg?.text || 'No messages yet'}</div>
                                </div>
                                <div className="chat-meta">
                                    <span className="chat-time">{lastMsg ? formatTime(lastMsg.createdAt) : ''}</span>
                                    {chat.unreadCount > 0 && (
                                        <motion.span className="unread-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                            {chat.unreadCount}
                                        </motion.span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filteredChats.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 18px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                        {searchQuery ? 'No results found' : 'No conversations yet'}
                    </div>
                )}
            </div>

            {/* New Group Modal */}
            <AnimatePresence>
                {showGroupModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ width: '90%', maxWidth: 400, padding: 24 }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Create Group Chat</h2>
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 16 }}
                            />
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Add Users</label>
                                <input
                                    type="text"
                                    placeholder="Search users to add..."
                                    value={userSearch}
                                    onChange={handleSearchUsers}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', marginTop: 8 }}
                                />
                                {searchResults.length > 0 && (
                                    <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginTop: 8 }}>
                                        {searchResults.map(u => (
                                            <div key={u._id} onClick={() => toggleUserSelection(u)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                                                <span>{u.username}</span>
                                                {selectedUsers.find(su => su._id === u._id) && <span style={{ color: 'var(--color-primary)' }}>✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedUsers.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                    {selectedUsers.map(u => (
                                        <span key={u._id} style={{ padding: '4px 10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 16, fontSize: '0.75rem' }}>
                                            {u.username} <span onClick={() => toggleUserSelection(u)} style={{ cursor: 'pointer', marginLeft: 4 }}>×</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowGroupModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleCreateGroup} disabled={creatingGroup || !groupName || selectedUsers.length < 1} className="btn-primary" style={{ padding: '8px 16px', opacity: (creatingGroup || !groupName || selectedUsers.length < 1) ? 0.5 : 1 }}>
                                    {creatingGroup ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatList;
