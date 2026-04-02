import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAdmin } from '../App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, token } = useAdmin();
    const nav = useNavigate();

    if (token) { nav('/'); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            login(data.token, data.user);
            toast.success('Welcome, Admin!');
            nav('/');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <motion.div className="login-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <div className="login-logo">
                    <div className="logo-icon-admin large">N</div>
                </div>
                <h1>NexTalk Admin</h1>
                <p className="login-sub">Sign in to the admin dashboard</p>
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email or Username</label>
                        <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <motion.button type="submit" className="login-btn" disabled={loading} whileTap={{ scale: 0.97 }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </motion.button>
                </form>
                <p className="login-hint">Only admin users can access this panel</p>
            </motion.div>
        </div>
    );
};

export default Login;
