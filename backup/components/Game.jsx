import { useEffect, useState, useRef } from 'react';
import useGameStore from '../store/gameStore';
import axios from 'axios';
import RaysContainer from './RaysContainer';
import './Game.css';

// Import audio assets
/* import mainSound from '../assets/main.wav';
import takeoffSound from '../assets/take_off.mp3';
import cashoutSound from '../assets/cashout.mp3';
import explosionSound from '../assets/explosion2.mp3'; */

// Initialize audio outside component to prevent re-creation
/* const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioInstances = {
  background: new Audio(mainSound),
  takeoff: new Audio(takeoffSound),
  cashout: new Audio(cashoutSound),
  explosion: new Audio(explosionSound)
};
 */
// Configure audio instances
/* Object.values(audioInstances).forEach(audio => {
  audio.preload = 'auto';
  audio.volume = 0.3;
});
audioInstances.background.loop = true; */

export default function Game() {
  const { username, balance, multiplier, gameRunning, updateGameState, updateBalance } = useGameStore();
  
  // Regular bet state
  const [regularMode, setRegularMode] = useState('manual');
  const [regularAmount, setRegularAmount] = useState('');
  const [regularAutoCashout, setRegularAutoCashout] = useState('');
  const [regularHasBet, setRegularHasBet] = useState(false);
  const [regularAutoEnabled, setRegularAutoEnabled] = useState(false);

  // Wager bet state
  const [wagerMode, setWagerMode] = useState('manual');
  const [wagerAmount, setWagerAmount] = useState('');
  const [wagerAutoCashout, setWagerAutoCashout] = useState('');
  const [wagerHasBet, setWagerHasBet] = useState(false);
  const [wagerAutoEnabled, setWagerAutoEnabled] = useState(false);
  
  // Game state
  const [gameState, setGameState] = useState('waiting');
  const [nextGameIn, setNextGameIn] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Audio state tracking
  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(false);

  // Update the multiplier state
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  // Memoize heavy computations and functions
  const playSound = useRef((soundKey) => {
    const audio = audioInstances[soundKey];
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn(`Audio play failed (${soundKey}):`, error);
        });
      }
    }
  }).current;

  // Optimize WebSocket message handling
  const handleWebSocketMessage = useRef((data) => {
      switch(data.type) {
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
        setGameState('crashed');
        setMessage(`Game crashed at ${data.final_multiplier}x`);
        setNextGameIn(data.next_game_in);
        playSound('explosion');
        audioInstances.background.pause();
        setIsBackgroundMusicPlaying(false);
        
        requestAnimationFrame(() => {
          setTimeout(() => {
            setGameState('waiting');
            setCurrentMultiplier(1.0);
          }, 1000);
          });
          break;

      case 'game_start':
        setGameState('running');
        setCurrentMultiplier(1.0);
        setMessage('Game started!');
        break;
      
      case 'multiplier_update':
        setCurrentMultiplier(data.multiplier);
        // Check both regular and wager auto-cashouts
        if (regularHasBet && regularAutoEnabled && data.multiplier >= parseFloat(regularAutoCashout)) {
          handleCashout('regular');
        }
        if (wagerHasBet && wagerAutoEnabled && data.multiplier >= parseFloat(wagerAutoCashout)) {
          handleCashout('wager');
        }
        break;

      case 'bet_placed':
        if (data.player === username) {
          handleBetPlaced(data);
          fetchBalance();
        }
        break;

      case 'cash_out':
        if (data.player === username) {
          handleCashoutSuccess(data);
          fetchBalance();
        }
        break;
    }
  }).current;

  // WebSocket connection with optimized message handling
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    // Heartbeat with requestAnimationFrame for better performance
    let heartbeatId;
    const sendHeartbeat = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "heartbeat" }));
      }
      heartbeatId = setTimeout(() => requestAnimationFrame(sendHeartbeat), 30000);
    };
    requestAnimationFrame(sendHeartbeat);

    return () => {
      clearTimeout(heartbeatId);
      ws.close();
    };
  }, [username]);

  // Optimize audio button handler
  const toggleBackgroundMusic = useRef(() => {
    if (!isBackgroundMusicPlaying) {
      audioInstances.background.play()
        .then(() => setIsBackgroundMusicPlaying(true))
        .catch(console.warn);
    } else {
      audioInstances.background.pause();
      setIsBackgroundMusicPlaying(false);
    }
  }).current;

  // Update countdown timer
  useEffect(() => {
    let timer;
    if (nextGameIn > 0 && gameState === 'waiting') {
      timer = setInterval(() => {
        setNextGameIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [nextGameIn, gameState]);

  const resetBets = () => {
    setRegularHasBet(false);
    setRegularAutoEnabled(false);
    setWagerHasBet(false);
    setWagerAutoEnabled(false);
  };

  const handleBetPlaced = (data) => {
    const isBetType = data.bet_choice === 'regular' ? 'regular' : 'wager';
    if (isBetType === 'regular') {
      setRegularHasBet(true);
      setRegularAutoEnabled(regularMode === 'auto' && regularAutoCashout !== '');
    } else {
      setWagerHasBet(true);
      setWagerAutoEnabled(wagerMode === 'auto' && wagerAutoCashout !== '');
    }
    setMessage(`${isBetType.charAt(0).toUpperCase() + isBetType.slice(1)} bet placed: $${data.amount}`);
  };

  const handleCashoutSuccess = (data) => {
    playSound('cashout');
    setMessage(`Cashed out! Won $${data.winnings}`);
    if (data.bet_type === 'regular') {
      setRegularHasBet(false);
      setRegularAutoEnabled(false);
    } else {
      setWagerHasBet(false);
      setWagerAutoEnabled(false);
    }
  };

  const handleBet = async (type) => {
    const amount = type === 'regular' ? regularAmount : wagerAmount;
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      setMessage('Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      await axios.post('http://localhost:8000/place-bet', {
        player_name: username,
        bet_amount: parseFloat(amount),
        bet_choice: type
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Bet failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async (type) => {
    if ((type === 'regular' && !regularHasBet) || (type === 'wager' && !wagerHasBet)) return;

    try {
      setLoading(true);
      await axios.post('http://localhost:8000/cash-out', {
        player_name: username,
        bet_type: type
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Cashout failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/users/${username}/balance/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      updateBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Betting container component for reusability
  const BettingContainer = ({ type, mode, setMode, amount, setAmount, autoCashout, setAutoCashout, hasBet }) => (
    <div className={`betting-container ${type}-container`}>
      <div className="betting-header">
        <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <div className="mode-toggle">
          <button 
            className={`toggle-btn ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            M
          </button>
          <button 
            className={`toggle-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => setMode('auto')}
          >
            A
          </button>
        </div>
      </div>

      <div className="betting-controls">
        <input
          type="number"
          className="amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          min="1"
          max="99"
          disabled={gameState === 'running' || loading || hasBet}
        />
        
        {mode === 'auto' && (
      <input
        type="number"
            className="cashout-input"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            placeholder="Auto X"
            min="1.01"
            step="0.01"
            disabled={gameState === 'running' || loading || hasBet}
          />
        )}

        {!hasBet ? (
          <button
            className="bet-button"
            onClick={() => handleBet(type)}
            disabled={gameState === 'running' || loading}
          >
            Bet
        </button>
        ) : (
          <button
            className="cashout-button"
            onClick={() => handleCashout(type)}
            disabled={!gameState === 'running' || loading}
          >
          Cash Out
        </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bet-container">
      <RaysContainer gameState={gameState} multiplier={currentMultiplier} />
      
      <div className="game-header">
        <h1 className={`multiplier ${gameState === 'running' ? 'game-running' : ''}`}>
          {currentMultiplier.toFixed(2)}x
        </h1>
        <p className="balance">Balance: ${balance.toFixed(2)}</p>
      </div>

      <div className="betting-containers">
        <BettingContainer
          type="regular"
          mode={regularMode}
          setMode={setRegularMode}
          amount={regularAmount}
          setAmount={setRegularAmount}
          autoCashout={regularAutoCashout}
          setAutoCashout={setRegularAutoCashout}
          hasBet={regularHasBet}
        />

        <BettingContainer
          type="wager"
          mode={wagerMode}
          setMode={setWagerMode}
          amount={wagerAmount}
          setAmount={setWagerAmount}
          autoCashout={wagerAutoCashout}
          setAutoCashout={setWagerAutoCashout}
          hasBet={wagerHasBet}
        />
      </div>

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
    </div>
  );
}