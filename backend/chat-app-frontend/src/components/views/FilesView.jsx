import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function FilesView() {
    const { authAxios, API_URL } = useAuth();
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const res = await authAxios.get('/api/messages/media/all');
                setMediaList(res.data);
            } catch (error) {
                console.error('Failed to load shared media:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [authAxios]);

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="chat-list-panel">
            <div className="chat-list-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0' }}>Shared Files</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Media shared across all your chats
                </div>
            </div>

            <div className="chat-items" style={{ padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', width: '100%', padding: '30px', color: 'var(--color-text-muted)' }}>Loading media...</div>
                ) : mediaList.length > 0 ? (
                    <AnimatePresence>
                        {mediaList.map((m) => (
                            <motion.a
                                key={m._id}
                                href={`${API_URL}${m.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    width: 'calc(50% - 5px)',
                                    aspectRatio: '1',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    display: 'block',
                                    background: 'var(--color-bg)'
                                }}
                            >
                                <img
                                    src={`${API_URL}${m.fileUrl}`}
                                    alt="Shared Media"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => {
                                        // Fallback icon for non-image files
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '16px 8px 6px', color: 'white', fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                                        {m.chat_id?.chatName || m.sender_id?.username}
                                    </span>
                                    <span>{formatTime(m.createdAt)}</span>
                                </div>
                            </motion.a>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div style={{ textAlign: 'center', width: '100%', padding: '30px', color: 'var(--color-text-muted)' }}>No shared media found.</div>
                )}
            </div>
        </div>
    );
}
