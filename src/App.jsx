import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useGameStore from './store/gameStore';
import Game from './components/Game';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Welcome from './components/Welcome';
import './App.css';
import ManagerConsole from './components/man';
import Settings from './components/Settings';
import TopUp from './components/TopUp';
import ChanceToss from './components/Chance_toss';
import Shuffle from './components/Shuffle';
import MineMyst from './components/MineMyst';

function App() {
  const { token, role, initBalance } = useGameStore();

  const memoizedInitBalance = useCallback(() => {
    if (token) {
      initBalance();
    }
  }, [token, initBalance]);

  useEffect(() => {
    memoizedInitBalance();
  }, [memoizedInitBalance]);

  return (
    <Router>
      <div className="app">
        {token && role !== 'manager' && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!token ? <Login /> : <Navigate to={role === 'manager' ? '/man' : '/welcome'} />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to={role === 'manager' ? '/man' : '/welcome'} />} />
            <Route path="/welcome" element={token ? (role === 'manager' ? <Navigate to="/man" /> : <Welcome />) : <Navigate to="/login" />} />
            <Route path="/game" element={token ? (role === 'manager' ? <Navigate to="/man" /> : <Game />) : <Navigate to="/login" />} />
            <Route path="/man" element={token ? <ManagerConsole /> : <Navigate to="/login" />} />
            <Route path="/fate-shuffle" element={token ? <Shuffle /> : <Navigate to="/login" />} />
            <Route path="/minemyst" element={token ? <MineMyst /> : <Navigate to="/login" />} />
            <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/topup" element={token ? <TopUp /> : <Navigate to="/login" />} />
            <Route path="/chance-toss" element={token ? <ChanceToss /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
