import React, { useEffect, useRef, useState } from 'react';
import './RaysContainer.css';
import PlaneCanvas from './PlaneCanvas';

const RaysCanvasContainer = ({ gameState, multiplier }) => {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef(null);
  const lastMultiplierRef = useRef(multiplier);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    if (gameState === 'crashed') {
      console.log('CRASH DETECTED in RaysContainer - forcing render');
      setForceRender(prev => prev + 1);
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;

    const handleResize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const drawRays = (ctx, rotation) => {
      ctx.save();
      
      // Move origin to bottom-left corner
      ctx.translate(0, canvas.height);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw the conic gradient pattern
      for (let i = 0; i < 360; i += 10) { // Full 10deg cycle (4deg grey + 6deg black)
        // Draw grey wedge (4 degrees)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const length = Math.max(canvas.width, canvas.height) * 3.5; // Match CSS 700%
        ctx.arc(0, 0, length, (i * Math.PI) / 180, ((i + 4) * Math.PI) / 180);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        
        // Draw black wedge (6 degrees)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, length, ((i + 4) * Math.PI) / 180, ((i + 10) * Math.PI) / 180);
        ctx.fillStyle = '#000000';
        ctx.fill();
      }
      
      ctx.filter = 'blur(1px)';
      ctx.restore();
    };
// Rays Speed Settings - CANVAS ROTATION Render
    const animate = () => {
      if (gameState === 'running' && multiplier !== lastMultiplierRef.current) {
        rotationRef.current += 1.6;
        if (rotationRef.current >= 360) rotationRef.current -= 360;
      }
      lastMultiplierRef.current = multiplier;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawRays(ctx, rotationRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, multiplier, forceRender]);

  return (
    <div className="rays-container">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#000000',
          zIndex: 1
        }}
      />
      <div className="game-area">
        <PlaneCanvas 
          gameState={gameState}
          multiplier={multiplier}
          key={`plane-${forceRender}`}
        />
      </div>
    </div>
  );
};

export default React.memo(RaysCanvasContainer); 