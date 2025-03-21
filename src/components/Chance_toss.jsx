import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useGameStore from '../store/gameStore';
import './Chance_toss.css';

const ChanceToss = () => {
    const navigate = useNavigate();
    const { 
        username, 
        balance, 
        balanceError,
        fetchBalance,
        initBalance,
        updateBalanceAfterBet
    } = useGameStore();
    
    const [betAmount, setBetAmount] = useState('');
    const [choice, setChoice] = useState('');
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [showResult, setShowResult] = useState(false);

    const fetchBetHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/coin-history/${username}`);
            setHistory(response.data.slice(0, 10));
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    useEffect(() => {
        if (!username) {
            navigate('/login');
            return;
        }

        // Initialize balance on component mount (page load/refresh)
        initBalance();
        fetchBetHistory();

        // No need for cleanup as we're not polling anymore
    }, [username, navigate, initBalance]);

    // Show balance error if any
    useEffect(() => {
        if (balanceError) {
            setError(balanceError);
        }
    }, [balanceError]);

    const handleBet = async () => {
        if (!betAmount || !choice) {
            setError('Please enter bet amount and select heads or tails');
            return;
        }

        if (parseFloat(betAmount) < 1) {
            setError('Minimum bet amount is ₹1');
            return;
        }

        if (parseFloat(betAmount) > balance) {
            setError('Insufficient balance');
            return;
        }

        setError('');
        setIsFlipping(true);
        setShowResult(false);

        try {
            console.log('Placing bet with:', {
                player_name: username,
                bet_amount: parseFloat(betAmount),
                bet_choice: choice,
                current_balance: balance
            });

            const response = await axios.post('http://localhost:8000/coin-flip-bet/', {
                player_name: username,
                bet_amount: parseFloat(betAmount),
                bet_choice: choice
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Full bet response:', response);

            if (response.data && typeof response.data.new_balance === 'number') {
                // Wait for coin flip animation
                setTimeout(async () => {
                    const isLost = response.data.message && response.data.message.includes("lost");
                    setResult({
                        won: !isLost,
                        outcome: isLost ? "lost" : "won",
                        profit: isLost ? 0 : parseFloat(betAmount) * 2
                    });
                    setShowResult(true);
                    setIsFlipping(false);
                    
                    // Fetch fresh data after bet
                    try {
                        await Promise.all([
                            updateBalanceAfterBet(),
                            fetchBetHistory()
                        ]);
                        console.log('Successfully updated balance and history after bet');
                    } catch (updateError) {
                        console.error('Error updating data after bet:', updateError);
                        setError('Bet placed but error updating display. Please refresh.');
                    }
                    
                    // Clear bet amount and choice
                    setBetAmount('');
                    setChoice('');
                }, 3000);
            } else {
                console.error('Invalid response structure:', response.data);
                throw new Error('Invalid response from server: missing new_balance');
            }
        } catch (error) {
            console.error('Detailed bet error:', {
                error: error,
                response: error.response,
                data: error.response?.data,
                status: error.response?.status
            });
            setIsFlipping(false);
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                setError('Session expired. Please login again.');
                navigate('/login');
                return;
            }
            
            if (error.response && error.response.data) {
                setError(error.response.data.detail || error.response.data.message || 'Failed to place bet');
            } else {
                setError('Network error. Please check your connection and try again.');
            }
            
            // Fetch fresh data to ensure accurate state
            try {
                await Promise.all([
                    fetchBalance(true), // Force refresh balance
                    fetchBetHistory()
                ]);
            } catch (updateError) {
                console.error('Error updating data after failed bet:', updateError);
            }
        }
    };

    const quickBets = [10, 50, 100, 500, 1000];

    return (
        <div className="chance-toss-container">
            <div className="game-header">
                <h1>Chance Toss</h1>
                <button className="back-btn" onClick={() => navigate('/welcome')}>
                    Back to Home
                </button>
            </div>

            <div className="game-content">
                <div className="betting-section">
                    <div className="balance-display">
                        <h3>Your Balance</h3>
                        <p>₹{balance.toFixed(2)}</p>
                    </div>

                    <div className="coin-section">
                        <div className={`coin ${isFlipping ? 'flipping' : ''}`}>
                            <div className="coin-side heads">
                                <div className="coin-face"></div>
                            </div>
                            <div className="coin-side tails">
                                <div className="coin-face"></div>
                            </div>
                        </div>
                        {showResult && (
                            <div className="result-overlay">
                                <h2 className={result.won ? 'win' : 'lose'}>
                                    {result.won ? 'YOU WON!' : 'YOU LOST!'}
                                </h2>
                                {result.won && (
                                    <div className="profit">
                                        +₹{result.profit}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="betting-controls">
                        <div className="bet-amount-section">
                            <label>Bet Amount</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="1"
                            />
                            <div className="quick-bets">
                                {quickBets.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setBetAmount(amount.toString())}
                                        className="quick-bet-btn"
                                    >
                                        ₹{amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="choice-buttons">
                            <button
                                className={`choice-btn ${choice === 'heads' ? 'selected' : ''}`}
                                onClick={() => setChoice('heads')}
                                disabled={isFlipping}
                            >
                                Heads
                            </button>
                            <button
                                className={`choice-btn ${choice === 'tails' ? 'selected' : ''}`}
                                onClick={() => setChoice('tails')}
                                disabled={isFlipping}
                            >
                                Tails
                            </button>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            className="toss-btn"
                            onClick={handleBet}
                            disabled={isFlipping}
                        >
                            {isFlipping ? 'Tossing...' : 'Toss Coin!'}
                        </button>
                    </div>
                </div>

                <div className="history-section">
                    <h3>Recent Bets</h3>
                    <div className="history-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Amount</th>
                                    <th>Result</th>
                                    <th>Profit/Loss</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((bet, index) => {
                                    const isWin = bet.result === 'win';
                                    const profitLoss = isWin ? bet.bet_amount : -bet.bet_amount;
                                    return (
                                        <tr key={index} className={isWin ? 'win' : 'lose'}>
                                            <td>{new Date(bet.created_at).toLocaleString()}</td>
                                            <td>₹{bet.bet_amount}</td>
                                            <td>{bet.result.toUpperCase()}</td>
                                            <td className={isWin ? 'win' : 'lose'}>
                                                {isWin ? `+₹${profitLoss}` : `-₹${-profitLoss}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChanceToss;