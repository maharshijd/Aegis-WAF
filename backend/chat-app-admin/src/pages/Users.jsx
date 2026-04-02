import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdmin } from '../App';

const Users = () => {
    const { api } = useAdmin();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await api(`/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`);
            setUsers(data.users); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadUsers(); }, [page, search]);

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete ${name}? This will remove all their data.`)) return;
        try { await api(`/api/admin/users/${id}`, { method: 'DELETE' }); toast.success('User deleted'); loadUsers(); }
        catch { toast.error('Delete failed'); }
    };

    const handleSaveEdit = async () => {
        try {
            await api(`/api/admin/users/${editUser._id}`, { method: 'PUT', body: JSON.stringify({ name: editUser.name, email: editUser.email, bio: editUser.bio, isAdmin: editUser.isAdmin }) });
            toast.success('User updated'); setEditUser(null); loadUsers();
        } catch { toast.error('Update failed'); }
    };

    const getAvatar = (u) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.name || u.username || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <div className="page">
            <div className="page-header">
                <h1>Users <span className="badge">{total}</span></h1>
                <div className="search-bar">
                    <input type="text" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            <div className="table-card">
                <table>
                    <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="table-loading">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="6" className="table-empty">No users found</td></tr>
                        ) : users.map((u, i) => (
                            <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                <td>
                                    <div className="user-cell">
                                        <img src={u.profilePic || getAvatar(u)} alt="" className="table-avatar" />
                                        <div><div className="cell-name">{u.name || u.username}</div><div className="cell-sub">@{u.username}</div></div>
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td><span className={`role-badge ${u.isAdmin ? 'admin' : ''}`}>{u.isAdmin ? 'Admin' : 'User'}</span></td>
                                <td><span className={`status-dot ${u.status === 'online' ? 'online' : ''}`} />{u.status || 'offline'}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-btns">
                                        <button className="edit-btn" onClick={() => setEditUser({ ...u })}>✏️</button>
                                        <button className="del-btn" onClick={() => handleDelete(u._id, u.name || u.username)}>🗑️</button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span>Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editUser && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditUser(null)}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <h3>Edit User</h3>
                            <div className="field"><label>Name</label><input value={editUser.name || ''} onChange={e => setEditUser({ ...editUser, name: e.target.value })} /></div>
                            <div className="field"><label>Email</label><input value={editUser.email || ''} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
                            <div className="field"><label>Bio</label><input value={editUser.bio || ''} onChange={e => setEditUser({ ...editUser, bio: e.target.value })} /></div>
                            <div className="field checkbox">
                                <label><input type="checkbox" checked={editUser.isAdmin || false} onChange={e => setEditUser({ ...editUser, isAdmin: e.target.checked })} /> Admin access</label>
                            </div>
                            <div className="modal-actions">
                                <button className="cancel-btn" onClick={() => setEditUser(null)}>Cancel</button>
                                <button className="save-btn" onClick={handleSaveEdit}>Save Changes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Users;
