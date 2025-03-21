import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useGameStore from '../store/gameStore';
import './TopUp.css';

const TopUp = () => {
    const navigate = useNavigate();
    const { username } = useGameStore();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        amount: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showUPIDetails, setShowUPIDetails] = useState(false);
    const [upiDetails, setUpiDetails] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
    const timerRef = useRef(null);

    const validateForm = () => {
        const errors = {};
        
        // Name validation
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        } else if (formData.name.length < 3) {
            errors.name = 'Name must be at least 3 characters';
        }

        // Phone validation
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid 10-digit phone number';
        }

        // Amount validation
        if (!formData.amount) {
            errors.amount = 'Amount is required';
        } else if (parseInt(formData.amount) < 100) {
            errors.amount = 'Minimum amount is ₹100';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error when user types
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const fetchUPIDetails = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/upi-details/');
            setUpiDetails(response.data);
        } catch (error) {
            console.error('Error fetching UPI details:', error);
            setError('Failed to fetch UPI details. Please try again.');
        }
    };

    // Start countdown timer when UPI details are shown
    useEffect(() => {
        if (showUPIDetails && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setShowUPIDetails(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [showUPIDetails, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Store the top-up request
            const response = await axios.post('http://localhost:8000/api/topup-requests/', {
                username,
                name: formData.name,
                phone: formData.phone,
                amount: parseFloat(formData.amount)
            });

            console.log("Top-up request response:", response.data);

            // Show loading animation for 2 seconds and fetch UPI details
            await new Promise(resolve => setTimeout(resolve, 2000));
            await fetchUPIDetails();
            setTimeLeft(120); // Reset timer to 2 minutes
            setShowUPIDetails(true);
        } catch (error) {
            console.error('Top-up request error:', error);
            let errorMessage = 'Failed to process request. Please try again.';
            
            if (error.response) {
                console.error('Error response:', error.response);
                errorMessage = error.response.data?.detail || errorMessage;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            className="topup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="topup-header">
                <h1>Top Up Balance</h1>
                <button className="back-btn" onClick={() => navigate('/welcome')}>
                    Back to Home
                </button>
            </div>

            <div className="topup-content">
                <div className="topup-form-container">
                    <h2>Enter Your Details</h2>
                    <form onSubmit={handleSubmit} className="topup-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                                className={validationErrors.name ? 'error' : ''}
                            />
                            {validationErrors.name && (
                                <span className="validation-error">{validationErrors.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="Enter your phone number"
                                className={validationErrors.phone ? 'error' : ''}
                            />
                            {validationErrors.phone && (
                                <span className="validation-error">{validationErrors.phone}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">Amount (₹)</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="100"
                                placeholder="Enter amount to top up"
                                className={validationErrors.amount ? 'error' : ''}
                            />
                            {validationErrors.amount && (
                                <span className="validation-error">{validationErrors.amount}</span>
                            )}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <motion.button
                            type="submit"
                            className="submit-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                'Top Up Now'
                            )}
                        </motion.button>
                    </form>
                </div>

                <AnimatePresence>
                    {showUPIDetails && upiDetails && (
                        <motion.div 
                            className="upi-details-slider"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                        >
                            <div className="upi-details-content">
                                <h2>UPI Payment Details</h2>
                                <div className="countdown-timer">
                                    <div className="timer-circle">
                                        <span>{formatTime(timeLeft)}</span>
                                    </div>
                                    <p>This window will close automatically</p>
                                </div>
                                <div className="upi-info-card">
                                    <div className="upi-info-item">
                                        <span className="upi-label">Phone Number:</span>
                                        <span className="upi-value">{upiDetails.phone_number}</span>
                                    </div>
                                    <div className="upi-info-item">
                                        <span className="upi-label">UPI ID:</span>
                                        <span className="upi-value">{upiDetails.upi_code}</span>
                                    </div>
                                    <div className="upi-qr-container">
                                        <div className="qr-image-wrapper">
                                            <img 
                                                src={`http://localhost:8000${upiDetails.qr_image_path}`}
                                                alt="UPI QR Code" 
                                                className="upi-qr-code"
                                                onError={(e) => {
                                                    console.error("Error loading QR image:", e);
                                                    e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=example@upi&pn=Example&am=100";
                                                }}
                                            />
                                        </div>
                                        <p className="upi-instructions">
                                            <strong>Scan this QR code using any UPI payment app to complete your payment</strong>
                                        </p>
                                        <p className="upi-instructions">
                                            Amount: ₹{formData.amount} | Phone: {upiDetails.phone_number}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TopUp; 