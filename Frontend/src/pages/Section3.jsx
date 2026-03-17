import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Section3.css';

const Section3 = () => {
  return (
    <footer className="section3-container" data-scroll-section>
      <div className="footer-top">
        {/* Brand Presence */}
        <div className="footer-brand">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Empowering <span className="serif-italic">experiences</span> that shape the <span className="serif-italic">future</span>
          </motion.h2>

          {/* <div className="newsletter-wrap">
            <span className="newsletter-label">Neural Subscription</span>
            <div className="newsletter-form">
              <input type="email" placeholder="Your Email address" />
              <button className="newsletter-submit">JOIN</button>
            </div>
            <div className="live-status">
              <div className="pulse-dot"></div>
              <span>All Systems Operational</span>
            </div>
          </div> */}
        </div>

        {/* Navigation Layers */}
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="#events">Latest Events</a></li>
            <li><a href="#about">Our Story</a></li>
            <li><a href="#services">Security</a></li>
            <li><a href="#careers">Hackathons</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><a href="/signin">Sign In</a></li>
            <li><a href="/signup">Sign Up</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/admin">Admin Hub</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Connect</h4>
          <ul>
            <li><a href="https://instagram.com">Instagram</a></li>
            <li><a href="https://twitter.com">Twitter (X)</a></li>
            <li><a href="https://linkedin.com">LinkedIn</a></li>
            <li><a href="https://discord.com">Discord</a></li>
          </ul>
        </div>
      </div>

      {/* Bleeding Watermark */}
      <div className="giant-watermark">
        Eventix
      </div>

      {/* Minimal Bottom Copyright */}
      <div className="footer-bottom">
        <p className="copyright-text">
        </p>
      </div>
    </footer>
  );
};

export default Section3;
