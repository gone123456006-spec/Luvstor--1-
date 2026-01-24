import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/gender');
  };

  return (
    <div className="home-container">
      <h1>Welcome to Random Chat</h1>
      <p>Connect with random people and have interesting conversations.</p>
      <button onClick={handleStartChat}>Start Chatting</button>
    </div>
  );
};

export default Home;
