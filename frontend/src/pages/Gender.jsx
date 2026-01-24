import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Gender = () => {
  const [selectedGender, setSelectedGender] = useState('');
  const navigate = useNavigate();

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    // Store gender in localStorage or context
    localStorage.setItem('userGender', gender);
    setTimeout(() => {
      navigate('/match');
    }, 300);
  };

  return (
    <div className="gender-container">
      <h2>Select Your Gender</h2>
      <div className="gender-options">
        <button
          className={selectedGender === 'male' ? 'selected' : ''}
          onClick={() => handleGenderSelect('male')}
          aria-pressed={selectedGender === 'male'}
        >
          👨 Male
        </button>
        <button
          className={selectedGender === 'female' ? 'selected' : ''}
          onClick={() => handleGenderSelect('female')}
          aria-pressed={selectedGender === 'female'}
        >
          👩 Female
        </button>
      </div>
    </div>
  );
};

export default Gender;
