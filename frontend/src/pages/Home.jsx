import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Home = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/gender');
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <img src={logo} alt="Luvstor Logo" className="logo" />

        <h1>
          Meet New People <br />
          <span>Randomly. Instantly.</span>
        </h1>

        <p>
          Start anonymous conversations with real people from around the world.
          No sign-up. No pressure. Just chat.
        </p>

        <button className="start-btn" onClick={handleStartChat}>
          Start Chatting
        </button>

        <div className="features">
          <div>Anonymous</div>
          <div>Instant Match</div>
          <div>Secure Chat</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
