import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Mars, Venus, User, Globe } from 'lucide-react';
import logo from '../assets/logo.png';
import selectAnimation from '../assets/select-gender.json';

const Gender = () => {
  const [formData, setFormData] = useState({
    username: '',
    country: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.country || !formData.gender) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // Support an optional env var `VITE_BACKEND_URL`. If not set, use Vite dev proxy at `/api`.
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const endpoint = BACKEND_URL
      ? `${BACKEND_URL.replace(/\/$/, '')}/api/auth/anonymous`
      : '/api/auth/anonymous';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Try to parse error body if available
        let errMsg = `Request failed (${response.status})`;
        try {
          const errBody = await response.json();
          errMsg = errBody.message || errMsg;
        } catch (e) {}
        setError(errMsg);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/match');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      // Network or CORS error
      const hostInfo = BACKEND_URL || 'http://localhost:5000 (via Vite proxy at /api)';
      setError(`Cannot connect to backend at ${hostInfo}. Is it running?`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gender-container">
      <div className="gender-content-wrapper">
        <img src={logo} alt="Luvstor" className="gender-logo" />

        <h1 className="gender-welcome">Welcome to Luvstor!</h1>
        <p className="gender-intro">Start your anonymous chat journey. Fill in your details below to get started.</p>

        {/* Inputs Section */}
        <div className="input-group">
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="input-wrapper">
            <Globe className="input-icon" size={20} />
            <input
              type="text"
              name="country"
              placeholder="Enter your country"
              value={formData.country}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <h2>Choose Your Gender</h2>

        <div className="gender-options">
          <button
            className={`gender-card ${formData.gender === 'male' ? 'active' : ''}`}
            onClick={() => handleGenderSelect('male')}
            type="button"
          >
            <Mars className="gender-icon" strokeWidth={1.5} />
            <span className="label">Male</span>
          </button>

          <button
            className={`gender-card ${formData.gender === 'female' ? 'active' : ''}`}
            onClick={() => handleGenderSelect('female')}
            type="button"
          >
            <Venus className="gender-icon" strokeWidth={1.5} />
            <span className="label">Female</span>
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button
          className="start-btn continue-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Continue'}
        </button>

        <style>{`
        .gender-logo {
          width: 150px;
          height: auto;
          margin-top: -20px;
          margin-bottom: 10px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
          width: 100%;
          max-width: 320px;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          color: rgba(255,255,255,0.6);
        }
        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 45px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 1rem;
          outline: none;
        }
        .input-wrapper input:focus {
          border-color: #ffd369;
          background: rgba(255,255,255,0.15);
        }
        .error-msg {
          color: #ff6b6b;
          margin: 10px 0;
          font-size: 0.9rem;
        }
        .continue-btn {
          margin-top: 30px;
          width: 100%;
          max-width: 200px;
          opacity: ${loading || !formData.gender || !formData.username ? 0.5 : 1};
          pointer-events: ${loading ? 'none' : 'auto'};
        }
      `}</style>
      </div>
    </div>
  );
};

export default Gender;
