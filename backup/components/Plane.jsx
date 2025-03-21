import React, { useEffect, useRef, useState } from 'react';
import './Plane.css';

// Import assets
import planeImage from '../assets/aviator_jogo.png';
import blastImage from '../assets/blast.png';
import takeoffSound from '../assets/take_off.mp3';
import explosionSound from '../assets/explosion2.mp3';
import backgroundSound from '../assets/main.wav';

const Plane = ({ gameState, multiplier }) => {
    const planeRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastMultiplierRef = useRef(1.0);
    const [planeState, setPlaneState] = useState('idle');
    const [currentPosition, setCurrentPosition] = useState({ x: 30, y: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isNoseLifted] = useState(false);
    
    // Audio refs with preloading
    const takeoffAudioRef = useRef(new Audio(takeoffSound));
    const explosionAudioRef = useRef(new Audio(explosionSound));
    const backgroundAudioRef = useRef(new Audio(backgroundSound));
    
    // Initialize container size and handle resize
    useEffect(() => {
        const updateContainerSize = () => {
            const container = document.querySelector('.rays-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
                if (planeState === 'idle') {
                    setCurrentPosition({ x: 30, y: rect.height - 110 });
                }
            }
        };

        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, [planeState]);

    // Initialize audio settings
    useEffect(() => {
        takeoffAudioRef.current.load();
        explosionAudioRef.current.load();
        backgroundAudioRef.current.load();
        
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = 0.3;
        takeoffAudioRef.current.volume = 0.5;
        explosionAudioRef.current.volume = 0.5;
        
        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            backgroundAudioRef.current.pause();
            takeoffAudioRef.current.pause();
            explosionAudioRef.current.pause();
        };
    }, []);

    // Handle game state changes
    useEffect(() => {
        console.log('Game state changed:', gameState, 'Current multiplier:', multiplier);
        
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

    // Update position based on multiplier
    useEffect(() => {
        console.log('Multiplier update:', multiplier, 'Plane state:', planeState);
        if ((planeState === 'flying' || gameState === 'running') && multiplier >= 1) {
            lastMultiplierRef.current = multiplier;
            updatePlanePosition(multiplier);
        }
    }, [multiplier, planeState, gameState]);

    const updatePlanePosition = (currentMultiplier) => {
        const progress = Math.min((currentMultiplier - 1) / 5, 1); // Adjusted for faster progress
    
        // Starting coordinates at the bottom left corner
        const startX = 30; // Initial x position
        const startY = containerSize.height - 110; // Initial y position (bottom)
    
        // Define key points for the flight path
        const midX = containerSize.width / 2; // Midpoint x position
        const midY = containerSize.height / 2; // Midpoint y position
    
        const dipX = containerSize.width * 0.75; // Dip x position
        const dipY = containerSize.height * 0.6; // Dip y position
    
        const endX = containerSize.width - 150; // Final x position (right, but not at the edge)
        const endY = containerSize.height / 5; // Final y position (higher, but not at the top)
    
        // Determine which phase of the flight path we're in
        let x, y;
        if (progress < 0.5) {
            // First phase: move towards the center
            const phaseProgress = progress / 0.5;
            x = startX + (midX - startX) * phaseProgress;
            y = startY - (startY - midY) * phaseProgress;
        } else if (progress < 0.75) {
            // Second phase: dip slightly
            const phaseProgress = (progress - 0.5) / 0.25;
            x = midX + (dipX - midX) * phaseProgress;
            y = midY - (midY - dipY) * phaseProgress;
        } else {
            // Third phase: move towards the top-right corner
            const phaseProgress = (progress - 0.75) / 0.25;
            x = dipX + (endX - dipX) * phaseProgress;
            y = dipY - (dipY - endY) * phaseProgress;
        }
    
        console.log('Updating plane position:', { x, y, multiplier: currentMultiplier });
        setCurrentPosition({ x, y }); // Update state with new position
    };

    const startFlight = () => {
        console.log('Starting flight');
        setPlaneState('flying');
        setCurrentPosition({ x: 30, y: containerSize.height - 110 });
        takeoffAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
        backgroundAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
    };

    const explodePlane = () => {
        console.log('Exploding plane');
        setPlaneState('exploded');
        backgroundAudioRef.current.pause();
        explosionAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
        
        setTimeout(() => {
            resetPlane();
        }, 1000);
    };

    const resetPlane = () => {
        console.log('Resetting plane');
        setPlaneState('idle');
        lastMultiplierRef.current = 1.0;
        setCurrentPosition({ x: 30, y: containerSize.height - 110 });
        backgroundAudioRef.current.pause();
    };

    return (
        <div className="plane-container">
            <div 
                ref={planeRef}
                className={`plane ${planeState} ${isNoseLifted ? 'lift-nose' : ''}`}
                style={{ 
                    backgroundImage: `url(${planeImage})`,
                    transform: `translate(${currentPosition.x}px, ${currentPosition.y}px)`,
                    transition: 'transform 0.3s ease-in-out'
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

export default Plane; 