import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const avatarColors = [
    'linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)', 'linear-gradient(135deg, #43e97b, #38f9d7)',
];
const getColor = (n) => { let h = 0; for (let i = 0; i < (n || '').length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };

// Generate a default avatar URL using DiceBear
const getDefaultAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

const ContactPanel = ({ activeChat, otherUser, onSearchChat }) => {
    const { API_URL, authAxios } = useAuth();
    const { onlineUsers } = useSocket();
    const [muted, setMuted] = useState(false);
    const [sharedMedia, setSharedMedia] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const isOnline = otherUser && onlineUsers.includes(otherUser._id);

    // Load actual shared media
    useEffect(() => {
        if (!activeChat?._id) return;
        (async () => {
            try {
                const res = await authAxios.get(`/api/messages/${activeChat._id}?limit=200`);
                const media = (res.data.messages || [])
                    .filter(m => m.fileUrl && m.fileType === 'image')
                    .slice(-6)
                    .reverse();
                setSharedMedia(media);
            } catch { /* ignore */ }
        })();
    }, [activeChat?._id, authAxios]);

    if (!activeChat) return null;

    const isGroup = activeChat.isGroupChat;
    // For direct chats, we definitely need otherUser
    if (!isGroup && !otherUser) return null;

    const avatarUrl = isGroup ? null : (otherUser?.profilePic
        ? (otherUser.profilePic.startsWith('http') ? otherUser.profilePic : `${API_URL}${otherUser.profilePic}`)
        : getDefaultAvatar(otherUser?.name || otherUser?.username || 'User'));

    const displayName = isGroup ? activeChat.chatName : (otherUser?.name || otherUser?.username || 'Unknown User');

    const handleMute = () => {
        setMuted(!muted);
        toast.success(muted ? `Unmuted ${displayName}` : `Muted ${displayName}`);
    };

    const handleSearchConvo = () => {
        if (onSearchChat) onSearchChat();
        else toast('Search in conversation coming soon!', { icon: '🔍' });
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="contact-panel">
            {/* Profile section */}
            <div className="contact-avatar-wrap">
                {isGroup ? (
                    <div className="contact-avatar" style={{ background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '2rem', margin: '0 auto 15px' }}>
                        {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                    </div>
                ) : (
                    <motion.img
                        src={avatarUrl}
                        alt={displayName}
                        className="contact-avatar"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        onError={(e) => { e.target.src = getDefaultAvatar(displayName); }}
                    />
                )}

                <div className="contact-name">{displayName}</div>

                {!isGroup && (
                    <div className="contact-status" style={isOnline ? {} : { color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#22c55e' : '#94a3b8', marginRight: 6 }} />
                        {isOnline ? 'Active now' : 'Offline'}
                    </div>
                )}
                {isGroup && (
                    <div className="contact-status" style={{ color: 'var(--color-text-muted)' }}>
                        {activeChat.participants?.length || 0} Members
                    </div>
                )}

                {!isGroup && otherUser?.bio && <div className="contact-role">{otherUser.bio}</div>}
                {!isGroup && otherUser?.email && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {otherUser.email}
                    </div>
                )}
            </div>

            {/* Shared Media */}
            <div className="section-title">Shared Media</div>
            <div className="shared-media">
                {sharedMedia.length > 0 ? sharedMedia.map((m) => (
                    <a key={m._id} href={`${API_URL}${m.fileUrl}`} target="_blank" rel="noreferrer" style={{ borderRadius: 6, overflow: 'hidden', aspectRatio: '1' }}>
                        <img src={`${API_URL}${m.fileUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </a>
                )) : (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: 'var(--color-bg)', borderRadius: 6, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                            📷
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions — now functional */}
            <div className="section-title">Quick Actions</div>

            <motion.button className="quick-action" onClick={handleMute} whileTap={{ scale: 0.97 }}>
                {muted ? '🔔' : '🔇'} {muted ? 'Unmute Notifications' : 'Mute Notifications'}
            </motion.button>

            <motion.button className="quick-action" onClick={handleSearchConvo} whileTap={{ scale: 0.97 }}>
                🔍 Search in Conversation
            </motion.button>

            <motion.button className="quick-action" onClick={() => setShowSettings(!showSettings)} whileTap={{ scale: 0.97 }}>
                ⚙️ Settings
            </motion.button>

            {/* Settings dropdown */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', padding: '0 16px' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12 }}>
                            <button className="quick-action" style={{ fontSize: '0.78rem', background: 'var(--color-bg)' }}
                                onClick={() => { navigator.clipboard.writeText(otherUser.email || otherUser.username); toast.success('Copied!'); }}>
                                📋 Copy Email
                            </button>
                            <button className="quick-action" style={{ fontSize: '0.78rem', background: 'var(--color-bg)' }}
                                onClick={() => toast('Block user feature coming soon!', { icon: '🚫' })}>
                                🚫 Block User
                            </button>
                            <button className="quick-action" style={{ fontSize: '0.78rem', color: '#EF4444', background: 'var(--color-bg)' }}
                                onClick={() => toast('Delete chat feature coming soon!', { icon: '🗑️' })}>
                                🗑️ Delete Chat
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactPanel;
