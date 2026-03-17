import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import LightPillar from '../components/LightPillar';
import { ADMIN_UID } from '../components/AdminRoute';
import './Auth.css';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signin, signup } = useAuth();

  const [isLogin, setIsLogin] = useState(location.pathname === '/signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/signin');
    setError('');
  }, [location.pathname]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await signin(email, password);
      if (userCredential.user.uid === ADMIN_UID) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to sign in. Check your credentials.');
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create account. ' + err.message);
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setError('');
    const newPath = isLogin ? '/signup' : '/signin';
    navigate(newPath);
  };

  const handleClose = (e) => {
    // Navigate home if clicking outside the card
    if (e.target.classList.contains('auth-page') || e.target.classList.contains('auth-background')) {
      navigate('/');
    }
  };

  return (
    <div className="auth-page" onClick={handleClose}>
      <div className="auth-background">
        <LightPillar
          topColor="#7000ff"
          bottomColor="#000000"
          intensity={0.6}
          rotationSpeed={0.05}
          glowAmount={0.002}
          pillarWidth={10}
          pillarHeight={0.6}
          mixBlendMode="screen"
        />
      </div>

      <div 
        className={`auth-wrapper ${!isLogin ? 'right-panel-active' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1 className="auth-title">Create Account</h1>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
            />
            <input 
              type="email" 
              className="auth-input" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Confirm Password" 
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required={!isLogin}
            />
            {error && !isLogin && <p className="auth-error">{error}</p>}
            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
            <div className="mobile-only" style={{marginTop: '20px', display: 'none'}}>
               Already have an account? <span onClick={toggleMode} style={{color: '#00f2ff', cursor: 'pointer'}}>Sign In</span>
            </div>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1 className="auth-title">Sign In</h1>
            <input 
              type="email" 
              className="auth-input" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            {/* <a href="#" className="forgot-link">Forgot your password?</a> */}
            {error && isLogin && <p className="auth-error">{error}</p>}
            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            <div className="mobile-only" style={{marginTop: '20px', display: 'none'}}>
               New here? <span onClick={toggleMode} style={{color: '#00f2ff', cursor: 'pointer'}}>Sign Up</span>
            </div>
          </form>
        </div>

        {/* Overlay Panels */}
        <div className="overlay-container">
          <h1 className="auth-brand-title">EVENTIX</h1>
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="auth-title">Join the Hub</h1>
              <p className="auth-subtitle">
                Reconnect with the community and manage your upcoming event experiences
              </p>
              <button className="auth-button ghost" onClick={toggleMode}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="auth-title">Join Us</h1>
              <p className="auth-subtitle">
                Create your account and unlock exclusive access to world-class hackathons
              </p>
              <button className="auth-button ghost" onClick={toggleMode}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Link to="/" style={{position: 'absolute', bottom: '20px', color: 'var(--text-secondary)', textDecoration: 'none', opacity: 0.6}}>
        ← Back to Home
      </Link>
    </div>
  );
};

export default Auth;
