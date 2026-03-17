import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle Theme"
    >
      <div className={`toggle-icon ${theme === 'dark' ? 'sun' : 'moon'}`}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </div>
    </motion.button>
  );
};

export default ThemeToggle;
