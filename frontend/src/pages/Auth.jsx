import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { User, Mail, Lock, Globe, Mars, Venus } from 'lucide-react';
import { countries } from '../utils/countries';

const Auth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        country: '',
        gender: '',
        interests: []
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenderSelect = (gender) => {
        setFormData(prev => ({ ...prev, gender }));
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            username: '',
            email: '',
            password: '',
            country: '',
            gender: '',
            interests: []
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const endpoint = isLogin
            ? `${BACKEND_URL}/api/auth/login`
            : `${BACKEND_URL}/api/auth/signup`;

        const payload = isLogin
            ? { identifier: formData.email || formData.username, password: formData.password }
            : formData;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/match');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <img src={logo} alt="Luvstor" className="auth-logo" />
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-subtitle">
                    {isLogin ? 'Login to continue chatting' : 'Join Luvstor today'}
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="input-group">
                            <div className="input-wrapper">
                                <User size={18} />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="text"
                                name={isLogin ? "identifier" : "email"}
                                placeholder={isLogin ? "Username or Email" : "Email Address"}
                                value={isLogin ? (formData.identifier || '') : formData.email}
                                onChange={(e) => isLogin ? setFormData({ ...formData, identifier: e.target.value }) : handleInputChange(e)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <Globe size={18} />
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        required
                                        className="country-select"
                                    >
                                        <option value="" disabled>Select Country</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="gender-selection">
                                <button
                                    type="button"
                                    className={formData.gender === 'male' ? 'active' : ''}
                                    onClick={() => handleGenderSelect('male')}
                                >
                                    <Mars size={16} /> Male
                                </button>
                                <button
                                    type="button"
                                    className={formData.gender === 'female' ? 'active' : ''}
                                    onClick={() => handleGenderSelect('female')}
                                >
                                    <Venus size={16} /> Female
                                </button>
                            </div>
                        </>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={toggleMode} className="link-btn">
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

            <style>{`
                .auth-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1a1a1a;
                    padding: 20px;
                }
                .auth-card {
                    background: #2b2b2b;
                    padding: 40px;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .auth-logo {
                    width: 120px;
                    margin-bottom: 20px;
                }
                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin: 30px 0;
                }
                .input-wrapper {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    padding: 0 15px;
                    transition: all 0.3s;
                }
                .input-wrapper:focus-within {
                    border-color: #ffd369;
                    background: rgba(255,255,255,0.1);
                }
                .input-wrapper svg {
                    color: rgba(255,255,255,0.5);
                }
                .input-wrapper input, .input-wrapper select {
                    width: 100%;
                    padding: 15px;
                    background: none;
                    border: none;
                    color: white;
                    outline: none;
                }
                .gender-selection {
                    display: flex;
                    gap: 10px;
                }
                .gender-selection button {
                    flex: 1;
                    padding: 10px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    transition: all 0.3s;
                }
                .gender-selection button.active {
                    background: #ffd369;
                    color: black;
                    border-color: #ffd369;
                }
                .submit-btn {
                    background: #ffd369;
                    color: black;
                    padding: 15px;
                    border-radius: 10px;
                    border: none;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                    margin-top: 10px;
                }
                .submit-btn:hover {
                    transform: translateY(-2px);
                }
                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .error-message {
                    color: #ff6b6b;
                    font-size: 0.9rem;
                    background: rgba(255, 107, 107, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                }
                .link-btn {
                    background: none;
                    border: none;
                    color: #ffd369;
                    cursor: pointer;
                    text-decoration: underline;
                    font-size: 1rem;
                }
                .country-select {
                    appearance: none;
                    cursor: pointer;
                }
                .country-select option {
                    background: #2b2b2b;
                }
            `}</style>
        </div>
    );
};

export default Auth;
