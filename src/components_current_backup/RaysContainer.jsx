import React from 'react';
import './RaysContainer.css';
import Plane from './Plane';

const RaysContainer = ({ gameState, multiplier }) => {
  console.log('RaysContainer render:', { gameState, multiplier }); // Debug log

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

export default RaysContainer; 