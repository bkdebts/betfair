import React, { useState, useRef, memo } from 'react';
import axios from 'axios';
import './Bet.css';

const BettingContainer = memo(({ type, mode, setMode, amount, setAmount, autoCashout, setAutoCashout, hasBet, handleBet, handleCashout, gameState, loading }) => {
  return (
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
          disabled={hasBet || gameState === 'running'}
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
            disabled={hasBet || gameState === 'running'}
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
            disabled={gameState !== 'running' || loading || !hasBet}
          >
            Cash Out
          </button>
        )}
      </div>
    </div>
  );
});

const Bet = memo(({
  username, balance, gameState, onBetPlaced, onCashoutSuccess,
  regularMode, setRegularMode, regularAmount, setRegularAmount, regularAutoCashout, setRegularAutoCashout, regularHasBet,
  wagerMode, setWagerMode, wagerAmount, setWagerAmount, wagerAutoCashout, setWagerAutoCashout, wagerHasBet
}) => {
  const [loading, setLoading] = useState(false);
  const cashoutDebounceRef = useRef({ regular: false, wager: false });

  const handleBet = async (type) => {
    const amount = type === 'regular' ? regularAmount : wagerAmount;
    if (!amount || parseFloat(amount) <= 0) {
      onBetPlaced({ message: 'Please enter a valid bet amount' });
      return;
    }
    if (parseFloat(amount) > balance) {
      onBetPlaced({ message: 'Insufficient balance' });
      return;
    }
    try {
      setLoading(true);
      await axios.post('http://localhost:8000/place-bet', {
        player_name: username,
        bet_amount: parseFloat(amount),
        bet_choice: type
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // WebSocket will handle the rest via 'bet_placed'
    } catch (error) {
      onBetPlaced({ message: error.response?.data?.message || 'Bet failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async (type) => {
    const hasBet = type === 'regular' ? regularHasBet : wagerHasBet;
    if (!hasBet || cashoutDebounceRef.current[type]) return;

    cashoutDebounceRef.current[type] = true;
    try {
      setLoading(true);
      const endpoint = type === 'regular' ? 'cash-out' : 'wager-cashout';
      await axios.post(`http://localhost:8000/${endpoint}`, {
        player_name: username,
        bet_type: type
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // WebSocket will handle the rest via 'cash_out'
    } catch (error) {
      onCashoutSuccess({ message: error.response?.data?.detail || 'Cashout failed' });
    } finally {
      setLoading(false);
      setTimeout(() => { cashoutDebounceRef.current[type] = false; }, 500);
    }
  };

  return (
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
        handleBet={handleBet}
        handleCashout={handleCashout}
        gameState={gameState}
        loading={loading}
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
        handleBet={handleBet}
        handleCashout={handleCashout}
        gameState={gameState}
        loading={loading}
      />
    </div>
  );
});

export default Bet;