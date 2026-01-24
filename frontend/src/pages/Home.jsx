import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Zap, Shield } from 'lucide-react';
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
          <div>
            <UserCircle2 size={24} className="feature-icon" />
            <span>Anonymous</span>
          </div>
          <div>
            <Zap size={24} className="feature-icon" />
            <span>Instant Match</span>
          </div>
          <div>
            <Shield size={24} className="feature-icon" />
            <span>Secure Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
