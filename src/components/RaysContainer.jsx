import React, { useEffect, useRef } from 'react';

import Plane from './Plane';

const RaysContainer = ({ gameState, multiplier }) => {
  console.log('RaysContainer render:', { gameState, multiplier });
  const raysBgRef = useRef(null);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const raysBackground = document.querySelector('.rays-background');
    if (raysBackground) {
      raysBgRef.current = raysBackground;

      // Disable CSS animation to avoid conflicts
      raysBackground.style.animation = 'none';

      // Animation function for smooth, fast rotation
      const animate = () => {
        rotationRef.current += 0.4; // Increased speed (adjustable: higher = faster)
        if (rotationRef.current >= 360) {
          rotationRef.current -= 360; // Seamless loop without reset flicker
        }
        raysBackground.style.transform = `rotate(${rotationRef.current}deg)`;
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      // Start animation after a slight delay to ensure DOM readiness
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
      }, 100);

    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="rays-container">
      <div className="rays-background"></div>
      <div className="game-area">
        <Plane 
          gameState={gameState === 'running' ? 'starting' : gameState === 'crashed' ? 'crashed' : 'waiting'} 
          multiplier={multiplier} 
        />
      </div>
    </div>
  );
};

export default React.memo(RaysContainer);