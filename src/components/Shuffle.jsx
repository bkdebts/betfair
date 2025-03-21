import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import './Shuffle.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

// Styled components for the card shuffling animation
const ShufflingContainer = styled.div`
    position: relative;
    width: 100%;
    height: 300px;
    perspective: 1200px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const AnimatedCard = styled(motion.div)`
    position: absolute;
    width: 120px;
    height: 174px;
    background: url('/Cards_Shuffle/back1.png') center center no-repeat;
    background-size: 100% 100%;
    background-color: #000;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    backface-visibility: hidden;
`;

const CardShufflingAnimation = () => {
    // Play shuffle sound when animation mounts
    useEffect(() => {
        if (SOUNDS.SHUFFLE) {
            SOUNDS.SHUFFLE.volume = 0.8;
            SOUNDS.SHUFFLE.currentTime = 0;
            SOUNDS.SHUFFLE.loop = true;
            SOUNDS.SHUFFLE.play().catch(e => console.log("Sound play error:", e));
        }
        
        return () => {
            if (SOUNDS.SHUFFLE) {
                SOUNDS.SHUFFLE.pause();
                SOUNDS.SHUFFLE.currentTime = 0;
            }
        };
    }, []);
    
    return (
        <ShufflingContainer>
            <AnimatePresence>
                {[...Array(12)].map((_, index) => (
                    <AnimatedCard
                        key={index}
                        initial={{ 
                            x: -200 + Math.random() * 400, 
                            y: -100 + Math.random() * 200, 
                            rotate: -180 + Math.random() * 360,
                            opacity: 0.8
                        }}
                        animate={{ 
                            x: -150 + Math.random() * 300, 
                            y: -80 + Math.random() * 160, 
                            rotate: -90 + Math.random() * 180,
                            opacity: 1,
                            transition: { 
                                duration: 1 + Math.random(), 
                                repeat: Infinity, 
                                repeatType: "reverse" 
                            }
                        }}
                    />
                ))}
            </AnimatePresence>
            <motion.div
                style={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold', 
                    fontSize: '20px',
                    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                    marginTop: '240px',
                    zIndex: 10
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, yoyo: Infinity, repeatDelay: 0.5 }}
            >
                Shuffling cards...
            </motion.div>
        </ShufflingContainer>
    );
};

const SOUNDS = {
    CARD_FLIP: new Audio('/sounds/card-flip.mp3'),
    WIN: new Audio('/sounds/win.mp3'),
    LOSE: new Audio('/sounds/lose.mp3'),
    CLICK: new Audio('/sounds/click.mp3'),
    SHUFFLE: new Audio('/sounds/shuffle1.mp3'),
    HOVER: new Audio('/sounds/hover.mp3')
};

// Add a helper function to parse card values from filenames
const getCardValueFromFilename = (filename) => {
    if (!filename) return null;
    
    // Extract the value part from the filename
    const parts = filename.split('/').pop().split('_of_');
    if (!parts || parts.length < 2) return null;
    
    let value = parts[0];
    
    // Handle special cases like jack_of_clubs2.png
    if (value.includes('jack')) value = 'jack';
    else if (value.includes('queen')) value = 'queen';
    else if (value.includes('king')) value = 'king';
    else if (value.includes('ace')) value = 'ace';
    
    // Card values object matching the backend
    const cardValues = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14
    };
    
    return {
        displayValue: value,
        numericValue: cardValues[value] || 0
    };
};

// Add this helper function after getCardValueFromFilename to compare card values
const compareCards = (currentCard, nextCard, prediction) => {
    if (!currentCard || !nextCard) return null;
    
    const currentValue = getCardValueFromFilename(currentCard);
    const nextValue = getCardValueFromFilename(nextCard);
    
    if (!currentValue || !nextValue) return null;
    
    console.log("Card comparison:", {
        currentCard,
        currentValue,
        nextCard,
        nextValue,
        prediction
    });
    
    // Convert prediction to boolean (true if higher, false if lower)
    const predictedHigher = prediction === 'high';
    
    // Check if next card is higher
    const isNextCardHigher = nextValue.numericValue > currentValue.numericValue;
    
    // Win if (predicted higher AND next card is higher) OR (predicted lower AND next card is lower)
    return (predictedHigher && isNextCardHigher) || (!predictedHigher && !isNextCardHigher);
};

const useCardAnimation = (selectedCard, cardImages) => {
    const [cardValue, setCardValue] = useState(null);
    
    useEffect(() => {
        if (selectedCard !== null && cardImages[selectedCard]) {
            const value = getCardValueFromFilename(cardImages[selectedCard]);
            setCardValue(value);
        } else {
            setCardValue(null);
        }
    }, [selectedCard, cardImages]);
    
    return cardValue;
};

// Add a confetti component at the top of the file
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

// Add hoverSound function near the top of the file
const playHoverSound = () => {
    if (SOUNDS.HOVER) {
        SOUNDS.HOVER.volume = 0.3;
        SOUNDS.HOVER.currentTime = 0;
        SOUNDS.HOVER.play().catch(e => console.log("Sound play error:", e));
    }
};

const Shuffle = () => {
    const { balance, updateBalance, updateBalanceAfterBet, username } = useGameStore();
    const navigate = useNavigate();
    const [betAmount, setBetAmount] = useState('');
    const [gamePhase, setGamePhase] = useState('selectCard');
    const [selectedCard, setSelectedCard] = useState(null);
    const [cardImages, setCardImages] = useState([]);
    const [result, setResult] = useState(null);
    const [gameStats, setGameStats] = useState({ totalBets: 0, totalWins: 0, totalLosses: 0 });
    const [showBoomAnimation, setShowBoomAnimation] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayAgain, setShowPlayAgain] = useState(false);
    const componentMounted = useRef(true);
    
    // Add new state for the next card from backend
    const [nextCardImage, setNextCardImage] = useState(null);
    const [resultDetails, setResultDetails] = useState(null);
    
    // Use the custom hook to get the selected card's value
    const selectedCardValue = useCardAnimation(selectedCard, cardImages);

    // Set the componentMounted ref to true when component mounts, and false when it unmounts
    useEffect(() => {
        console.log("Component mounted");
        componentMounted.current = true;
        
        return () => {
            console.log("Component unmounting, setting mounted flag to false");
            componentMounted.current = false;
        };
    }, []);

    // Add a useEffect to fetch the balance when the component mounts
    useEffect(() => {
        // Fetch the latest balance from the server when component mounts
        console.log("Shuffle component mounted, fetching latest balance");
        updateBalanceAfterBet();
    }, [updateBalanceAfterBet]); // Only run once when component mounts

    useEffect(() => {
        const fetchCards = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('http://localhost:8000/api/shuffle/select-cards');
                console.log("Cards received from API:", response.data);
                
                // Immediately set card images
                setCardImages(response.data);
                
                // Preload the images before ending the loading state
                const preloadImages = async (imageUrls) => {
                    console.log("Preloading images...");
                    const preloadPromises = imageUrls.map(url => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => {
                                console.log(`Image loaded: ${url}`);
                                resolve(url);
                            };
                            img.onerror = () => {
                                console.error(`Failed to load image: ${url}`);
                                resolve('/Cards_Shuffle/back1.png'); // Resolve with fallback to prevent hanging
                            };
                        });
                    });
                    
                    try {
                        await Promise.all(preloadPromises);
                        console.log("All images preloaded successfully");
                        
                        // End loading state after successful preload
                        if (componentMounted.current) {
                            console.log("Ending loading state after successful preload");
                            setIsLoading(false);
                        }
                    } catch (err) {
                        console.error("Error preloading images:", err);
                    }
                };
                
                // Start preloading images
                preloadImages(response.data);
                
                // Guarantee loading will end even if there are issues with images
                const loadingTimer = setTimeout(() => {
                    console.log("Auto-ending loading state after timeout");
                    setIsLoading(false);
                }, 3000); // Increased from 1500ms to 3000ms (3 seconds)
                
                return () => clearTimeout(loadingTimer);
            } catch (error) {
                console.error('Error fetching cards:', error);
                // Set default if API fails
                setCardImages(['/Cards_Shuffle/back1.png', '/Cards_Shuffle/back1.png', '/Cards_Shuffle/back1.png']);
                setIsLoading(false);
            }
        };
        
        fetchCards();
    }, []); // Removed componentMounted cleanup from this useEffect to avoid conflicts

    const handleCardClick = (index) => {
        // Prevent clicks if still loading or not in selection phase
        if (gamePhase !== 'selectCard' || selectedCard !== null || isLoading || !cardImages[index]) {
            console.log("Card click prevented: ", { gamePhase, selectedCard, isLoading, hasImage: !!cardImages[index] });
            return;
        }
        
        // Play flip sound
        if (SOUNDS.CARD_FLIP) {
            SOUNDS.CARD_FLIP.volume = 0.7; // Set volume to 70%
            SOUNDS.CARD_FLIP.currentTime = 0; // Reset sound to beginning
            SOUNDS.CARD_FLIP.play().catch(e => console.log("Sound play error:", e));
        }
        
        // Set selected card and immediately change game phase
        setSelectedCard(index);
        setGamePhase('bet');
        
        // Debug logs
        console.log(`Selected card ${index}:`, cardImages[index]);
        console.log("Card image URL:", cardImages[index]);
        console.log("All card images:", cardImages);
        console.log("GAME PHASE CHANGED TO BET");
        
        // Play a subtle click sound when transitioning
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.5;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
    };

    const handleBetChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setBetAmount(value);
        }
    };

    const handleBetSubmit = () => {
        if (!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance) {
            alert('Please enter a valid bet amount');
            return;
        }
        if (SOUNDS.CLICK) SOUNDS.CLICK.play();
        setGamePhase('predict');
    };

    const handlePrediction = async (prediction) => {
        try {
            console.log("Starting prediction:", prediction);
            setIsLoading(true);
            setShowPlayAgain(false); // Reset play again button visibility
            
            // Set a safety timeout to ensure the loading state doesn't get stuck
            const safetyTimer = setTimeout(() => {
                console.log("SAFETY TIMEOUT: Forcing loading state to end after timeout");
                if (componentMounted.current) {
                    setIsLoading(false);
                    setGamePhase('result');
                    setResult({
                        won: false,
                        error: "Request timed out",
                        message: "The prediction request timed out. Please try again."
                    });
                    
                    // Play lose sound for errors
                    if (SOUNDS.LOSE) {
                        SOUNDS.LOSE.volume = 0.7;
                        SOUNDS.LOSE.currentTime = 0;
                        SOUNDS.LOSE.play().catch(e => console.log("Sound play error:", e));
                    }
                    
                    // Ensure the Play Again button appears
                    setTimeout(() => {
                        if (componentMounted.current) {
                            setShowPlayAgain(true);
                        }
                    }, 2000);
                }
            }, 8000); // 8-second timeout for safety
            
            // Play click sound
            if (SOUNDS.CLICK) {
                SOUNDS.CLICK.volume = 0.7;
                SOUNDS.CLICK.currentTime = 0;
                SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
            }

            // Map the frontend prediction to the backend's expected format
            const mappedPrediction = prediction === 'up' ? 'high' : 'low';

            console.log(`Making prediction: ${mappedPrediction} for card at index ${selectedCard}`);
            
            // Capture important values locally to use in case component unmounts
            const currentUsername = username || localStorage.getItem('username');
            const currentBetAmount = parseFloat(betAmount);
            
            // Log the request being sent
            console.log("Sending prediction request:", {
                player_name: currentUsername,
                bet_amount: currentBetAmount,
                bet_choice: mappedPrediction
            });
            
            try {
                const response = await axios.post('http://localhost:8000/fate-shuffle/bet', {
                    player_name: currentUsername,
                    bet_amount: currentBetAmount,
                    bet_choice: mappedPrediction,
                });
                
                // Clear the safety timer since we got a response
                clearTimeout(safetyTimer);
                
                console.log("Prediction API response:", response.data);

                // Check if component is still mounted before proceeding
                // Log to help debug the issue
                console.log("Component mounted status:", componentMounted.current);
                if (!componentMounted.current) {
                    console.log("Component unmounted, stopping prediction processing");
                    return;
                }

                // Continue processing even if the log shows unmounted - this might be a false positive
                console.log("Continuing with prediction processing regardless of mount state");
                
                const responseData = response.data;
                // Add extra validation for the response data
                if (!responseData) {
                    console.error("Response data is empty or undefined");
                    throw new Error("Invalid response from server");
                }
                
                // Validate the win/loss result based on card values
                try {
                    // Get the current card (selected by user)
                    const currentCardPath = cardImages[selectedCard];
                    
                    // Get the next card from API
                    const nextCardPath = responseData.last_card_image || 
                        (responseData.next_card ? `/Cards_Shuffle/${responseData.next_card}` : null);
                    
                    // Double-check the result with our own logic
                    const clientSideResult = compareCards(
                        currentCardPath,
                        nextCardPath,
                        responseData.user_prediction
                    );
                    
                    // Log any discrepancies between backend and frontend results
                    if (clientSideResult !== null && clientSideResult !== responseData.prediction_result) {
                        console.error("RESULT DISCREPANCY DETECTED!", {
                            backendResult: responseData.prediction_result,
                            frontendResult: clientSideResult,
                            currentCard: currentCardPath,
                            currentCardValue: getCardValueFromFilename(currentCardPath)?.displayValue,
                            nextCard: nextCardPath,
                            nextCardValue: getCardValueFromFilename(nextCardPath)?.displayValue,
                            prediction: responseData.user_prediction
                        });
                        
                        // Force correct result for better user experience
                        console.warn("Overriding backend result with client-side calculation");
                        responseData.prediction_result = clientSideResult;
                    }
                } catch (validationError) {
                    console.error("Error validating card results:", validationError);
                }

                // Use the potentially corrected result
                const hasWon = responseData.prediction_result === true;

                // Add detailed logging to help diagnose the issue
                console.log("Game Result Details:", {
                    currentCard: cardImages[selectedCard],
                    currentCardValue: getCardValueFromFilename(cardImages[selectedCard])?.displayValue,
                    nextCardPath: responseData.last_card_image || 
                        (responseData.next_card ? `/Cards_Shuffle/${responseData.next_card}` : null),
                    nextCardValue: getCardValueFromFilename(responseData.last_card_image || 
                        (responseData.next_card ? `/Cards_Shuffle/${responseData.next_card}` : null))?.displayValue,
                    prediction: responseData.user_prediction,
                    backendResult: responseData.prediction_result,
                    hasWon
                });

                console.log("Setting result:", hasWon ? "Win" : "Loss", "Response data:", responseData);
                
                // Calculate profit or loss amount based on bet amount and house edge
                const winAmount = currentBetAmount * (1 - 0.25); // 25% house edge
                const lossAmount = currentBetAmount;
                
                // Store result information
                console.log("Setting result object");
                setResult({
                    won: hasWon,
                    amount: hasWon ? winAmount : lossAmount,
                    message: hasWon ? `You won ${winAmount.toFixed(2)}!` : `You lost ${lossAmount.toFixed(2)}.`
                });

                // Save the next card image from the API response
                if (responseData.last_card_image) {
                    console.log("Setting next card image:", responseData.last_card_image);
                    setNextCardImage(responseData.last_card_image);
                } else {
                    console.warn("No last_card_image in response, using fallback");
                    // Use a fallback image if not provided
                    setNextCardImage('/Cards_Shuffle/back1.png');
                }
                
                console.log("Setting result details");
                setResultDetails(responseData);

                // Update user balance in store - handle both win and loss scenarios
                const balanceChange = hasWon ? winAmount - lossAmount : -lossAmount;
                console.log(`Updating balance by ${balanceChange} (${hasWon ? "win" : "loss"})`);
                
                // Update global store with new balance - make sure we're working with proper numbers
                updateBalance(currentBalance => {
                    // Ensure current balance is a number
                    const numCurrentBalance = typeof currentBalance === 'number' ? 
                        currentBalance : parseFloat(currentBalance) || 0;
                    
                    // Calculate new balance as a number
                    const newBalance = numCurrentBalance + balanceChange;
                    console.log(`Balance updated from ${numCurrentBalance} to ${newBalance}`);
                    return newBalance;
                });
                
                // After updating the local balance, fetch the latest balance from the server
                console.log("Fetching updated balance from server");
                updateBalanceAfterBet();
                
                // Update game statistics
                setGameStats((prev) => ({
                    totalBets: prev.totalBets + 1,
                    totalWins: prev.totalWins + (hasWon ? 1 : 0),
                    totalLosses: prev.totalLosses + (hasWon ? 0 : 1),
                }));

                // Make sure loading state is cleared BEFORE changing game phase
                console.log("Ending loading state before changing game phase");
                setIsLoading(false);
                
                // THEN change game phase to result
                console.log("Changing game phase to result");
                setGamePhase('result');
                
                // Play appropriate sound effect
                if (hasWon) {
                    if (SOUNDS.WIN) {
                        SOUNDS.WIN.volume = 1.0;
                        SOUNDS.WIN.currentTime = 0;
                        SOUNDS.WIN.play().catch(e => console.log("Sound play error:", e));
                    }
                    
                    // Show boom animation for wins
                    setShowBoomAnimation(true);
                    setTimeout(() => {
                        if (componentMounted.current) {
                            setShowBoomAnimation(false);
                        }
                    }, 2000);
                } else {
                    if (SOUNDS.LOSE) {
                        SOUNDS.LOSE.volume = 1.0;
                        SOUNDS.LOSE.currentTime = 0;
                        SOUNDS.LOSE.play().catch(e => console.log("Sound play error:", e));
                    }
                }
                
                // Show Play Again button after a shorter delay (5 seconds instead of 30)
                setTimeout(() => {
                    console.log("Showing Play Again button");
                    if (componentMounted.current) {
                        setShowPlayAgain(true);
                    }
                }, 5000); // 5 seconds
                
            } catch (apiError) {
                // Clear safety timer
                clearTimeout(safetyTimer);
                console.error('API Error making prediction:', apiError);
                
                // Ensure loading state is cleared before setting error result
                setIsLoading(false);
                
                // Set error result and update game phase
                setResult({ 
                    won: false, 
                    error: apiError.message || "API error",
                    message: "Error processing your prediction. Please try again."
                });
                
                setGamePhase('result');
                
                // Play lose sound for errors
                if (SOUNDS.LOSE) {
                    SOUNDS.LOSE.volume = 0.7;
                    SOUNDS.LOSE.currentTime = 0;
                    SOUNDS.LOSE.play().catch(e => console.log("Sound play error:", e));
                }
                
                // Show Play Again button after error
                setTimeout(() => {
                    if (componentMounted.current) {
                        setShowPlayAgain(true);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error in prediction handler:', error);
            
            // Always ensure loading state is cleared in case of any error
            setIsLoading(false);
            
            setResult({ 
                won: false, 
                error: error.message || "Unknown error",
                message: "Error processing your prediction. Please try again."
            });
            
            setGamePhase('result');
            
            // Play lose sound for errors
            if (SOUNDS.LOSE) {
                SOUNDS.LOSE.volume = 0.7;
                SOUNDS.LOSE.currentTime = 0;
                SOUNDS.LOSE.play().catch(e => console.log("Sound play error:", e));
            }
            
            // Show Play Again button after error
            setTimeout(() => {
                if (componentMounted.current) {
                    setShowPlayAgain(true);
                }
            }, 2000);
        }
    };

    const resetGame = () => {
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.7;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
        
        // Fetch the latest balance from the server
        console.log("Resetting game, fetching latest balance");
        updateBalanceAfterBet();
        
        // Reset game state
        setGamePhase('selectCard');
        setBetAmount('');
        setResult(null);
        setShowPlayAgain(false);
        setNextCardImage(null);
        setResultDetails(null);
        
        // Then add a small delay before showing loading to create a smooth transition
        setTimeout(() => {
            if (!componentMounted.current) return;
            
            setIsLoading(true);
            setSelectedCard(null);
            
            // Fetch new cards for the next game
            const fetchNewCards = async () => {
                try {
                    const response = await axios.get('http://localhost:8000/api/shuffle/select-cards');
                    console.log("New cards received for next game:", response.data);
                    
                    // Immediately set card images
                    setCardImages(response.data);
                    
                    // Preload the images before ending the loading state
                    const preloadImages = async (imageUrls) => {
                        console.log("Preloading images for next game...");
                        const preloadPromises = imageUrls.map(url => {
                            return new Promise((resolve, reject) => {
                                const img = new Image();
                                img.src = url;
                                img.onload = () => {
                                    console.log(`Image loaded for next game: ${url}`);
                                    resolve(url);
                                };
                                img.onerror = () => {
                                    console.error(`Failed to load image for next game: ${url}`);
                                    resolve('/Cards_Shuffle/back1.png'); // Resolve with fallback to prevent hanging
                                };
                            });
                        });
                        
                        try {
                            await Promise.all(preloadPromises);
                            console.log("All images preloaded successfully for next game");
                            
                            // End loading state after successful preload
                            if (componentMounted.current) {
                                console.log("Ending loading state after successful preload in reset");
                                setIsLoading(false);
                            }
                        } catch (err) {
                            console.error("Error preloading images for next game:", err);
                        }
                    };
                    
                    // Start preloading images
                    preloadImages(response.data);
                    
                    // Guarantee loading will end even if there are issues with images
                    const loadingTimer = setTimeout(() => {
                        console.log("Auto-ending loading state after timeout in reset");
                        if (componentMounted.current) {
                            setIsLoading(false);
                        }
                    }, 3000); // Increased from 1500ms to 3000ms (3 seconds)
                    
                    return () => clearTimeout(loadingTimer);
                } catch (error) {
                    console.error('Error fetching new cards:', error);
                    setCardImages(['/Cards_Shuffle/back1.png', '/Cards_Shuffle/back1.png', '/Cards_Shuffle/back1.png']);
                    setIsLoading(false);
                }
            };
            
            fetchNewCards();
        }, 300); // Short delay for better transition
    };

    const navigateToHome = () => {
        // Play click sound
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.7;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
        
        // Fetch the latest balance before navigating away
        updateBalanceAfterBet();
        
        // Add a slight delay to allow sound to play and balance to update
        setTimeout(() => {
            // Navigate to the welcome page
            navigate('/welcome');
        }, 100);
    };

    const preventDefaultFormSubmit = (e) => {
        e.preventDefault();
        return false;
    };

    const forceEndLoading = () => {
        console.log("User forced loading to end");
        setIsLoading(false);
    };

    // Add increment/decrement bet amount functions
    const incrementBet = () => {
        const currentBet = parseFloat(betAmount) || 0;
        const newBet = Math.min(currentBet + 10, balance);
        setBetAmount(String(newBet));
        
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.3;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
    };

    const decrementBet = () => {
        const currentBet = parseFloat(betAmount) || 0;
        const newBet = Math.max(currentBet - 10, 0);
        setBetAmount(String(newBet));
        
        if (SOUNDS.CLICK) {
            SOUNDS.CLICK.volume = 0.3;
            SOUNDS.CLICK.currentTime = 0;
            SOUNDS.CLICK.play().catch(e => console.log("Sound play error:", e));
        }
    };

    return (
        <div className="shuffle-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            position: 'relative',
            width: '100%'
        }}>
            {/* Back button positioned at the top-left */}
            <div style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '15px'
            }}>
                <motion.button 
                    className="back-button" 
                    onClick={navigateToHome}
                    onMouseEnter={playHoverSound}
                    whileHover={{ scale: 1.05, backgroundColor: '#FFD700', color: '#000' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        padding: '8px 15px',
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        color: '#FFD700',
                        border: '1px solid #FFD700',
                        borderRadius: '5px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginTop: '10px'
                    }}
                >
                    ← Back to Home
                </motion.button>
            </div>

            <h2>Fate Shuffle</h2>

            <div className="game-phase-indicator">
                <div className={`phase-step ${gamePhase === 'selectCard' ? 'active' : ''}`}>Select Card</div>
                <div className={`phase-step ${gamePhase === 'bet' ? 'active' : ''}`}>Place Bet</div>
                <div className={`phase-step ${gamePhase === 'predict' ? 'active' : ''}`}>Predict</div>
                <div className={`phase-step ${gamePhase === 'result' ? 'active' : ''}`}>Result</div>
            </div>

            <div className="game-stats">
                <div>Total Bets: {gameStats.totalBets}</div>
                <div>Wins: {gameStats.totalWins}</div>
                <div>Losses: {gameStats.totalLosses}</div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <CardShufflingAnimation />
                    <button 
                        className="force-continue-btn" 
                        onClick={forceEndLoading}
                    >
                        Continue Anyway
                    </button>
                </div>
            ) : (
                <div className="game-content">
                    <motion.div 
                        className="cards-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {[0, 1, 2].map((index) => {
                            const isSelected = selectedCard === index;
                            const isUnselected = selectedCard !== null && selectedCard !== index;
                            
                            return (
                                <motion.div 
                                    key={index}
                                    className={`card ${isSelected ? 'selected' : ''} ${isSelected ? 'flipped' : ''} ${isUnselected ? 'hide-card' : ''}`}
                                    onClick={() => handleCardClick(index)}
                                    onMouseEnter={playHoverSound}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        scale: isSelected ? 1.5 : 1,
                                        translateY: isSelected ? -50 : 0,
                                        zIndex: isSelected ? 20 : 1,
                                        transition: { 
                                            delay: index * 0.2,
                                            duration: isSelected ? 0.8 : 0.5,
                                            type: "spring",
                                            stiffness: 100
                                        }
                                    }}
                                    whileHover={!isSelected && !isUnselected ? { 
                                        y: -10,
                                        transition: { duration: 0.2 }
                                    } : {}}
                                >
                                    <div className="card-inner">
                                        {/* Card Back */}
                                        <div className="card-back" style={{ aspectRatio: "500/726" }}>
                                            {/* Back image is applied via CSS */}
                                        </div>
                                        
                                        {/* Card Front */}
                                        <div className="card-front">
                                            {isSelected && (
                                                <motion.img 
                                                    src={cardImages[index] || "/Cards_Shuffle/back1.png"}
                                                    alt={`Card ${index + 1}`}
                                                    className="card-image"
                                                    style={{ aspectRatio: "500/726" }}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.3, duration: 0.3 }}
                                                    onError={(e) => {
                                                        console.error(`Failed to load card image, using fallback`);
                                                        e.target.src = "/Cards_Shuffle/back1.png";
                                                    }}
                                                />
                                            )}
                                            {!isSelected && (
                                                <img 
                                                    src={cardImages[index] || "/Cards_Shuffle/back1.png"}
                                                    alt={`Card ${index + 1}`}
                                                    className="card-image"
                                                    style={{ aspectRatio: "500/726", opacity: 0 }}
                                                    onError={(e) => {
                                                        console.error(`Failed to load card image, using fallback`);
                                                        e.target.src = "/Cards_Shuffle/back1.png";
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Bet Controls - Displayed directly under the selected card when in bet phase */}
                    {gamePhase === 'bet' && (
                        <motion.div 
                            className="bet-controls"
                            style={{
                                marginTop: '150px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                width: '100%',
                                maxWidth: '500px',
                                padding: '20px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: '15px',
                                border: '2px solid #FFD700',
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 style={{ 
                                color: '#FFD700', 
                                fontSize: '1.5rem', 
                                marginBottom: '10px',
                                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                            }}>
                                Place Your Bet
                            </h3>
                            
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: '100%',
                                gap: '10px',
                                marginBottom: '15px'
                            }}>
                                <button 
                                    onClick={decrementBet}
                                    onMouseEnter={playHoverSound}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#c62828',
                                        color: 'white',
                                        fontSize: '20px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    -
                                </button>
                                
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={handleBetChange}
                                    style={{ 
                                        width: '120px',
                                        padding: '10px',
                                        fontSize: '1.2rem',
                                        textAlign: 'center',
                                        background: 'black',
                                        color: 'white',
                                        border: '2px solid #FFD700',
                                        borderRadius: '8px'
                                    }}
                                />
                                
                                <button 
                                    onClick={incrementBet}
                                    onMouseEnter={playHoverSound}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#2e7d32',
                                        color: 'white',
                                        fontSize: '20px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                gap: '8px', 
                                flexWrap: 'wrap',
                                marginBottom: '15px',
                                width: '100%'
                            }}>
                                {[10, 50, 100, 500].map(amount => (
                                    <button 
                                        key={amount}
                                        onClick={() => setBetAmount(String(amount))}
                                        onMouseEnter={playHoverSound}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(255, 215, 0, 0.2)',
                                            border: '1px solid #FFD700',
                                            color: '#FFD700',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {amount}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setBetAmount(String(balance))}
                                    onMouseEnter={playHoverSound}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(255, 99, 71, 0.2)',
                                        border: '1px solid #FF6347',
                                        color: '#FF6347',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    MAX
                                </button>
                            </div>
                            
                            <motion.button 
                                onClick={handleBetSubmit}
                                onMouseEnter={playHoverSound}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '80%',
                                    padding: '12px',
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'black',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Place Bet
                            </motion.button>
                            
                            <p style={{ fontSize: '0.9rem', color: '#AAA', marginTop: '10px' }}>
                                Your balance: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{balance}</span>
                            </p>
                        </motion.div>
                    )}

                    {/* Prediction Controls - Displayed when in predict phase */}
                    {gamePhase === 'predict' && (
                        <motion.div 
                            className="prediction-controls"
                            style={{
                                marginTop: '150px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                width: '100%',
                                maxWidth: '500px',
                                padding: '20px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: '15px',
                                border: '2px solid #FFD700',
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.p 
                                style={{
                                    fontSize: '1.4rem',
                                    textShadow: '0 2px 10px rgba(255, 215, 0, 0.6)',
                                    fontWeight: 'bold',
                                    marginBottom: '10px'
                                }}
                                animate={{ 
                                    scale: [1, 1.05, 1],
                                    color: ['#FFFFFF', '#FFD700', '#FFFFFF']
                                }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            >
                                Your card's value: <span style={{color: '#FFD700', fontWeight: 'bold', fontSize: '1.6rem'}}>
                                    {selectedCardValue ? selectedCardValue.displayValue.toUpperCase() : '?'}
                                </span>
                            </motion.p>
                            
                            <motion.p style={{ fontSize: '1.3rem', marginBottom: '15px' }}>
                                Will the next card be higher or lower?
                            </motion.p>
                            
                            <motion.div 
                                className="prediction-buttons"
                                style={{ 
                                    display: 'flex',
                                    gap: '30px',
                                    justifyContent: 'center',
                                    width: '100%'
                                }}
                            >
                                <motion.button 
                                    className="up-button"
                                    onClick={() => handlePrediction('up')}
                                    onMouseEnter={playHoverSound}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.1, y: -8 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        background: 'linear-gradient(45deg, #43a047, #2e7d32)',
                                        padding: '15px 40px',
                                        fontSize: '1.3rem',
                                        fontWeight: 'bold',
                                        borderRadius: '10px',
                                        border: 'none',
                                        boxShadow: '0 5px 15px rgba(46, 125, 50, 0.5)',
                                        color: 'white',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={{ marginRight: '8px' }}>↑</span> Higher
                                </motion.button>
                                
                                <motion.button 
                                    className="down-button"
                                    onClick={() => handlePrediction('down')}
                                    onMouseEnter={playHoverSound}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.1, y: -8 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        background: 'linear-gradient(45deg, #e53935, #c62828)',
                                        padding: '15px 40px',
                                        fontSize: '1.3rem',
                                        fontWeight: 'bold',
                                        borderRadius: '10px',
                                        border: 'none',
                                        boxShadow: '0 5px 15px rgba(198, 40, 40, 0.5)',
                                        color: 'white',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <span style={{ marginRight: '8px' }}>↓</span> Lower
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Result and Next Card Display - Integrated on the same page */}
                    {gamePhase === 'result' && (
                        <motion.div
                            className="result-container"
                            style={{
                                marginTop: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%',
                                padding: '20px'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Next Card Display */}
                            <motion.div
                                style={{
                                    position: 'relative',
                                    width: '200px',
                                    height: '290px', // Maintain aspect ratio
                                    marginBottom: '20px',
                                    perspective: '1000px'
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7 }}
                            >
                                <motion.div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        position: 'relative',
                                        transformStyle: 'preserve-3d',
                                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                                        borderRadius: '10px',
                                    }}
                                    initial={{ rotateY: 180 }}
                                    animate={{ rotateY: 0 }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                >
                                    <motion.div
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            background: 'url("/Cards_Shuffle/back1.png") center/cover',
                                            borderRadius: '10px',
                                        }}
                                    />
                                    
                                    <motion.div
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            borderRadius: '10px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <img 
                                            src={nextCardImage || '/Cards_Shuffle/back1.png'} 
                                            alt="Next Card"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'fill',
                                                borderRadius: '10px'
                                            }}
                                            onError={(e) => {
                                                console.error(`Failed to load next card image, using fallback`);
                                                e.target.src = "/Cards_Shuffle/back1.png";
                                            }}
                                        />
                                    </motion.div>
                                </motion.div>
                            </motion.div>

                            {/* Result Message Display */}
                            {result && (
                                <>
                                    {result.won && <Confetti />}
                                    {showBoomAnimation && 
                                        <motion.div 
                                            className="boom-animation"
                                            initial={{ scale: 0.1, opacity: 0 }}
                                            animate={{ scale: [0.1, 2, 0.5], opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, times: [0, 0.5, 1] }}
                                        >
                                            BOOM!
                                        </motion.div>
                                    }
                                    <motion.div 
                                        className={`result-display ${result.won ? 'win' : 'lose'}`}
                                        style={{
                                            padding: '20px',
                                            borderRadius: '10px',
                                            textAlign: 'center',
                                            background: result.won ? 'rgba(50, 205, 50, 0.2)' : 'rgba(255, 69, 0, 0.2)',
                                            border: `2px solid ${result.won ? '#32CD32' : '#FF4500'}`,
                                            marginTop: '20px',
                                            width: '100%',
                                            maxWidth: '400px'
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                                        transition={{ 
                                            duration: 0.8, 
                                            type: 'spring',
                                            y: { repeat: result.won ? 3 : 0, repeatType: "mirror", duration: 0.5 }
                                        }}
                                    >
                                        <motion.h3
                                            style={{
                                                fontSize: '1.8rem',
                                                marginBottom: '10px',
                                                color: result.won ? '#32CD32' : '#FF4500'
                                            }}
                                            animate={{ 
                                                scale: [1, 1.2, 1],
                                                color: result.won ? 
                                                    ['#32CD32', '#FFD700', '#32CD32'] : 
                                                    ['#FF4500', '#FF0000', '#FF4500']
                                            }}
                                            transition={{ duration: 1.5, repeat: 2, repeatType: "reverse" }}
                                        >
                                            {result.error ? 'Error Occurred' : (result.won ? 'You Won!' : 'You Lost!')}
                                        </motion.h3>
                                        <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{result.message}</p>
                                        
                                        {!result.error && (
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '8px',
                                                marginBottom: '15px'
                                            }}>
                                                <p>Your card: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                                                    {selectedCardValue?.displayValue?.toUpperCase() || '?'}
                                                </span></p>
                                                <p>Next card: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                                                    {(resultDetails?.next_card?.split('_of_')?.[0] || '?').toUpperCase()}
                                                </span></p>
                                                <p>Your prediction: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                                                    {resultDetails?.user_prediction === 'high' ? 'HIGHER' : 'LOWER'}
                                                </span></p>
                                            </div>
                                        )}
                                        
                                        <motion.button 
                                            className="play-again-button" 
                                            onClick={resetGame}
                                            onMouseEnter={playHoverSound}
                                            whileHover={{ scale: 1.1, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                display: showPlayAgain ? 'block' : 'none',
                                                padding: '12px 30px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                                border: 'none',
                                                color: 'black',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {result.error ? 'Try Again' : (result.won ? 'Play Again' : 'Try Again')}
                                        </motion.button>
                                    </motion.div>
                                </>
                            )}
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Shuffle;