import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mars, Venus, User, Globe } from 'lucide-react';
import logo from '../assets/logo.png';
import { countries } from '../utils/countries';

const Gender = () => {
  const [formData, setFormData] = useState({
    username: '',
    country: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setFormData({
          username: user.username || '',
          country: user.country || '',
          gender: user.gender || ''
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

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

    const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
    // If logged in, we might just be updating preference/profile locally or skipping to match
    // But for now, let's treat this as "Confirm Profile" before matching

    if (isLoggedIn) {
      // If already logged in, just update local storage (and ideally backend) then go to match
      const user = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Optimistic update
      // In a real app, send PUT /api/users/profile here
      navigate('/match');
      setLoading(false);
      return;
    }

    // Anonymous Login Flow
    const endpoint = BACKEND_URL
      ? `${BACKEND_URL.replace(/\/$/, '')}/api/auth/anonymous`
      : '/api/auth/anonymous';

    // Check if there's an existing user ID in localStorage (even if token expired)
    // This allows us to refresh the token instead of creating a duplicate user
    const existingUserStr = localStorage.getItem('user');
    let existingUserId = null;
    if (existingUserStr) {
      try {
        const existingUser = JSON.parse(existingUserStr);
        if (existingUser.id && existingUser.isAnonymous) {
          existingUserId = existingUser.id;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Include userId if available to refresh token for existing user
    const requestBody = {
      ...formData,
      ...(existingUserId && { userId: existingUserId })
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errMsg = `Request failed (${response.status})`;
        try {
          const errBody = await response.json();
          errMsg = errBody.message || errMsg;
        } catch (e) { }
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
      const hostInfo = BACKEND_URL || 'http://localhost:5001';
      setError(`Cannot connect to backend. Is it running?`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gender-container">
      {!isLoggedIn && (
        <button className="auth-btn" onClick={() => navigate('/auth')}>
          Login / Signup
        </button>
      )}

      <div className="gender-content-wrapper">
        <img src={logo} alt="Luvstor" className="gender-logo" />

        <h1 className="gender-welcome">{isLoggedIn ? 'Welcome Back!' : 'Chat Anonymously'}</h1>
        <p className="gender-intro">
          {isLoggedIn ? 'Confirm your details to start chatting.' : 'Start your anonymous chat journey. Fill in your details below.'}
        </p>

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
              disabled={isLoggedIn} // Maybe allow editing? For now disable username editing if logged in
            />
          </div>
          <div className="input-wrapper">
            <Globe className="input-icon" size={20} />
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="country-select"
            >
              <option value="" disabled>Select your country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
          {loading ? 'Connecting...' : (isLoggedIn ? 'Start Chatting' : 'Chat Anonymously')}
        </button>

        <style>{`
        .auth-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.9rem;
        }
        .auth-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: var(--accent-yellow, #ffd369);
          color: var(--accent-yellow, #ffd369);
        }
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
          pointer-events: none;
          z-index: 10;
        }
        .input-wrapper input, .input-wrapper select {
          width: 100%;
          padding: 12px 12px 12px 45px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 1rem;
          outline: none;
          appearance: none;
        }
        .input-wrapper select {
            cursor: pointer;
        }
        .input-wrapper select option {
            background: #2b2b2b; /* Fallback */
            color: white;
        }
        .input-wrapper input:focus, .input-wrapper select:focus {
          border-color: #ffd369;
          background: rgba(255,255,255,0.15);
        }
        /* Custom arrow for select */
        .country-select {
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 0.65em auto;
        }
        .error-msg {
          color: #ff6b6b;
          margin: 10px 0;
          font-size: 0.9rem;
        }
        .continue-btn {
          margin-top: 30px;
          border-radius: 30px;
          width: 100%;
          max-width: 250px;
          opacity: ${loading || !formData.gender || !formData.username || !formData.country ? 0.5 : 1};
          pointer-events: ${loading ? 'none' : 'auto'};
        }
      `}</style>
      </div>
    </div>
  );
};

export default Gender;
