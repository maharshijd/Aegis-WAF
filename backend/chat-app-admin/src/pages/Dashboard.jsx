import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../App';

const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <div className="stat-icon" style={{ background: color }}>{icon}</div>
        <div className="stat-info">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { api } = useAdmin();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api('/api/admin/stats');
                setStats(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="page-loading">Loading dashboard...</div>;
    if (!stats) return <div className="page-loading">Failed to load stats</div>;

    const maxMsg = Math.max(...stats.last7Days.map(d => d.count), 1);

    return (
        <div className="page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Overview of your NexTalk platform</p>
            </div>

            <div className="stats-grid">
                <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="linear-gradient(135deg, #6366f1, #8b5cf6)" delay={0} />
                <StatCard icon="💬" label="Total Chats" value={stats.totalChats} color="linear-gradient(135deg, #3b82f6, #06b6d4)" delay={0.1} />
                <StatCard icon="✉️" label="Total Messages" value={stats.totalMessages} color="linear-gradient(135deg, #22c55e, #10b981)" delay={0.2} />
                <StatCard icon="🟢" label="Active Today" value={stats.activeToday} color="linear-gradient(135deg, #f59e0b, #f97316)" delay={0.3} />
                <StatCard icon="🆕" label="New Users Today" value={stats.newUsersToday} color="linear-gradient(135deg, #ec4899, #f43f5e)" delay={0.4} />
                <StatCard icon="📨" label="Messages Today" value={stats.messagesToday} color="linear-gradient(135deg, #8b5cf6, #d946ef)" delay={0.5} />
            </div>

            {/* Activity Chart */}
            <motion.div className="chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <h3>Messages — Last 7 Days</h3>
                <div className="bar-chart">
                    {stats.last7Days.map((d, i) => (
                        <div key={d.date} className="bar-col">
                            <div className="bar-value">{d.count}</div>
                            <motion.div
                                className="bar"
                                initial={{ height: 0 }}
                                animate={{ height: `${(d.count / maxMsg) * 100}%` }}
                                transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                            />
                            <div className="bar-label">{new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
