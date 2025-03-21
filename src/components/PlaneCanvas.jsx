import React, { useEffect, useRef, useState } from 'react';
import './Plane.css'; // Keep your original CSS for canvas styling

// Import assets
import planeImageSrc from '../assets/aviator_jogo.png';

const PlaneCanvas = ({ gameState, multiplier }) => {
    const canvasRef = useRef(null);
    const planeImageRef = useRef(new Image());
    const animationFrameRef = useRef(null);
    const lastMultiplierRef = useRef(1.0);
    const [planeState, setPlaneState] = useState('idle');
    const [currentPosition, setCurrentPosition] = useState({ x: 30, y: 0 });
    const containerSizeRef = useRef({ width: 0, height: 0 });
    const [isNoseLifted] = useState(false);
    const positionRef = useRef({ x: 30, y: 0 });
    const smokeParticlesRef = useRef([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const explosionStartTimeRef = useRef(0);
    const explosionParticlesRef = useRef([]);

    // Initialize container size and handle resize
    useEffect(() => {
        const updateContainerSize = () => {
            const container = document.querySelector('.rays-container');
            if (container) {
                const rect = container.getBoundingClientRect();
                containerSizeRef.current = { width: rect.width, height: rect.height };
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                }
                if (planeState === 'idle') {
                    positionRef.current = { x: 30, y: rect.height - 80 };
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
        console.log('Game state changed to:', gameState, 'Plane state:', planeState);
        switch (gameState) {
            case 'starting':
            case 'running':
                if (planeState !== 'flying') {
                    startFlight();
                }
                break;
            case 'crashed':
                console.log('Crash detected, setting final position and exploding');
                updatePlanePosition(multiplier);
                setPlaneState('exploding');
                explosionStartTimeRef.current = Date.now();
                createExplosionParticles();
                // Increase timeout from 2 to 3 seconds
                setTimeout(() => {
                    resetPlane();
                }, 3000);
                break;
            case 'waiting':
                resetPlane();
                break;
            default:
                break;
        }
    }, [gameState, planeState]);

    // Load plane image
    useEffect(() => {
        const loadImages = async () => {
            try {
                // Load plane image
                const planeImg = new Image();
                const planeLoadPromise = new Promise((resolve, reject) => {
                    planeImg.onload = resolve;
                    planeImg.onerror = reject;
                });
                planeImg.src = planeImageSrc;
                planeImageRef.current = planeImg;

                // Wait for plane image to load
                await planeLoadPromise;
                console.log('Plane image loaded successfully');
                setImagesLoaded(true);
            } catch (error) {
                console.error('Failed to load plane image:', error);
            }
        };

        loadImages();
    }, []);

    // Create explosion particles
    const createExplosionParticles = () => {
        const x = positionRef.current.x + 52;
        const y = positionRef.current.y + 35;
        const particles = [];

        // Create 60 particles with more dramatic colors
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5; // Faster particles
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 8, // Larger particles
                color: i % 4 === 0 ? '#ff0000' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ffff00' : '#ff5500',
                alpha: 1,
                life: 1,
                decayRate: 0.007 + (Math.random() * 0.007) // Much slower decay
            });
        }

        // Add multiple shockwaves for dramatic effect
        for (let i = 0; i < 3; i++) {
            particles.push({
                x,
                y,
                type: 'shockwave',
                radius: 5,
                maxRadius: 120 + (i * 30), // Larger radius for each wave
                alpha: 0.9,
                life: 1,
                decayRate: 0.01 + (i * 0.005) // Different decay rates
            });
        }

        explosionParticlesRef.current = particles;
    };

    // Animation frame for smooth flight
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Handle smoke particles
            if (planeState === 'flying') {
                // Add new smoke particles
                smokeParticlesRef.current.push(
                    createSmokeParticle(
                        positionRef.current.x + 9, // Adjust to match plane's exhaust
                        positionRef.current.y + 65  // Adjust to match plane's exhaust
                    )
                );

                // Update and draw smoke
                ctx.save();
                smokeParticlesRef.current = smokeParticlesRef.current.filter(particle => {
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                    particle.life -= 0.02;
                    particle.alpha = particle.life * 0.3;
                    particle.radius += 0.2;

                    if (particle.life > 0) {
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(200, 200, 200, ${particle.alpha})`;
                        ctx.fill();
                        return true;
                    }
                    return false;
                });
                ctx.restore();
            }

            // Update plane position if flying
            if (planeState === 'flying' && multiplier >= 1) {
                lastMultiplierRef.current = multiplier;
                updatePlanePosition(multiplier);
            }

            // Draw plane or explosion
            if (planeState === 'exploding' || planeState === 'exploded') {
                const elapsedTime = (Date.now() - explosionStartTimeRef.current) / 1000; // seconds
                
                // Draw explosion particles
                ctx.save();
                explosionParticlesRef.current = explosionParticlesRef.current.filter(particle => {
                    if (particle.type === 'shockwave') {
                        // Update shockwave
                        const progress = 1 - particle.life;
                        particle.radius = progress * particle.maxRadius;
                        particle.alpha = particle.life * 0.8;
                        particle.life -= particle.decayRate || 0.02; // Use custom decay or default
                        
                        // Draw shockwave
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${particle.alpha})`;
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    } else {
                        // Update regular particles
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.vy += 0.05; // gravity
                        particle.alpha = particle.life;
                        particle.life -= particle.decayRate || 0.02; // Use custom decay or default
                        
                        // Draw particle
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
                        ctx.fill();
                    }
                    
                    return particle.life > 0;
                });
                ctx.restore();
                
                // Draw central explosion glow
                if (elapsedTime < 1.5) { // Increased from 0.5 to 1.5 seconds
                    const glowAlpha = 0.7 * (1 - elapsedTime / 1.5);
                    const glowRadius = 30 + (elapsedTime * 40);
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(positionRef.current.x + 52, positionRef.current.y + 35, glowRadius, 0, Math.PI * 2);
                    
                    const gradient = ctx.createRadialGradient(
                        positionRef.current.x + 52, 
                        positionRef.current.y + 35, 
                        0,
                        positionRef.current.x + 52, 
                        positionRef.current.y + 35, 
                        glowRadius
                    );
                    gradient.addColorStop(0, `rgba(255, 200, 50, ${glowAlpha})`);
                    gradient.addColorStop(0.5, `rgba(255, 100, 50, ${glowAlpha * 0.5})`);
                    gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
                    
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.restore();
                }
                
                // Change state to exploded after longer animation time
                if (planeState === 'exploding' && elapsedTime > 0.8) { // Increased from 0.3 to 0.8
                    setPlaneState('exploded');
                }
            } else {
                // Draw normal plane
                ctx.drawImage(
                    planeImageRef.current,
                    positionRef.current.x,
                    positionRef.current.y,
                    105,
                    70
                );
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation when images are loaded
        if (imagesLoaded) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [planeState, gameState, multiplier, imagesLoaded]);

    const createSmokeParticle = (x, y) => ({
        x,
        y,
        alpha: 0.3,
        radius: Math.random() * 2 + 1,
        speedX: Math.random() * -2 - 1,
        speedY: Math.random() * 0.5 - 0.25,
        life: 1
    });

    const updatePlanePosition = (currentMultiplier) => {
        const progress = Math.min((currentMultiplier - 1) / 3, 1);
    
        // Starting coordinates at the bottom left corner
        const startX = 30;
        const startY = containerSizeRef.current.height - 80;
    
        // Define key points for the flight path
        const midX = containerSizeRef.current.width / 2;
        const midY = containerSizeRef.current.height / 8;
        const endX = containerSizeRef.current.width - 180;
        const endY = 50;
    
        let x, y;
        if (progress < 0.33) {
            // Initial takeoff phase - reduced shake
            const phaseProgress = progress / 0.33;
            x = startX + (midX - startX) * phaseProgress;
            y = startY - (startY - midY) * phaseProgress;
            
            // Reduced shake values
            const takeoffShake = Math.sin(Date.now() / 50) * (1 - phaseProgress) * 1.5;
            const verticalShake = Math.cos(Date.now() / 30) * (1 - phaseProgress) * 1;
            x += takeoffShake;
            y += verticalShake;
        } else if (progress < 0.66) {
            // Mid-flight phase - reduced turbulence
            const phaseProgress = (progress - 0.33) / 0.33;
            x = midX + (endX - midX) * phaseProgress;
            y = midY - (midY - endY) * phaseProgress;
            
            // Reduced turbulence
            x += Math.sin(Date.now() / 60) * 1;
            y += Math.cos(Date.now() / 45) * 1;
        } else {
            // Final hovering phase - reduced shake
            x = endX + Math.sin(Date.now() / 70) * 0.8;
            y = endY + Math.sin(progress * Math.PI * 2) * 20 + Math.cos(Date.now() / 50) * 0.8;
        }
    
        // Reduced continuous turbulence
        const turbulence = {
            x: Math.sin(Date.now() / 100) * 0.5,
            y: Math.cos(Date.now() / 80) * 0.5
        };
    
        positionRef.current = { 
            x: x + turbulence.x, 
            y: y + turbulence.y 
        };
    
        if (Math.abs(x - currentPosition.x) > 5 || Math.abs(y - currentPosition.y) > 5) {
            setCurrentPosition(positionRef.current);
        }
    };

    const startFlight = () => {
        setPlaneState('flying');
        positionRef.current = { x: 30, y: containerSizeRef.current.height - 80 };
        setCurrentPosition(positionRef.current);
    };

    const resetPlane = () => {
        setPlaneState('idle');
        lastMultiplierRef.current = 1.0;
        positionRef.current = { x: 30, y: containerSizeRef.current.height - 80 };
        setCurrentPosition(positionRef.current);
        smokeParticlesRef.current = []; // Clear smoke particles
        explosionParticlesRef.current = []; // Clear explosion particles
    };

    return <canvas ref={canvasRef} className="plane-canvas" style={{ zIndex: 10 }} />;
};

export default React.memo(PlaneCanvas);