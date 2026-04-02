import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const avatarColors = ['linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #4facfe, #00f2fe)', 'linear-gradient(135deg, #43e97b, #38f9d7)'];
const getColor = (n) => { let h = 0; for (let i = 0; i < (n || '').length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };
const getDefaultAvatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

const UserProfile = ({ onClose, onLogout }) => {
    const { user, updateUser, authAxios, API_URL } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', statusMessage: user?.statusMessage || '' });
    const [changingPwd, setChangingPwd] = useState(false);
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });

    const handleSave = async () => {
        try { const res = await authAxios.put('/api/users/profile', form); updateUser(res.data); setEditing(false); toast.success('Profile updated'); }
        catch { toast.error('Update failed'); }
    };

    const handlePwd = async () => {
        try { await authAxios.put('/api/users/password', pwdForm); toast.success('Password changed'); setChangingPwd(false); setPwdForm({ currentPassword: '', newPassword: '' }); }
        catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="profile-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-text-secondary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <img
                    src={user?.profilePic ? (user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}${user.profilePic}`) : getDefaultAvatar(user?.name || user?.username)}
                    alt=""
                    onError={(e) => { e.target.src = getDefaultAvatar(user?.name || user?.username); }}
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
                />
                <h3 style={{ marginTop: 10, fontSize: '0.95rem', fontWeight: 600 }}>{user?.name || user?.username}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>@{user?.username}</p>
            </div>

            {editing ? (
                <div>
                    <div className="form-field"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="form-field"><label>Bio</label><input value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="About you" /></div>
                    <div className="form-field"><label>Status</label><input value={form.statusMessage} onChange={e => setForm({ ...form, statusMessage: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save</button>
                        <button className="btn-primary" onClick={() => setEditing(false)} style={{ flex: 1, background: '#9CA3AF' }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</span>
                        <p style={{ fontSize: '0.84rem', marginTop: 3 }}>{user?.bio || 'No bio yet'}</p>
                    </div>
                    <button className="btn-primary" onClick={() => setEditing(true)} style={{ marginTop: 14 }}>Edit Profile</button>
                </div>
            )}

            <div style={{ marginTop: 16, padding: '10px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem' }}>Dark Mode</span>
                <button onClick={toggleTheme} style={{ padding: '4px 12px', borderRadius: 16, border: '1px solid var(--color-border)', background: theme === 'dark' ? 'var(--color-primary)' : 'transparent', color: theme === 'dark' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.76rem', fontFamily: 'inherit' }}>
                    {theme === 'dark' ? 'On' : 'Off'}
                </button>
            </div>

            {changingPwd ? (
                <div style={{ marginTop: 12 }}>
                    <div className="form-field"><label>Current</label><input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} /></div>
                    <div className="form-field"><label>New</label><input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" onClick={handlePwd} style={{ flex: 1 }}>Update</button>
                        <button className="btn-primary" onClick={() => setChangingPwd(false)} style={{ flex: 1, background: '#9CA3AF' }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setChangingPwd(true)} style={{ marginTop: 12, width: '100%', padding: 10, border: '1px solid var(--color-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    🔒 Change Password
                </button>
            )}

            <motion.button onClick={onLogout} whileTap={{ scale: 0.97 }} style={{ marginTop: 14, width: '100%', padding: 10, border: 'none', borderRadius: 8, background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, fontFamily: 'inherit' }}>
                Logout
            </motion.button>
        </div>
    );
};

export default UserProfile;
