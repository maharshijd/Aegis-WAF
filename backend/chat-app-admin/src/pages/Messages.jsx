import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdmin } from '../App';

const Messages = () => {
    const { api } = useAdmin();
    const [messages, setMessages] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await api(`/api/admin/messages?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
            setMessages(data.messages); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load messages'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadMessages(); }, [page, search]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this message?')) return;
        try { await api(`/api/admin/messages/${id}`, { method: 'DELETE' }); toast.success('Message deleted'); loadMessages(); }
        catch { toast.error('Delete failed'); }
    };

    const getAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    const getSender = (m) => { const s = m.sender_id; return typeof s === 'object' ? s : null; };
    const getReceiver = (m) => { const r = m.receiver_id; return typeof r === 'object' ? r : null; };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Messages <span className="badge">{total}</span></h1>
                <div className="search-bar">
                    <input type="text" placeholder="Search messages..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            <div className="table-card">
                <table>
                    <thead><tr><th>From</th><th>To</th><th>Message</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="table-loading">Loading...</td></tr>
                        ) : messages.length === 0 ? (
                            <tr><td colSpan="6" className="table-empty">No messages found</td></tr>
                        ) : messages.map((m, i) => {
                            const sender = getSender(m);
                            const receiver = getReceiver(m);
                            return (
                                <motion.tr key={m._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                    <td>
                                        <div className="user-cell compact">
                                            <img src={sender?.profilePic || getAvatar(sender?.name || sender?.username)} alt="" className="table-avatar sm" />
                                            <span>{sender?.name || sender?.username || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-cell compact">
                                            <img src={receiver?.profilePic || getAvatar(receiver?.name || receiver?.username)} alt="" className="table-avatar sm" />
                                            <span>{receiver?.name || receiver?.username || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="msg-preview">{m.deleted ? <em style={{ opacity: 0.4 }}>deleted</em> : m.text || (m.fileUrl ? '📎 File' : '—')}</td>
                                    <td className="time-cell">{new Date(m.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                                    <td><span className={`msg-status ${m.status}`}>{m.status || 'sent'}</span></td>
                                    <td><button className="del-btn" onClick={() => handleDelete(m._id)}>🗑️</button></td>
                                </motion.tr>
                            );
                        })}
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

export default Messages;
