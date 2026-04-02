import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('chatapp_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('chatapp_user'); }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('chatapp_user', JSON.stringify(userData));
        return userData;
    };

    const register = async (data) => {
        const res = await axios.post(`${API_URL}/api/auth/register`, data);
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('chatapp_user', JSON.stringify(userData));
        return userData;
    };

    const loginWithGoogle = async (credential) => {
        const res = await axios.post(`${API_URL}/api/auth/google`, { credential });
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('chatapp_user', JSON.stringify(userData));
        return userData;
    };

    const logout = async () => {
        try {
            if (user) await axios.post(`${API_URL}/api/auth/logout`, { userId: user._id });
        } catch (err) { console.error('Logout error:', err); }
        setUser(null);
        localStorage.removeItem('chatapp_user');
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('chatapp_user', JSON.stringify(newUser));
    };

    const authAxios = axios.create({ baseURL: API_URL });
    authAxios.interceptors.request.use((config) => {
        if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
        return config;
    });

    return (
        <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateUser, loading, authAxios, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export default AuthContext;
