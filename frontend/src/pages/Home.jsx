import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Zap, Shield, MessageCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const Home = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/gender');
  };

  return (
    <div className="home-container">
      {/* Animated Chat Bubbles Background */}
      <div className="chat-bubbles-bg">
        {[...Array(12)].map((_, i) => (
          <MessageCircle
            key={i}
            className="floating-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              fontSize: `${20 + Math.random() * 40}px`,
              opacity: 0.1 + Math.random() * 0.15
            }}
          />
        ))}
      </div>

      <div className="home-content">
        <img src={logo} alt="Luvstor Logo" className="logo" />

        <h1>
          Meet New People <br />
          <span>Anonymous.</span>
        </h1>

        <p>
          Start anonymous conversations with real people from around the world.
          <br />
          No sign-up. No record. Just chat.
        </p>

        <button className="start-btn" onClick={handleStartChat}>
          Start Chat
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
