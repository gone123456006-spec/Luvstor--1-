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

    const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

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

        if (!response.ok) {
          let errorMessage = 'Failed to join queue';
          let errorCode = null;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            errorCode = errorData.code || null;
          } catch (e) {
            // Fallback to text if not JSON (e.g. HTML error page)
            try {
              const errorText = await response.text();
              errorMessage = errorText.substring(0, 100) || errorMessage;
            } catch (textErr) {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
          }
          
          // Handle 401 errors (expired token, unauthorized)
          if (response.status === 401) {
            const userStr = localStorage.getItem('user');
            const isAnonymous = userStr ? (JSON.parse(userStr).isAnonymous || false) : false;
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            setTimeout(() => {
              navigate('/gender');
            }, 1500);
          }
          
          throw new Error(errorMessage);
        }

        setStatus('Looking for a match...');

        // Start polling
        intervalId = setInterval(checkMatchStatus, 2000); // Poll every 2 seconds
      } catch (error) {
        console.error('Queue join error:', error);

        // Provide more specific error messages
        let errorMessage = 'Error joining queue. Please try again.';

        if (error.message) {
          errorMessage = error.message;
        }

        // Check for common issues
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('expired')) {
          errorMessage = 'Session expired. Redirecting to login...';
          // Note: Redirect is already handled in the response handler above
        } else if (error.message?.includes('500') || error.message?.includes('Server error')) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        }

        setStatus(errorMessage);
      }
    };

    const checkMatchStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/queue/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Handle 401 errors (expired token)
          if (response.status === 401) {
            clearInterval(intervalId);
            const userStr = localStorage.getItem('user');
            const isAnonymous = userStr ? (JSON.parse(userStr).isAnonymous || false) : false;
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            navigate('/gender');
          }
          return; // Keep trying for other errors
        }

        const data = await response.json();

        if (data.status === 'matched') {
          clearInterval(intervalId);
          navigate('/chat', { state: data });
        } else if (data.status === 'searching') {
          // Still searching
        }
      } catch (error) {
        console.error('Polling error:', error);
        // If it's a network error, we'll keep trying
        // If it's an auth error, it will be caught by the response check above
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
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
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
