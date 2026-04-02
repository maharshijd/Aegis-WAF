import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Register = () => {
    const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register, loginWithGoogle } = useAuth();
    const googleBtnRef = useRef(null);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !window.google) return;
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    try {
                        setLoading(true);
                        await loginWithGoogle(response.credential);
                        toast.success('Welcome to NexTalk!');
                        navigate('/chat');
                    } catch (err) {
                        setError(err.response?.data?.message || 'Google signup failed');
                    } finally { setLoading(false); }
                },
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'rectangular',
            });
        } catch (e) { console.warn('Google Sign-In init failed:', e); }
    }, []);

    const passwordStrength = useMemo(() => {
        const p = form.password;
        if (!p) return { score: 0, label: '', color: '#e5e7eb', width: '0%' };
        let score = 0;
        if (p.length >= 6) score++; if (p.length >= 10) score++;
        if (/[A-Z]/.test(p)) score++; if (/[0-9]/.test(p)) score++; if (/[^A-Za-z0-9]/.test(p)) score++;
        const levels = [
            { label: 'Weak', color: '#EF4444' }, { label: 'Fair', color: '#F59E0B' },
            { label: 'Good', color: '#F97316' }, { label: 'Strong', color: '#22C55E' },
            { label: 'Excellent', color: '#22C55E' },
        ];
        const level = levels[Math.min(score, levels.length) - 1] || levels[0];
        return { score, ...level, width: `${(score / 5) * 100}%` };
    }, [form.password]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register({ name: form.name, username: form.username, email: form.email, password: form.password });
            toast.success('Welcome to NexTalk!');
            navigate('/chat');
        } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <motion.div className="auth-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <motion.img src="/team-collab.png" alt="Team" className="team-image" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} />
                    <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>Join your team</motion.h2>
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>Create your NexTalk account to get started</motion.p>
                </motion.div>
                <div className="auth-right">
                    <motion.div className="auth-form-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} style={{ overflowY: 'auto' }}>
                        <div className="logo-icon"><img src="/nextalk-logo.png" alt="NexTalk" /></div>
                        <h1>Create account</h1>
                        <p className="subtitle">Fill in your details</p>
                        {error && <div className="error-banner">{error}</div>}
                        <form onSubmit={handleRegister}>
                            <div className="form-field"><label>Full Name</label><input name="name" required value={form.name} onChange={handleChange} placeholder="John Doe" /></div>
                            <div className="form-field"><label>Username</label><input name="username" required value={form.username} onChange={handleChange} placeholder="johndoe" minLength={3} /></div>
                            <div className="form-field"><label>Email</label><input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" /></div>
                            <div className="form-field">
                                <label>Password</label>
                                <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Min 6 characters" minLength={6} />
                                {form.password && (
                                    <>
                                        <div className="password-strength"><motion.div className="password-strength-bar" animate={{ width: passwordStrength.width, background: passwordStrength.color }} /></div>
                                        <span style={{ fontSize: '0.7rem', color: passwordStrength.color, marginTop: 2, display: 'block' }}>{passwordStrength.label}</span>
                                    </>
                                )}
                            </div>
                            <div className="form-field"><label>Confirm Password</label><input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" /></div>
                            <motion.button type="submit" className="btn-primary" disabled={loading} whileTap={{ scale: 0.97 }}>{loading ? 'Creating...' : 'Create Account'}</motion.button>
                        </form>

                        <div className="auth-divider">or sign up with</div>
                        <div style={{ width: '100%' }}>
                            {GOOGLE_CLIENT_ID ? (
                                <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
                            ) : (
                                <button className="social-btn" type="button" style={{ width: '100%' }}
                                    onClick={() => toast.error('Set VITE_GOOGLE_CLIENT_ID in .env to enable Google signup')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign up with Google
                                </button>
                            )}
                        </div>

                        <div className="auth-footer-text">Already have an account? <Link to="/login">Sign In</Link></div>
                    </motion.div>
                </div>
            </div>
            <div className="auth-bottom-bar">© 2025 NexTalk. All rights reserved</div>
        </div>
    );
};

export default Register;
