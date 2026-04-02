import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Chats from './pages/Chats';
import Messages from './pages/Messages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Auth Context
const AuthCtx = createContext();
export const useAdmin = () => useContext(AuthCtx);

const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('admin_user') || 'null'));

    const login = (t, u) => { setToken(t); setAdmin(u); localStorage.setItem('admin_token', t); localStorage.setItem('admin_user', JSON.stringify(u)); };
    const logout = () => { setToken(null); setAdmin(null); localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); };

    const api = async (path, opts = {}) => {
        const res = await fetch(`${API_URL}${path}`, {
            ...opts,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
        });
        if (res.status === 401 || res.status === 403) { logout(); throw new Error('Unauthorized'); }
        return res.json();
    };

    return <AuthCtx.Provider value={{ token, admin, login, logout, api, API_URL }}>{children}</AuthCtx.Provider>;
};

// Sidebar
const Sidebar = ({ className = '' }) => {
    const { admin, logout } = useAdmin();
    const loc = useLocation();
    const nav = useNavigate();
    const links = [
        { to: '/', icon: '📊', label: 'Dashboard' },
        { to: '/users', icon: '👥', label: 'Users' },
        { to: '/chats', icon: '💬', label: 'Chats' },
        { to: '/messages', icon: '✉️', label: 'Messages' },
    ];

    return (
        <aside className={`sidebar ${className}`}>
            <div className="sidebar-logo">
                <div className="logo-icon-admin">N</div>
                <span>NexTalk <small>Admin</small></span>
            </div>
            <nav className="sidebar-nav">
                {links.map(l => (
                    <Link key={l.to} to={l.to} className={`nav-link ${loc.pathname === l.to ? 'active' : ''}`}>
                        <span className="nav-icon">{l.icon}</span> {l.label}
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="admin-badge">
                    <div className="admin-avatar">{(admin?.name || admin?.username || 'A').charAt(0).toUpperCase()}</div>
                    <div><div className="admin-name">{admin?.name || admin?.username}</div><div className="admin-role">Administrator</div></div>
                </div>
                <button className="logout-btn" onClick={() => { logout(); nav('/login'); }}>↪ Logout</button>
            </div>
        </aside>
    );
};

const ProtectedLayout = () => {
    const { token } = useAdmin();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const loc = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [loc.pathname]);

    if (!token) return <Navigate to="/login" />;
    return (
        <div className="admin-layout">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                {sidebarOpen ? '✕' : '☰'}
            </button>
            <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
            <Sidebar className={sidebarOpen ? 'open' : ''} />
            <main className="admin-main">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/chats" element={<Chats />} />
                    <Route path="/messages" element={<Messages />} />
                </Routes>
            </main>
        </div>
    );
};

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244' } }} />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);

export default App;
