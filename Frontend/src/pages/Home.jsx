import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LightPillar from '../components/LightPillar';
import './Home.css';

const MagneticButton = ({ children, className, ...props }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="magnetic-wrap"
    >
      <button className={className} {...props}>
        {children}
      </button>
    </motion.div>
  );
};

const Home = () => {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const scrollToEvents = () => {
    const el = document.getElementById('events-explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-container" data-scroll-section>
      <div className="grain-overlay"></div>
      <div className="home-background">
        <LightPillar
          topColor={theme === 'dark' ? "#5227FF" : "#E0E0FF"}
          bottomColor={theme === 'dark' ? "#FF27B3" : "#F0F0FF"}
          intensity={theme === 'dark' ? 0.7 : 0.3}
          rotationSpeed={0.2}
          glowAmount={theme === 'dark' ? 0.002 : 0}
          pillarWidth={5}
          pillarHeight={0.6}
          noiseIntensity={0.3}
          pillarRotation={10}
          interactive={false}
          mixBlendMode={theme === 'dark' ? "plus-lighter" : "multiply"}
          quality="high"
        />
      </div>

      <div className="home-content">
        <nav className="navbar">
          <div className="nav-logo">EVENTIX</div>
          <div className="nav-right">
            {currentUser ? (
              <button className="nav-connect-btn" onClick={logout}>Sign Out</button>
            ) : (
              <Link to="/signin" className="nav-connect-btn" style={{ textDecoration: 'none' }}>Sign In</Link>
            )}
          </div>
        </nav>

        <main className="hero-section">
          <motion.p 
            className="hero-label-top"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            THE FUTURE OF EVENTS
          </motion.p>

          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1], delay: 0.4 }}
          >
            EVENTIX
          </motion.h1>

          <motion.p 
            className="hero-label-bottom"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            SCALE. INFINITE.
          </motion.p>

          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <MagneticButton className="btn btn-primary" onClick={() => navigate('/signin')}>START EVENT</MagneticButton>
            <MagneticButton className="btn btn-secondary" onClick={scrollToEvents}>EXPLORE</MagneticButton>
          </motion.div>
        </main>

        <div className="scroll-indicator">
          <span className="scroll-text">Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
