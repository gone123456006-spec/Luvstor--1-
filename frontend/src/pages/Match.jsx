import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import logo from '../assets/logo.png';
import searchingAnimation from '../assets/searching.json';

const Match = () => {
  const navigate = useNavigate();
  const { socket, connectSocket, disconnectSocket } = useSocket();
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    console.log('[Match] Component mounted');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('[Match] Token exists:', !!token);
    console.log('[Match] User data:', user ? JSON.parse(user) : 'No user data');

    if (!token) {
      console.error('[Match] No token found, redirecting to home');
      setStatus('Authentication required. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const newSocket = connectSocket();

    if (!newSocket) {
      console.error('[Match] Failed to create socket connection');
      setStatus('Connection failed. Please try again.');
      return;
    }

    console.log('[Match] Socket created, waiting for connection...');

    newSocket.on('connect', () => {
      console.log('[Match] Socket connected successfully!', newSocket.id);
      setStatus('Looking for a match...');

      // Join queue logic
      console.log('[Match] Emitting joinQueue event');
      newSocket.emit('joinQueue', { preference: 'both' });
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Match] Socket connection error:', error);
      setStatus('Connection error. Please check backend.');
    });

    const handleMatchFound = (data) => {
      console.log('[Match] Match found:', data);
      navigate('/chat', { state: data });
    };

    const handleWaiting = () => {
      console.log('[Match] Waiting for match...');
      setStatus('Waiting for available partner...');
    };

    const handleError = (err) => {
      console.error('[Match] Error received:', err);
      setStatus('Error connecting. Please try again.');
    };

    newSocket.on('matchFound', handleMatchFound);
    newSocket.on('waitingForMatch', handleWaiting);
    newSocket.on('error', handleError);

    return () => {
      console.log('[Match] Cleaning up socket listeners');
      newSocket.off('matchFound', handleMatchFound);
      newSocket.off('waitingForMatch', handleWaiting);
      newSocket.off('error', handleError);
      newSocket.off('connect');
      newSocket.off('connect_error');
    };
  }, [navigate, connectSocket]);

  const handleCancel = () => {
    disconnectSocket();
    navigate('/');
  };

  return (
    <div className="match-container">
      <img src={logo} alt="Luvstor" className="match-logo" />

      <Lottie
        animationData={searchingAnimation}
        loop
        className="match-animation"
      />

      <h2>Finding the best match for you</h2>
      <p className="match-subtext">
        {status}
      </p>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '100%', animation: 'progressIndeterminate 2s infinite linear' }} />
      </div>

      <button className="cancel-btn" onClick={handleCancel}>
        <X size={18} />
        Cancel Search
      </button>

      <style>{`
        @keyframes progressIndeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Match;
