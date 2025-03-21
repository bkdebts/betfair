import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import './Navbar.css';

export default function Navbar() {
  const { username, balance, logout } = useGameStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo">🎲 Betting Game</span>
      </div>
      
      <div className="navbar-user">
        <span className="username">👤 {username}</span>
        <span className="balance">💰 ${balance.toFixed(2)}</span>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
} 