import React, { useEffect, useRef, useState } from 'react';
import './Plane.css';

// Import assets
import planeImage from '../assets/aviator_jogo.png';
import blastImage from '../assets/blast.png';

const Plane = ({ gameState, multiplier }) => {
    const planeRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastMultiplierRef = useRef(1.0);
    const [planeState, setPlaneState] = useState('idle');
    const [currentPosition, setCurrentPosition] = useState({ x: 30, y: 0 });
    const containerSizeRef = useRef({ width: 0, height: 0 });
    const [isNoseLifted] = useState(false);
    const positionRef = useRef({ x: 30, y: 0 });
    
    // Initialize container size and handle resize
    useEffect(() => {
        const updateContainerSize = () => {
            const container = document.querySelector('.rays-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                containerSizeRef.current = { width: rect.width, height: rect.height };
                if (planeState === 'idle') {
                    positionRef.current = { x: 30, y: rect.height - 150 };
                    setCurrentPosition(positionRef.current);
                }
            }
        };

        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, [planeState]);

    // Handle game state changes
    useEffect(() => {
        switch(gameState) {
            case 'starting':
            case 'running':
                if (planeState !== 'flying') {
                    startFlight();
                }
                break;
            case 'crashed':
                explodePlane();
                break;
            case 'waiting':
                resetPlane();
                break;
            default:
                break;
        }
    }, [gameState]);

    // Animation frame for smooth flight
    useEffect(() => {
        if (planeState === 'flying' && planeRef.current) {
            const animate = () => {
                if ((planeState === 'flying' || gameState === 'running') && multiplier >= 1) {
                    lastMultiplierRef.current = multiplier;
                    updatePlanePosition(multiplier);
                    
                    // Apply the position directly to the DOM for smoother animation
                    if (planeRef.current) {
                        planeRef.current.style.transform = 
                            `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
                    }
                }
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            
            animationFrameRef.current = requestAnimationFrame(animate);
            
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [planeState, gameState, multiplier]);

    const updatePlanePosition = (currentMultiplier) => {
        const progress = Math.min((currentMultiplier - 1) / 3, 1);
    
        // Starting coordinates at the bottom left corner
        const startX = 30; 
        const startY = containerSizeRef.current.height - 150;
    
        // Define key points for the flight path
        const midX = containerSizeRef.current.width / 2;
        const midY = containerSizeRef.current.height / 8;
        const endX = containerSizeRef.current.width - 150;
        const endY = 50;
    
        let x, y;
        if (progress < 0.33) {
            // Move towards the center
            const phaseProgress = progress / 0.33;
            x = startX + (midX - startX) * phaseProgress;
            y = startY - (startY - midY) * phaseProgress;
        } else if (progress < 0.66) {
            // Move towards the top-right corner
            const phaseProgress = (progress - 0.33) / 0.33;
            x = midX + (endX - midX) * phaseProgress;
            y = midY - (midY - endY) * phaseProgress;
        } else {
            // Move up and down at the top-right corner
            const phaseProgress = (progress - 0.66) / 0.34;
            x = endX;
            y = endY + Math.sin(phaseProgress * Math.PI * 2) * 20;
        }
    
        // Add some random height adjustments to simulate flying
        const heightAdjustment = Math.sin(progress * Math.PI * 2) * 10;
        y += heightAdjustment;
    
        // Update ref directly for animation frame
        positionRef.current = { x, y };
        // Only update state occasionally to avoid re-renders
        if (Math.abs(x - currentPosition.x) > 5 || Math.abs(y - currentPosition.y) > 5) {
            setCurrentPosition({ x, y });
        }
    };

    const startFlight = () => {
        setPlaneState('flying');
        positionRef.current = { x: 30, y: containerSizeRef.current.height - 150 };
        setCurrentPosition(positionRef.current);
    };

    const explodePlane = () => {
        setPlaneState('exploded');
        
        setTimeout(() => {
            resetPlane();
        }, 1000);
    };

    const resetPlane = () => {
        setPlaneState('idle');
        lastMultiplierRef.current = 1.0;
        positionRef.current = { x: 30, y: containerSizeRef.current.height - 150 };
        setCurrentPosition(positionRef.current);
    };

    return (
        <div className="plane-container">
            <div 
                ref={planeRef}
                className={`plane ${planeState} ${isNoseLifted ? 'lift-nose' : ''}`}
                style={{ 
                    backgroundImage: `url(${planeImage})`,
                    transform: `translate(${currentPosition.x}px, ${currentPosition.y}px)`,
                    transition: 'none'
                }}
            />
            
            {planeState === 'exploded' && (
                <div 
                    className="explosion"
                    style={{ 
                        backgroundImage: `url(${blastImage})`,
                        left: `${currentPosition.x}px`,
                        top: `${currentPosition.y}px`
                    }}
                />
            )}
        </div>
    );
};

export default React.memo(Plane);