import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdmin } from '../App';

const Chats = () => {
    const { api } = useAdmin();
    const [chats, setChats] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const loadChats = async () => {
        setLoading(true);
        try {
            const data = await api(`/api/admin/chats?page=${page}&limit=15`);
            setChats(data.chats); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load chats'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadChats(); }, [page]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this chat?')) return;
        try { await api(`/api/admin/chats/${id}`, { method: 'DELETE' }); toast.success('Chat deleted'); loadChats(); }
        catch { toast.error('Delete failed'); }
    };

    const getAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <div className="page">
            <div className="page-header">
                <h1>Chats <span className="badge">{total}</span></h1>
            </div>

            <div className="table-card">
                <table>
                    <thead><tr><th>Participants</th><th>Last Message</th><th>Updated</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="table-loading">Loading...</td></tr>
                        ) : chats.length === 0 ? (
                            <tr><td colSpan="4" className="table-empty">No chats found</td></tr>
                        ) : chats.map((c, i) => (
                            <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                <td>
                                    <div className="participants-cell">
                                        {(c.participants || []).map(p => (
                                            <div key={p._id} className="participant-chip">
                                                <img src={p.profilePic || getAvatar(p.name || p.username)} alt="" className="chip-avatar" />
                                                {p.name || p.username}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="msg-preview">{c.lastMessage?.text || '—'}</td>
                                <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                                <td>
                                    <button className="del-btn" onClick={() => handleDelete(c._id)}>🗑️</button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span>Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
};

export default Chats;
