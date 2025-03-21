import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import axios from 'axios';
import './MineMyst.css';

// Sound effects
const SOUNDS = {
    CLICK: new Audio('/sounds/click.mp3'),
    WIN: new Audio('/sounds/win.mp3'),
    LOSE: new Audio('/sounds/lose.mp3'),
    HOVER: new Audio('/sounds/hover.mp3'),
    TILE_FLIP: new Audio('/sounds/card-flip.mp3'),
    BOOM: new Audio('/sounds/explosion.mp3'), // Ensure this file exists
    TIMER: new Audio('/sounds/tick.mp3') // Timer tick sound
};

// Styled components
const GameWrapper = styled.div`
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    padding-top: 40px; /* Added padding at top */
    margin-top: 30px; /* Added margin at top for extra spacing */
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    min-height: 100vh;
`;

const GameTitle = styled(motion.h1)`
    color: #ffffff;
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 20px;
    margin-top: 20px; /* Added margin-top for spacing */
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
`;

const GameDescription = styled.p`
    font-size: 1.2rem;
    max-width: 800px;
    text-align: center;
    margin-bottom: 2rem;
    color: #DDD;
`;

const GameBoard = styled(motion.div)`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-width: 500px;
    width: 100%;
    margin: 20px auto;

    @media (min-width: 768px) {
        gap: 15px;
    }
`;

const ControlPanel = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 15px;
    border: 1px solid rgba(255, 215, 0, 0.3);
    position: relative;
`;

const BackButton = styled(motion.button)`
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(30, 33, 37, 0.8);
    color: #FFD700;
    border: 1px solid #FFD700;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.9rem;
    cursor: pointer;
    z-index: 100;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(50, 53, 60, 0.9);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
    }
`;

const HomeButton = styled(motion.button)`
    background: linear-gradient(145deg, #FFD700, #FFA500);
    color: #121212;
    font-weight: bold;
    border: none;
    border-radius: 30px;
    padding: 10px 25px;
    cursor: pointer;
    font-size: 1rem;
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
    position: relative;
    overflow: hidden;
    margin-bottom: 15px;
    animation: floatButton 3s ease-in-out infinite;
    align-self: center;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 215, 0, 0.5);
    }
    
    &:active {
        transform: translateY(1px);
        box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
`;

const BetInput = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
`;

const StyledInput = styled.input`
    background: #000;
    color: #FFF;
    padding: 10px;
    border: 2px solid #FFD700;
    border-radius: 5px;
    font-size: 1.2rem;
    width: 100px;
    text-align: center;
    margin: 0 10px;
`;

const BetButton = styled(motion.button)`
    background: linear-gradient(45deg, #43a047, #2e7d32);
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    font-weight: bold;
`;

const ResetButton = styled(motion.button)`
    background: linear-gradient(45deg, #e53935, #c62828);
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    font-weight: bold;
`;

const PresetButton = styled(motion.button)`
    background: rgba(255, 215, 0, 0.2);
    color: #FFD700;
    border: 1px solid #FFD700;
    padding: 8px 15px;
    margin: 0 5px;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
        background: #FFD700;
        color: #000;
    }
`;

const TimerDisplay = styled(motion.div)`
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: ${props => props.seconds <= 10 ? '#e53935' : '#FFD700'};
    border: 2px solid ${props => props.seconds <= 10 ? '#e53935' : '#FFD700'};
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 10;
`;

const TransactionTable = styled.table`
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    border-collapse: collapse;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    overflow: hidden;
`;

const TransactionRow = styled.tr`
    &:nth-child(even) { background: rgba(255, 255, 255, 0.05); }
`;

const TransactionCell = styled.td`
    padding: 10px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`;

// Mine Animation Component (Intro Animation)
const MineIntroAnimation = () => {
    return (
        <motion.div
            className="mine-intro-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div className="mine-container">
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="mine"
                        initial={{ 
                            y: Math.random() * -100 - 100,
                            x: Math.random() * window.innerWidth,
                            rotate: Math.random() * 360
                        }}
                        animate={{ 
                            y: window.innerHeight + 100,
                            rotate: Math.random() * 720
                        }}
                        transition={{ 
                            duration: 2 + Math.random() * 3,
                            delay: Math.random() * 2,
                            ease: "easeIn"
                        }}
                    >
                        {i % 2 === 0 ? '💣' : '💎'}
                    </motion.div>
                ))}
            </motion.div>
            <motion.h2
                className="intro-text"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
            >
                Welcome to Mine Myst!
            </motion.h2>
        </motion.div>
    );
};

// Block variants for animations
const blockVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: i => ({
        scale: 1,
        opacity: 1,
        transition: {
            delay: i * 0.05,
            duration: 0.3,
        }
    }),
    selected: { 
        scale: 1.05,
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        borderColor: '#FFD700',
    },
    safe: { 
        backgroundColor: '#43a047',
        borderColor: '#2e7d32',
        scale: 1.05,
    },
    bomb: { 
        backgroundColor: '#c62828',
        borderColor: '#b71c1c',
        scale: [1, 1.2, 0.9],
        rotate: [0, 10, -10, 0],
        transition: { duration: 0.5 }
    }
};

// Confetti component for winning animation
const Confetti = () => {
    const [particles, setParticles] = useState([]);
    
    useEffect(() => {
        // Create confetti particles
        const colors = ['#FFD700', '#FF8C00', '#FF4500', '#FF0000', '#32CD32', '#00BFFF', '#8A2BE2', '#FF69B4'];
        const newParticles = [];
        
        for (let i = 0; i < 150; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100, // random position across screen width
                y: -10, // start above screen
                size: Math.random() * 8 + 4, // random size between 4-12px
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.random() * 2 - 1, // random X velocity
                speedY: Math.random() * 5 + 2, // random Y velocity
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
        
        setParticles(newParticles);
        
        // Remove particles after animation completes
        const timer = setTimeout(() => {
            setParticles([]);
        }, 6000);
        
        return () => clearTimeout(timer);
    }, []);
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {particles.map(particle => (
                <motion.div
                    key={particle.id}
                    style={{
                        position: 'absolute',
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        backgroundColor: particle.color,
                        borderRadius: '2px',
                        zIndex: 1000
                    }}
                    initial={{ y: -10, x: `${particle.x}%`, rotate: particle.rotation }}
                    animate={{
                        y: ['0%', '100%'],
                        x: [`${particle.x}%`, `${particle.x + particle.speedX * 20}%`],
                        rotate: [particle.rotation, particle.rotation + particle.rotationSpeed * 30]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 3,
                        ease: "easeOut",
                        times: [0, 1]
                    }}
                />
            ))}
        </div>
    );
};

// Explosion Animation Component
const ExplosionAnimation = ({ position }) => {
    return (
        <motion.div
            className="explosion"
            style={{
                position: 'absolute',
                top: position.y,
                left: position.x,
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,165,0,1) 0%, rgba(255,0,0,1) 50%, rgba(0,0,0,1) 100%)',
                zIndex: 1000,
                pointerEvents: 'none'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
                scale: [0, 3, 0.5], 
                opacity: [0, 1, 0] 
            }}
            transition={{ duration: 0.7 }}
        />
    );
};

// Play hover sound
const playHoverSound = () => {
    if (SOUNDS.HOVER) {
        SOUNDS.HOVER.volume = 0.3;
        SOUNDS.HOVER.currentTime = 0;
        SOUNDS.HOVER.play().catch(e => console.log("Sound play error:", e));
    }
};

const MineMyst = () => {
    const navigate = useNavigate();
    const { balance, updateBalance, username } = useGameStore();
    const [betAmount, setBetAmount] = useState('10');
    const [selectedBlocks, setSelectedBlocks] = useState([]);
    const [gameResult, setGameResult] = useState(null);
    const [gameState, setGameState] = useState('intro'); // intro, idle, playing, won, lost
    const [bombPositions, setBombPositions] = useState([]);
    const [safeBlocks, setSafeBlocks] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [explosionPosition, setExplosionPosition] = useState({ x: 0, y: 0 });
    const [showExplosion, setShowExplosion] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [timerActive, setTimerActive] = useState(false);
    const [gemsFound, setGemsFound] = useState(0);
    const [transactions, setTransactions] = useState([]);

    const blockRefs = useRef([]);
    blockRefs.current = Array(16).fill().map((_, i) => blockRefs.current[i] || React.createRef());

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (timerActive) {
            interval = setInterval(() => {
                setTimer(prevTimer => {
                    // Play tick sound when time is running low
                    if (prevTimer <= 10 && prevTimer > 0 && SOUNDS.TIMER) {
                        SOUNDS.TIMER.volume = 0.3;
                        SOUNDS.TIMER.currentTime = 0;
                        SOUNDS.TIMER.play().catch(e => console.log("Sound play error:", e));
                    }
                    
                    // Time's up
                    if (prevTimer <= 1) {
                        setTimerActive(false);
                        if (gameState === 'playing') {
                            handleTimeUp();
                        }
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        } else if (!timerActive && timer !== 60) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive, timer, gameState]);

    // Intro animation effect
    useEffect(() => {
        // Auto transition from intro to idle after 3.5 seconds
        if (gameState === 'intro') {
            const timer = setTimeout(() => {
                setGameState('idle');
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Handle time up - lose the game
    const handleTimeUp = () => {
        if (SOUNDS.LOSE) {
            SOUNDS.LOSE.volume = 1;
            SOUNDS.LOSE.currentTime = 0;
            SOUNDS.LOSE.play().catch(e => console.log("Sound play error:", e));
        }
        
        setGameState('lost');
        setGameResult("Time's up! You lost your bet of " + betAmount);
        
        // Show all bombs
        const allBlocks = Array.from({ length: 16 }, (_, i) => i);
        const remainingBlocks = allBlocks.filter(block => !selectedBlocks.includes(block));
        
        // Randomly select 8 blocks to be bombs
        const randomBombs = [];
        while (randomBombs.length < 8) {
            const randomIndex = Math.floor(Math.random() * remainingBlocks.length);
            const block = remainingBlocks[randomIndex];
            if (!randomBombs.includes(block)) {
                randomBombs.push(block);
            }
        }
        
        setBombPositions(randomBombs);
        setSafeBlocks(allBlocks.filter(block => !randomBombs.includes(block)));
        
        // Update balance from server
        updateBalanceAfterBet();
    };

    // Handle navigation to welcome page
    const handleBackClick = () => {
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.7;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
        
        // Reset timer if active
        if (timerActive) {
            setTimerActive(false);
        }
        
        // Add slight delay for sound to play
        setTimeout(() => navigate('/welcome'), 100);
    };

    // Handle bet amount change
    const handleBetChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setBetAmount(value);
        }
    };
    
    // Handle preset bet amount selection
    const handlePresetBet = (amount) => {
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.5;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
        setBetAmount(amount.toString());
    };

    // Handle clicking on a block
    const handleBlockClick = (index) => {
        // Prevent actions when game is not in playing state or block is already selected
        if (gameState !== 'playing' || selectedBlocks.includes(index)) {
            return;
        }

        // Play flip sound
        if (SOUNDS.TILE_FLIP) {
            SOUNDS.TILE_FLIP.volume = 0.7;
            SOUNDS.TILE_FLIP.currentTime = 0;
            SOUNDS.TILE_FLIP.play().catch(e => console.log("Sound play error:", e));
        }

        // Add block to selected blocks
        setSelectedBlocks(prev => [...prev, index]);

        // Check if this block is a bomb (used for animation)
        if (bombPositions.includes(index)) {
            if (SOUNDS.BOOM) {
                SOUNDS.BOOM.volume = 0.7;
                SOUNDS.BOOM.currentTime = 0;
                SOUNDS.BOOM.play().catch(e => console.log("Sound play error:", e));
            }

            // Get position for explosion animation
            if (blockRefs.current[index] && blockRefs.current[index].current) {
                const rect = blockRefs.current[index].current.getBoundingClientRect();
                setExplosionPosition({ 
                    x: rect.left + rect.width/2 - 50, // Center the explosion
                    y: rect.top + rect.height/2 - 50
                });
                setShowExplosion(true);
                
                // Hide explosion after animation completes
                setTimeout(() => setShowExplosion(false), 700);
            }
        }
    };

    // Start a new game
    const startGame = async () => {
        if (!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance) {
            alert('Please enter a valid bet amount within your balance.');
            return;
        }
        SOUNDS.CLICK.play().catch(e => console.log("Sound error:", e));
        setSelectedBlocks([]);
        setGameResult(null);
        setGameState('playing');
        setBombPositions([]);
        setSafeBlocks([]);
        setShowConfetti(false);
        setTimer(60);
        setTimerActive(true);
        setGemsFound(0);
        // Don’t update balance locally—rely on server
        console.log(`Game started with bet: ${betAmount}`);
    };

    // Submit selected blocks to backend
    const submitBlocks = async () => {
        if (selectedBlocks.length === 0 || gameState !== 'playing') return;
        setIsLoading(true);
        const blockIndices = selectedBlocks.map(index => index); // 0-indexed now matches backend
        try {
            const response = await axios.post('http://localhost:8000/play_mines/', {
                player_name: username,
                bet_amount: parseFloat(betAmount),
                blocks: blockIndices
            });
            console.log('Server response:', response.data);
            setGameResult(response.data.message); // Use "message" from backend
    
            if (response.data.message.includes('bomb')) {
                SOUNDS.LOSE.play().catch(e => console.log("Sound error:", e));
                SOUNDS.BOOM.play().catch(e => console.log("Sound error:", e));
                setGameState('lost');
                setTimerActive(false);
                setBombPositions(selectedBlocks); // Show all selected as bombs for effect
                triggerExplosion(selectedBlocks[selectedBlocks.length - 1]);
            } else if (response.data.message.includes('Won')) {
                SOUNDS.WIN.play().catch(e => console.log("Sound error:", e));
                setGameState('won');
                setTimerActive(false);
                setShowConfetti(true);
                setSafeBlocks(selectedBlocks);
                setBombPositions(Array.from({ length: 16 }, (_, i) => i).filter(i => !selectedBlocks.includes(i)));
            } else {
                setGameResult(response.data.message);
            }
            await updateBalanceAfterBet(); // Sync balance
            const txResponse = await axios.get('http://localhost:8000/mines/transactions', { params: { username } });
            setTransactions(txResponse.data);
        } catch (error) {
            console.error('Error submitting blocks:', error);
            setGameResult(error.response?.data?.detail || "Failed to submit move.");
            setGameState('lost');
            setTimerActive(false);
            setBombPositions(selectedBlocks);
            triggerExplosion(selectedBlocks[selectedBlocks.length - 1]);
            await updateBalanceAfterBet();
        } finally {
            setIsLoading(false);
        }
    };

    // Reset the game state
    const resetGame = () => {
        setSelectedBlocks([]);
        setGameResult(null);
        setGameState('idle');
        setBombPositions([]);
        setSafeBlocks([]);
        setShowConfetti(false);
        setTimerActive(false);
        setTimer(60);
        setGemsFound(0); // Reset gems found counter
        
        // Play click sound
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.7;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
    };

    // Submit blocks when selectedBlocks changes
    useEffect(() => {
        if (selectedBlocks.length > 0 && gameState === 'playing') {
            submitBlocks();
        }
    }, [selectedBlocks]);

    // Fetch initial balance when component mounts
    useEffect(() => {
        updateBalanceAfterBet();
    }, []);

    // Add a function to handle home navigation
    const handleGoHome = () => {
        navigate('/welcome');
    };

    const updateBalanceAfterBet = async () => {
        try {
            const response = await axios.get('http://localhost:8000/user/balance', {
                params: { username }
            });
            updateBalance(response.data.balance);
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    };

    return (
        <div className="shuffle-container">
            {/* Back to Home button remains at top left */}
            <BackButton 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/welcome')}
            >
                Back to Home
            </BackButton>
            
            <GameWrapper>
                {/* New "Go Home" button centered above title */}
                <HomeButton
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleGoHome}
                >
                    Go Home
                </HomeButton>
                
                <GameTitle>Mine Myst</GameTitle>
                
                {/* Intro Animation */}
                <AnimatePresence>
                    {gameState === 'intro' && (
                        <motion.div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0,0,0,0.9)',
                                zIndex: 1000
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <MineIntroAnimation />
                        </motion.div>
                    )}
                </AnimatePresence>

                {gameState !== 'intro' && (
                    <>
                        <GameDescription>
                        Pick your tiles wisely among 16 hidden spots—avoid the 8 lurking bombs 💥 to win big! 💰✨
                        Can you survive the blast? 🚀🔥
                        </GameDescription>

                        <ControlPanel>
                            {/* Timer Display */}
                            {timerActive && (
                                <TimerDisplay 
                                    seconds={timer}
                                    animate={{ 
                                        scale: timer <= 10 ? [1, 1.1, 1] : 1,
                                        transition: { 
                                            repeat: timer <= 10 ? Infinity : 0, 
                                            duration: 0.5 
                                        }
                                    }}
                                >
                                    {timer}
                                </TimerDisplay>
                            )}
                        
                            <h3>Your Balance: ${parseFloat(balance).toFixed(2)}</h3>
                            
                            {/* Display gems found during active gameplay */}
                            {gameState === 'playing' && gemsFound > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="gem-counter"
                                >
                                    <span className="gem-counter-icon">💎</span>
                                    <span>{gemsFound} Gem{gemsFound > 1 ? 's' : ''} Found</span>
                                </motion.div>
                            )}
                            
                            <BetInput>
                                <label htmlFor="bet-amount">Bet Amount:</label>
                                <StyledInput
                                    id="bet-amount"
                                    type="text"
                                    value={betAmount}
                                    onChange={handleBetChange}
                                    disabled={gameState === 'playing'}
                                />
                            </BetInput>
                            
                            {/* Preset bet amount buttons */}
                            {gameState === 'idle' && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                                    {[10, 20, 40, 50].map(amount => (
                                        <PresetButton
                                            key={amount}
                                            onClick={() => handlePresetBet(amount)}
                                            onMouseEnter={playHoverSound}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={parseInt(betAmount) === amount ? 'active' : ''}
                                        >
                                            {amount}
                                        </PresetButton>
                                    ))}
                                </div>
                            )}

                            {gameState === 'idle' ? (
                                <BetButton 
                                    onClick={startGame}
                                    onMouseEnter={playHoverSound}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance}
                                >
                                    Bet Now
                                </BetButton>
                            ) : (
                                <ResetButton 
                                    onClick={resetGame}
                                    onMouseEnter={playHoverSound}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Reset Game
                                </ResetButton>
                            )}

                            {gameResult && (
                                <motion.div
                                    className="game-result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {gameState === 'playing' ? (
                                        <h3 className="result-win">
                                            {gemsFound > 0 ? `💎 Gem Found! 💎` : 'Keep Playing!'}
                                        </h3>
                                    ) : (
                                        <h3 className={gameState === 'won' ? 'result-win' : 'result-lose'}>
                                            {gameState === 'won' ? '🎉 You Won! 🎉' : '💣 Boom! You Lost! 💣'}
                                        </h3>
                                    )}
                                    <p>{gameResult}</p>
                                </motion.div>
                            )}
                        </ControlPanel>

                        {(gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
                            <GameBoard
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { 
                                        opacity: 1,
                                        transition: { 
                                            staggerChildren: 0.05,
                                            delayChildren: 0.3
                                        }
                                    }
                                }}
                            >
                                {Array.from({ length: 16 }, (_, i) => (
                                    <motion.div
                                        key={i}
                                        ref={blockRefs.current[i]}
                                        className={`game-block ${
                                            selectedBlocks.includes(i) 
                                                ? bombPositions.includes(i) 
                                                    ? 'bomb' 
                                                    : 'safe'
                                                : ''
                                        } ${
                                            gameState === 'won' && safeBlocks.includes(i) 
                                                ? 'safe' 
                                                : gameState === 'lost' && bombPositions.includes(i) 
                                                    ? 'bomb' 
                                                    : ''
                                        }`}
                                        custom={i}
                                        variants={blockVariants}
                                        whileHover={gameState === 'playing' && !selectedBlocks.includes(i) ? { scale: 1.05 } : {}}
                                        whileTap={gameState === 'playing' && !selectedBlocks.includes(i) ? { scale: 0.95 } : {}}
                                        onClick={() => handleBlockClick(i)}
                                        onMouseEnter={playHoverSound}
                                        animate={
                                            selectedBlocks.includes(i) 
                                                ? bombPositions.includes(i) 
                                                    ? 'bomb' 
                                                    : 'safe'
                                                : 'visible'
                                        }
                                    >
                                        {selectedBlocks.includes(i) && (
                                            <motion.div
                                                className="block-content"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {bombPositions.includes(i) ? '💣' : '💎'}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </GameBoard>
                        )}

                        {showConfetti && <Confetti />}
                        {showExplosion && <ExplosionAnimation position={explosionPosition} />}

                        {isLoading && (
                            <div className="loading-overlay">
                                <div className="spinner"></div>
                                <p>Processing your move...</p>
                            </div>
                        )}

                        {transactions.length > 0 && (
                            <TransactionTable>
                                <thead>
                                    <tr>
                                        <th>Bet</th>
                                        <th>Result</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <TransactionRow key={tx.id}>
                                            <TransactionCell>${tx.bet_amount.toFixed(2)}</TransactionCell>
                                            <TransactionCell>{tx.user_profit > 0 ? `Won $${tx.user_profit.toFixed(2)}` : `Lost $${tx.user_loss.toFixed(2)}`}</TransactionCell>
                                            <TransactionCell>{new Date(tx.created_at).toLocaleTimeString()}</TransactionCell>
                                        </TransactionRow>
                                    ))}
                                </tbody>
                            </TransactionTable>
                        )}
                    </>
                )}
            </GameWrapper>
        </div>
    );
};

export default MineMyst;
