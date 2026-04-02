import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Sidebar = ({ activeUser, setActiveUser, onlineUsers, currentUserId }) => {
    const [dbUsers, setDbUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`);
                // Filter out the current user manually
                const otherUsers = res.data.filter(u => u._id !== currentUserId);
                setDbUsers(otherUsers);
            } catch (error) {
                console.error('Failed to grab entities', error);
            }
        };

        if (currentUserId) {
            fetchUsers();
        }
    }, [currentUserId]);

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                CONTACTS
            </div>
            <div className="user-list">
                {dbUsers.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No other contacts found.
                    </div>
                )}
                {dbUsers.map(user => (
                    <div
                        key={user._id}
                        className={`user-item ${activeUser?._id === user._id ? 'active' : ''}`}
                        onClick={() => setActiveUser(user)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar-placeholder">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{user.username}</span>
                        </div>
                        <span className={`status-dot ${onlineUsers.includes(user._id) ? 'online' : ''}`}></span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
