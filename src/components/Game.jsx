import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import axios from 'axios';
import RaysCanvasContainer from './RaysCanvasContainer';
import './Game.css';

const Bet = lazy(() => import('./Bet'));

const audioInstances = {
  background: new Audio('/sounds/main.wav'),
  takeoff: new Audio('/sounds/take_off.mp3'),
  cashout: new Audio('/sounds/cashout.mp3'),
  explosion: new Audio('/sounds/explosion.mp3'),
  tick: new Audio('/sounds/tick.mp3')
};

Object.values(audioInstances).forEach(audio => {
  audio.preload = 'auto';
  audio.volume = 0.3;
});
audioInstances.background.loop = true;

export default function Game() {
  const { username, balance, updateBalance, updateBalanceAfterBet } = useGameStore();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('waiting');
  const [nextGameIn, setNextGameIn] = useState(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [message, setMessage] = useState('');
  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(false);

  const [regularMode, setRegularMode] = useState('manual');
  const [regularAmount, setRegularAmount] = useState('');
  const [regularAutoCashout, setRegularAutoCashout] = useState('');
  const [regularHasBet, setRegularHasBet] = useState(false);
  const [regularAutoEnabled, setRegularAutoEnabled] = useState(false);

  const [wagerMode, setWagerMode] = useState('manual');
  const [wagerAmount, setWagerAmount] = useState('');
  const [wagerAutoCashout, setWagerAutoCashout] = useState('');
  const [wagerHasBet, setWagerHasBet] = useState(false);
  const [wagerAutoEnabled, setWagerAutoEnabled] = useState(false);

  const playSound = useRef((soundKey) => {
    const audio = audioInstances[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => console.warn(`Audio play failed (${soundKey}):`, error));
    }
  }).current;

  const handleBetPlaced = useCallback((data) => {
    const isBetType = data.bet_choice === 'regular' ? 'regular' : 'wager';
    if (isBetType === 'regular') {
      setRegularHasBet(true);
      setRegularAutoEnabled(regularMode === 'auto' && regularAutoCashout !== '');
    } else {
      setWagerHasBet(true);
      setWagerAutoEnabled(wagerMode === 'auto' && wagerAutoCashout !== '');
    }
    setMessage(`${isBetType.charAt(0).toUpperCase() + isBetType.slice(1)} bet placed: $${data.amount}`);
    updateBalanceAfterBet(); // Force balance refresh after bet
  }, [regularMode, regularAutoCashout, wagerMode, wagerAutoCashout, updateBalanceAfterBet]);

  const handleCashoutSuccess = useCallback((data) => {
    playSound('cashout');
    setMessage(`Cashed out! Won $${data.winnings}`);
    if (data.bet_type === 'regular') {
      setRegularHasBet(false);
      setRegularAutoEnabled(false);
    } else {
      setWagerHasBet(false);
      setWagerAutoEnabled(false);
    }
    updateBalanceAfterBet(); // Force balance refresh after cashout
  }, [updateBalanceAfterBet]);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'game_status':
        setGameState(data.game_running ? 'running' : 'waiting');
        setCurrentMultiplier(data.current_multiplier || 1.0);
        setNextGameIn(data.next_game_in);
        if (data.game_running) {
          playSound('takeoff');
          if (!isBackgroundMusicPlaying) {
            audioInstances.background.play()
              .then(() => setIsBackgroundMusicPlaying(true))
              .catch(console.warn);
          }
        }
        break;
      case 'game_end':
        console.log('WebSocket game_end:', data);
        setGameState('crashed');
        setMessage(`Game crashed at ${data.final_multiplier}x`);
        setNextGameIn(data.next_game_in);
        playSound('explosion');
        audioInstances.background.pause();
        setIsBackgroundMusicPlaying(false);
        setTimeout(() => {
          setGameState('waiting');
          setCurrentMultiplier(1.0);
        }, 3000);
        break;
      case 'game_start':
        setGameState('running');
        setCurrentMultiplier(1.0);
        setMessage('Game started!');
        break;
      case 'multiplier_update':
        setCurrentMultiplier(prev => {
          const newMultiplier = data.multiplier;
          if (regularHasBet && regularAutoEnabled && newMultiplier >= parseFloat(regularAutoCashout)) {
            handleCashout('regular');
          }
          if (wagerHasBet && wagerAutoEnabled && newMultiplier >= parseFloat(wagerAutoCashout)) {
            handleCashout('wager');
          }
          return newMultiplier;
        });
        break;
      case 'bet_placed':
        if (data.player === username) {
          handleBetPlaced(data);
        }
        break;
      case 'cash_out':
        if (data.player === username) {
          handleCashoutSuccess(data);
        }
        break;
    }
  }, [username, regularHasBet, regularAutoEnabled, regularAutoCashout, wagerHasBet, wagerAutoEnabled, wagerAutoCashout, handleBetPlaced, handleCashoutSuccess, isBackgroundMusicPlaying]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed');

    const sendHeartbeat = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "heartbeat" }));
      }
      requestAnimationFrame(sendHeartbeat);
    };
    requestAnimationFrame(sendHeartbeat);

    return () => ws.close();
  }, [handleWebSocketMessage]);

  useEffect(() => {
    let timer;
    if (nextGameIn > 0 && gameState === 'waiting') {
      timer = setInterval(() => {
        setNextGameIn(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [nextGameIn, gameState]);

  const toggleBackgroundMusic = useCallback(() => {
    if (!isBackgroundMusicPlaying) {
      audioInstances.background.play()
        .then(() => setIsBackgroundMusicPlaying(true))
        .catch(console.warn);
    } else {
      audioInstances.background.pause();
      setIsBackgroundMusicPlaying(false);
    }
  }, [isBackgroundMusicPlaying]);

  const handleCashout = useCallback((type) => {
    // Placeholder for Bet.jsx to call
  }, []);

  return (
    <div className="bet-container">
      <RaysCanvasContainer gameState={gameState} multiplier={currentMultiplier} />
      <div className="game-header">
        <h1 className={`multiplier ${gameState === 'running' ? 'game-running' : ''}`}>
          {currentMultiplier.toFixed(2)}x
        </h1>
        <p className="balance">Balance: ${balance.toFixed(2)}</p>
      </div>

      <Suspense fallback={<div>Loading Bet...</div>}>
        <Bet
          username={username}
          balance={balance}
          gameState={gameState}
          onBetPlaced={handleBetPlaced}
          onCashoutSuccess={handleCashoutSuccess}
          regularMode={regularMode}
          setRegularMode={setRegularMode}
          regularAmount={regularAmount}
          setRegularAmount={setRegularAmount}
          regularAutoCashout={regularAutoCashout}
          setRegularAutoCashout={setRegularAutoCashout}
          regularHasBet={regularHasBet}
          wagerMode={wagerMode}
          setWagerMode={setWagerMode}
          wagerAmount={wagerAmount}
          setWagerAmount={setWagerAmount}
          wagerAutoCashout={wagerAutoCashout}
          setWagerAutoCashout={setWagerAutoCashout}
          wagerHasBet={wagerHasBet}
        />
      </Suspense>

      {message && <p className="message">{message}</p>}

      <div className="game-status">
        {gameState === 'running' ? (
          <p className="status">Game in progress! 🎲</p>
        ) : (
          <>
            <p className="status">
              Next game in: {nextGameIn ? `${Math.ceil(nextGameIn)}s` : 'Soon'}
            </p>
            <button onClick={toggleBackgroundMusic}>
              {isBackgroundMusicPlaying ? '🔇 Mute' : '🔊 Play Music'}
            </button>
          </>
        )}
      </div>

      <button className="back-button" onClick={() => navigate('/welcome')}>
        Back to Home
      </button>
    </div>
  );
}