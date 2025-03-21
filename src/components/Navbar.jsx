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

  // Format the balance safely, ensuring it's a number
  const formatBalance = () => {
    if (balance === null || balance === undefined) {
      return '0.00';
    }
    
    // Convert to number if it's a string or other type
    const numBalance = typeof balance === 'number' ? balance : parseFloat(balance);
    
    // Check if valid number after conversion
    if (isNaN(numBalance)) {
      return '0.00';
    }
    
    return numBalance.toFixed(2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo">🎲 Betting Game</span>
      </div>
      
      <div className="navbar-user">
        <span className="username">👤 {username}</span>
        <span className="balance">💰 ${formatBalance()}</span>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
} 