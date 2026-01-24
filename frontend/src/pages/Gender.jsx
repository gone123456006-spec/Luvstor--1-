import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import logo from '../assets/logo.png';
import selectAnimation from '../assets/select-gender.json';

const Gender = () => {
  const [selectedGender, setSelectedGender] = useState(null);
  const navigate = useNavigate();

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    localStorage.setItem('userGender', gender);

    setTimeout(() => {
      navigate('/match');
    }, 400);
  };

  return (
    <div className="gender-container">
      <img src={logo} alt="Luvstor" className="gender-logo" />

      <Lottie
        animationData={selectAnimation}
        loop
        className="gender-animation"
      />

      <h2>Choose Your Gender</h2>
      <p className="gender-subtext">
        This helps us match you better. Your identity stays private.
      </p>

      <div className="gender-options">
        <button
          className={`gender-card ${selectedGender === 'male' ? 'active' : ''
            }`}
          onClick={() => handleGenderSelect('male')}
          aria-pressed={selectedGender === 'male'}
        >
          <svg className="gender-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M14 5L19 5L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 10L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="label">Male</span>
        </button>

        <button
          className={`gender-card ${selectedGender === 'female' ? 'active' : ''
            }`}
          onClick={() => handleGenderSelect('female')}
          aria-pressed={selectedGender === 'female'}
        >
          <svg className="gender-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M12 14L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 17L15 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="label">Female</span>
        </button>
      </div>
    </div>
  );
};

export default Gender;
