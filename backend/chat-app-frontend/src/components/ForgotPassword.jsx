import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSendOtp = (e) => {
        e.preventDefault();
        // In a real app, this would send an API request to send OTP
        toast.success('OTP sent to your email (demo mode)');
        setStep(2);
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        // In a real app, verify OTP with backend
        if (otp.length === 6) {
            toast.success('OTP verified!');
            setStep(3);
        } else {
            toast.error('Please enter a valid 6-digit OTP');
        }
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        // In a real app, call API to reset password
        toast.success('Password reset successfully! Please login with your new password.');
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                style={{ maxWidth: 480 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-form-section" style={{ padding: '50px 40px' }}>
                    <div className="auth-logo">Q</div>

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1>Forgot Password</h1>
                            <p className="subtitle">Enter your email to receive a verification code</p>
                            <form onSubmit={handleSendOtp}>
                                <div className="form-field">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <button type="submit" className="btn-primary">
                                    Send OTP
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1>Verify OTP</h1>
                            <p className="subtitle">Enter the 6-digit code sent to {email}</p>
                            <form onSubmit={handleVerifyOtp}>
                                <div className="form-field">
                                    <label>Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                    />
                                </div>
                                <button type="submit" className="btn-primary">
                                    Verify Code
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1>Reset Password</h1>
                            <p className="subtitle">Create a new secure password</p>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-field">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                    />
                                </div>
                                <button type="submit" className="btn-primary">
                                    Reset Password
                                </button>
                            </form>
                        </motion.div>
                    )}

                    <div className="auth-footer" style={{ marginTop: 24 }}>
                        <Link to="/login">← Back to Login</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
