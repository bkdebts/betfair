import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import './Welcome.css';

const Welcome = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { username, balance, fetchBalance } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [hideAnimation, setHideAnimation] = useState(false);
    const [showAnimation, setShowAnimation] = useState(true);

    useEffect(() => {
        const fromOtherPage = location.state?.fromOtherPage;
        if (fromOtherPage) {
            setShowAnimation(false);
            setShowContent(true);
        }

        const loadData = async () => {
            try {
                await fetchBalance(true);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        
        if (showAnimation) {
            const timer = setTimeout(() => {
                setHideAnimation(true);
                setTimeout(() => {
                    setShowContent(true);
                }, 300);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [username, fetchBalance, location.state, showAnimation]);

    const handleStartGame = (game) => {
        if (game === 'fate-shuffle') {
            navigate('/fate-shuffle', { state: { fromOtherPage: true } });
        } else if (game === 'aviator') {
            navigate('/game', { state: { fromOtherPage: true } });
        } else if (game === 'chance-toss') {
            navigate('/chance-toss', { state: { fromOtherPage: true } });
        } else if (game === 'minemyst') {
            navigate('/minemyst', { state: { fromOtherPage: true } });
        }
    };

    const handleSettings = () => {
        navigate('/settings', { state: { fromOtherPage: true } });
    };

    const handleTopUp = () => {
        navigate('/topup', { state: { fromOtherPage: true } });
    };

    return (
        <div className="welcome-container">
            <AnimatePresence>
                {showAnimation && !hideAnimation && (
                    <motion.div 
                        className="game-animation"
                        initial={{ opacity: 0, scale: 10.0 }}
                        animate={{ opacity: 1, scale: 10 }}
                        exit={{ opacity: 0, scale: 10.0 }}
                        transition={{ duration: 10.0 }}
                    >
                        {/* Plane animation and multiplier removed */}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showContent && (
                    <motion.div 
                        className="welcome-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Welcome, {username}! 👋
                        </motion.h1>

                        <motion.div 
                            className="balance-section"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="balance-display">
                                <span className="balance-label">Your Balance:</span>
                                <span className="balance-value">
                                    {loading ? 'Loading...' : `₹${balance?.toFixed(2) || '0.00'}`}
                                </span>
                            </div>
                            <motion.button 
                                className="top-up-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleTopUp}
                            >
                                <span className="top-up-emoji">💎</span>
                                <span className="top-up-text">Top Up Balance</span>
                            </motion.button>
                        </motion.div>

                        <motion.div 
                            className="game-buttons"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.button 
                                className="game-btn fate-shuffle"
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartGame('fate-shuffle')}
                            >
                                <span className="game-emoji">🎴</span>
                                <span className="game-name">Fate Shuffle</span>
                            </motion.button>
                            <motion.button 
                                className="game-btn minemyst"
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartGame('minemyst')}
                            >
                                <span className="game-emoji">💣</span>
                                <span className="game-name">MineMyst</span>
                            </motion.button>
                            <motion.button 
                                className="game-btn aviator"
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartGame('aviator')}
                            >
                                <span className="game-emoji">✈️</span>
                                <span className="game-name">Aviator</span>
                            </motion.button>
                            <motion.button 
                                className="game-btn chance-toss"
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStartGame('chance-toss')}
                            >
                                <span className="game-emoji">🪙</span>
                                <span className="game-name">Chance Toss</span>
                            </motion.button>
                        </motion.div>

                        <motion.div 
                            className="settings-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button 
                                className="settings-btn"
                                whileHover={{ scale: 1.05, rotate: 180 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSettings}
                            >
                                <span className="settings-emoji">⚙️</span>
                                <span className="settings-text">Settings</span>
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Welcome;