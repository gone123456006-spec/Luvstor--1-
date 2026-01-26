import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, Zap, Shield, MessageCircle, Instagram, Send } from 'lucide-react';
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
        <br />
        <h1>
          Meet New People
          <span>Anonymously</span>
        </h1>

        <p>
          Start anonymous conversations with
          <br />
          real people from around the world.
          <br />
          <strong>No sign-up. Just chat.</strong>
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

      <div className="brand-footer">
        <div className="social-links">
          <a href="https://www.instagram.com/luvstor.app?igsh=MW4wNHF2cDV3ZG03aw==-link" target="_blank" rel="noopener noreferrer" className="social-link">
            <Instagram size={20} />
          </a>
          <a href="https://t.me/Luvstorapp" target="_blank" rel="noopener noreferrer" className="social-link">
            <Send size={20} />
          </a>
        </div>
        By Brandoverts
      </div>
    </div>
  );
};

export default Home;
