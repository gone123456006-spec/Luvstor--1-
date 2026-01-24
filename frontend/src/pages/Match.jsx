import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Match = () => {
  const [isSearching, setIsSearching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate finding match after 3-5 seconds
    const timer = setTimeout(() => {
      if (isSearching) {
        navigate('/chat');
      }
    }, Math.random() * 2000 + 3000);

    return () => clearTimeout(timer);
  }, [isSearching, navigate]);

  const handleCancel = () => {
    setIsSearching(false);
    navigate('/');
  };

  return (
    <div className="match-container">
      <h2>Finding your match...</h2>
      {isSearching && (
        <div className="loading-spinner">
          <p>Connecting you with someone...</p>
        </div>
      )}
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
};

export default Match;
