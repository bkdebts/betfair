import { useState } from 'react';
import axios from 'axios';
import useGameStore from '../store/gameStore';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

axios.defaults.baseURL = 'https://842123ba1f919c6f6cd06de0c93da70f.serveo.net';
axios.defaults.withCredentials = true;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useGameStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending login request to:', axios.defaults.baseURL + '/api/v1/login');
      const response = await axios.post('/api/v1/login', { email, password });
      console.log('Login response:', response.data);
      const { access_token, username, role } = response.data;
      login(access_token, username, role);
      if (role === 'manager') {
        navigate('/man');
      } else {
        navigate('/welcome');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const { access_token, username, role } = response.data;
      login(access_token, username, role);

      if (role === 'manager') {
        navigate('/man');
      } else {
        navigate('/welcome');
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome Back!</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}