import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { X } from 'lucide-react';
import logo from '../assets/logo.png';
import searchingAnimation from '../assets/searching.json';

const Match = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token) {
      setStatus('Authentication required. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    let intervalId;

    const joinQueue = async () => {
      try {
        setStatus('Joining queue...');
        const response = await fetch(`${BACKEND_URL}/api/chat/queue/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preference: 'both' })
        });

        if (!response.ok) throw new Error('Failed to join queue');

        setStatus('Looking for a match...');

        // Start polling
        intervalId = setInterval(checkMatchStatus, 2000); // Poll every 2 seconds
      } catch (error) {
        console.error('Queue join error:', error);
        setStatus('Error joining queue. Please try again.');
      }
    };

    const checkMatchStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/queue/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) return; // Keep trying or handle error

        const data = await response.json();

        if (data.status === 'matched') {
          clearInterval(intervalId);
          navigate('/chat', { state: data });
        } else if (data.status === 'searching') {
          // Still searching
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    joinQueue();

    return () => {
      if (intervalId) clearInterval(intervalId);
      // Optional: Leave queue on unmount if not matched? 
      // User might just be refreshing or navigating. 
      // Ideally we leave queue only if cancelling.
    };
  }, [navigate]);

  const handleCancel = async () => {
    try {
      const token = localStorage.getItem('token');
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${BACKEND_URL}/api/chat/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) { console.error(e); }
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
