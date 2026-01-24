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
    const newSocket = connectSocket();

    if (!newSocket) {
      setStatus('Connection failed. Please try again.');
      return;
    }

    setStatus('Looking for a match...');

    // Join queue logic
    newSocket.emit('joinQueue', { preference: 'both' });

    const handleMatchFound = (data) => {
      console.log('Match found:', data);
      navigate('/chat', { state: data });
    };

    const handleWaiting = () => {
      setStatus('Waiting for available partner...');
    };

    const handleError = (err) => {
      console.error(err);
      setStatus('Error connecting. Please try again.');
    };

    newSocket.on('matchFound', handleMatchFound);
    newSocket.on('waitingForMatch', handleWaiting);
    newSocket.on('error', handleError);

    return () => {
      newSocket.off('matchFound', handleMatchFound);
      newSocket.off('waitingForMatch', handleWaiting);
      newSocket.off('error', handleError);
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
