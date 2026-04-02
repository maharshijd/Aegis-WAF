import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();
    const googleBtnRef = useRef(null);

    // Initialize Google Sign-In
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !window.google) return;
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                shape: 'rectangular',
            });
        } catch (e) {
            console.warn('Google Sign-In init failed:', e);
        }
    }, []);

    const handleGoogleResponse = async (response) => {
        try {
            setLoading(true);
            await loginWithGoogle(response.credential);
            toast.success('Welcome to NexTalk!');
            navigate('/chat');
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
            toast.error('Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/chat');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <motion.div className="auth-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <motion.img
                        src="/team-collab.png"
                        alt="Team collaboration"
                        className="team-image"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    />
                    <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        Connect with your team
                    </motion.h2>
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                        Seamless communication for modern teams
                    </motion.p>
                </motion.div>

                <div className="auth-right">
                    <motion.div className="auth-form-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <motion.div className="logo-icon" whileHover={{ scale: 1.08 }}>
                            <img src="/nextalk-logo.png" alt="NexTalk" />
                        </motion.div>

                        <h1>Welcome back</h1>
                        <p className="subtitle">Sign in to continue</p>

                        {error && <div className="error-banner">{error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="form-field">
                                <label>Email or Username</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                            </div>

                            <div className="form-field" style={{ position: 'relative' }}>
                                <label>Password</label>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    style={{ position: 'absolute', right: 12, top: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}
                                >
                                    {showPwd ? '🙈' : '👁️'}
                                </button>
                            </div>

                            <div className="form-row">
                                <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                                <Link to="/forgot-password">Forgot password?</Link>
                            </div>

                            <motion.button type="submit" className="btn-primary" disabled={loading} whileTap={{ scale: 0.97 }}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </motion.button>
                        </form>

                        <div className="auth-divider">or continue with</div>

                        {/* Google Sign-In */}
                        <div style={{ width: '100%' }}>
                            {GOOGLE_CLIENT_ID ? (
                                <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
                            ) : (
                                <button
                                    className="social-btn"
                                    type="button"
                                    style={{ width: '100%' }}
                                    onClick={() => toast.error('Set VITE_GOOGLE_CLIENT_ID in .env to enable Google login')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            )}
                        </div>

                        <div className="auth-footer-text">
                            Don't have an account? <Link to="/register">Create account</Link>
                        </div>
                    </motion.div>
                </div>
            </div>
            <div className="auth-bottom-bar">© 2025 NexTalk. All rights reserved</div>
        </div>
    );
};

export default Login;
