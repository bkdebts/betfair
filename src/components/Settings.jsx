import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useGameStore from '../store/gameStore';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const { username } = useGameStore();
    const [user, setUser] = useState({
        username: '',
        email: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`http://localhost:8000/users/${username}/profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [navigate, username]);

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:8000/users/${username}/delete/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                localStorage.removeItem('token');
                navigate('/login');
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('Failed to delete account. Please try again.');
            }
        }
    };

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <motion.div 
            className="settings-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="settings-header">
                <h1>Settings</h1>
                <button className="back-btn" onClick={() => navigate('/welcome')}>
                    Back to Home
                </button>
            </div>

            <div className="settings-content">
                <div className="user-info-section">
                    <h2>User Information</h2>
                    <div className="info-card">
                        <div className="info-item">
                            <label>Username</label>
                            <p>{user.username}</p>
                        </div>
                        <div className="info-item">
                            <label>Email</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-item">
                            <label>Phone</label>
                            <p>{user.phone || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                <div className="actions-section">
                    <h2>Account Actions</h2>
                    <div className="action-buttons">
                        <button className="help-btn" onClick={() => window.location.href = 'mailto:support@example.com'}>
                            Help & Support
                        </button>
                        <button className="delete-btn" onClick={handleDeleteAccount}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Settings; 