//zustand store/gameStore.js

import { create } from 'zustand';
import axios from 'axios';

axios.defaults.baseURL = 'https://842123ba1f919c6f6cd06de0c93da70f.serveo.net';
axios.defaults.withCredentials = true;

const useGameStore = create((set, get) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username') || '',
  role: localStorage.getItem('role') || '',
  balance: 0,
  multiplier: 1.0,
  gameRunning: false,
  nextGameTime: null,
  bets: [],
  balanceError: null,
  isBalanceLoading: false,
  lastBalanceUpdate: null,

  fetchBalance: async (force = false) => {
    const state = get();
    
    // Don't fetch if no username or token
    if (!state.username || !state.token) {
      console.log("Skipping balance fetch: No username or token");
      return;
    }
    
    // Don't fetch if already loading
    if (state.isBalanceLoading) {
      console.log("Skipping balance fetch: Already loading");
      return;
    }
    
    // Don't fetch if recently updated (within last 2 seconds) unless forced
    const now = Date.now();
    if (!force && state.lastBalanceUpdate && (now - state.lastBalanceUpdate < 2000)) {
      console.log("Skipping balance fetch: Recently updated");
      return;
    }
    
    try {
      console.log(`Fetching balance for user: ${state.username}, force: ${force}`);
      set({ isBalanceLoading: true, balanceError: null });
      const timestamp = now;
      const response = await axios.get(`/users/${state.username}/balance/?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      if (response.data && typeof response.data.balance === 'number') {
        const newBalance = response.data.balance;
        console.log(`Balance fetch successful: ${newBalance}`);
        set({ 
          balance: newBalance, 
          balanceError: null,
          lastBalanceUpdate: now,
          isBalanceLoading: false
        });
        return newBalance;
      } else {
        console.warn("Balance fetch returned invalid data:", response.data);
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      
      // Only set error if it's a real error, not a cancellation
      if (!axios.isCancel(error)) {
        set({ 
          balanceError: 'Error fetching balance',
          isBalanceLoading: false
        });
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Force logout on authentication error
          get().logout();
        }
      }
    } finally {
      set({ isBalanceLoading: false });
    }
  },

  // Initialize balance - call this on app start or page refresh
  initBalance: async () => {
    const state = get();
    console.log("Initializing balance");
    if (state.username && state.token) {
      await state.fetchBalance(true);
    }
  },

  // Update balance after a bet - always force a refresh from server
  updateBalanceAfterBet: async () => {
    console.log("Updating balance after bet - forcing refresh from server");
    await get().fetchBalance(true);
  },

  login: (token, username, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    set({ token, username, role });
    
    // Fetch balance immediately after login
    console.log("Logged in, fetching initial balance");
    get().fetchBalance(true);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    set({ 
      token: null, 
      username: '', 
      role: '', 
      balance: 0,
      balanceError: null,
      lastBalanceUpdate: null
    });
  },

  updateBalance: (balanceUpdater) => {
    let newBalance;
    set(state => {
      // If balanceUpdater is a function, call it with the current balance
      if (typeof balanceUpdater === 'function') {
        newBalance = balanceUpdater(state.balance);
      } else {
        // If it's a value, use it directly
        newBalance = balanceUpdater;
      }
      
      // Ensure the balance is a number
      if (typeof newBalance !== 'number' || isNaN(newBalance)) {
        console.error(`Invalid balance value: ${newBalance}, using 0 instead`);
        newBalance = 0;
      }
      
      console.log(`Balance updated locally: ${state.balance} -> ${newBalance}`);
      return { 
        balance: newBalance,
        lastBalanceUpdate: Date.now()
      };
    });
    return newBalance;
  },

  updateGameState: (state) => set(state)
}));

// Initialize balance when the store is created
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const store = useGameStore.getState();
    if (store.username && store.token) {
      console.log("Auto-initializing balance on store creation");
      store.initBalance();
    }
  }, 0);
}

export default useGameStore;
