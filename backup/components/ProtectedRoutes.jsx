// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';

const ProtectedRoute = ({ children }) => {
  const { token } = useGameStore();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
