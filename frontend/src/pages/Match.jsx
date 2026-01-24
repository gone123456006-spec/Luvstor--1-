import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import logo from '../assets/logo.png';
import searchingAnimation from '../assets/searching.json';

const Match = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 5 : 100));
    }, 150);

    const matchTimer = setTimeout(() => {
      navigate('/chat');
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(matchTimer);
    };
  }, [navigate]);

  const handleCancel = () => {
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
        Connecting you with someone who’s online right now...
      </p>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button className="cancel-btn" onClick={handleCancel}>
        Cancel Search
      </button>
    </div>
  );
};

export default Match;
