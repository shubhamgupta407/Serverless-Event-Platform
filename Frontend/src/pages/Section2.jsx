import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { registerForEvent } from '../services/registrationService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';
import '../styles/Section2.css';

const categories = ['All', 'Hackathons'];

const Section2 = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });

  // Background transition logic
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const baseBgColor = useTransform(
    scrollYProgress,
    [0, 1],
    ["#000000", "#0a0b1e"]
  );

  // Smooth the color transition with a spring
  const bgColor = useSpring(baseBgColor, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    // Remove orderBy to ensure compatibility with documents missing createdAt
    const q = query(collection(db, 'events'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Manually sort by createdAt if it exists, otherwise by title or date
      const sortedDocs = docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setEvents(sortedDocs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Section2 Firestore Error:", err);
      setError("Failed to sync with network. Check permissions.");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter(e => {
      const cat = e.category?.toLowerCase() || '';
      return cat.includes('hack');
    });

  const handleRegister = async (event) => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    try {
      // 1. Load Razorpay Script
      const loadScript = (src) => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 2. Create Order on Backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: event.price || 0,
          currency: 'INR',
          receipt: `rcpt_${event.id.slice(0, 10)}_${currentUser.uid.slice(0, 10)}`
        })
      });
      const orderData = await orderRes.json();

      // 3. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EventPlatform",
        description: `Registration for ${event.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          // 4. On Success: Use registrationService
          try {
            const registrationData = {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: event.price || 0,
              participationType: 'Individual', // Default for landing page
              teamMembers: [{ name: currentUser.displayName || "", email: currentUser.email, phone: "" }],
              // Metadata for ticket view
              title: event.title,
              date: event.date || 'TBD',
              location: event.location || 'TBA'
            };

            const success = await registerForEvent(currentUser.uid, event.id, registrationData);

            if (success) {
              // --- EMAILJS INTEGRATION ---
              try {
                const emailParams = {
                  user_name: currentUser.displayName || currentUser.email.split('@')[0] || "Attendee",
                  email: currentUser.email,
                  event_name: event.title,
                  event_date: event.date || 'TBD',
                  event_location: event.location || 'TBA',
                  ticket_id: response.razorpay_payment_id || `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                  qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Attendee: ${currentUser.displayName || "Attendee"}, Ticket: ${response.razorpay_payment_id}`)}`,
                  to_name: currentUser.displayName || "Attendee",
                  to_email: currentUser.email
                };

                await emailjs.send(
                  import.meta.env.VITE_EMAIL_SERVICE_ID || import.meta.env.VITE_EMAILJS_SERVICE_ID,
                  import.meta.env.VITE_EMAIL_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                  emailParams,
                  import.meta.env.VITE_EMAIL_PUBLIC_KEY || import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                );
                console.log("Confirmation email sent successfully!");
              } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
              }
              // ---------------------------

              alert('Registration Successful! Your ticket has been generated and emailed to you.');
            } else {
              alert("Payment successful but database update failed. Please contact support.");
            }
          } catch (err) {
            console.error("Registration Service Error:", err);
            alert("Something went wrong with the registration.");
          }
        },
        prefill: {
          email: currentUser.email,
          name: currentUser.displayName || ""
        },
        theme: {
          color: "#7000ff"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Failed to initiate registration. Is the backend running?");
    }
  };

  return (
    <motion.section
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
      className="section2-container"
      id="events-explore"
      data-scroll-section
    >
      <div className="section2-inner">
        <div className="section2-header">
          <motion.h2
            className="section2-title"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            Events for you
          </motion.h2>

          <motion.div
            className="filter-bar"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="category-scroll">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="events-grid-marquee">
          {loading && (
            <div className="sync-loader">
              SYNCING WITH NETWORK...
            </div>
          )}
          <div
            className="marquee-track"
            style={{
              animationPlayState: isInView ? 'running' : 'paused'
            }}
          >
            {/* First set of events */}
            {filteredEvents.map((event, index) => (
              <div key={`${event.id}-1`} className="event-card-premium">
                <div className="card-visual-layer">
                  <img src={event.image || '/api/placeholder/800/500'} alt={event.title} />
                  <div className="card-glass-details">
                    <span className="event-label">{event.category}</span>
                    <div className="price-tag">
                      <span className="from">FROM</span>
                      <span className="amount">₹{event.price || 0}</span>
                    </div>
                  </div>
                  <div className="spotlight-overlay">
                    <button onClick={() => handleRegister(event)} className="glow-cta">
                      Register Now
                    </button>
                  </div>
                </div>
                <div className="card-text-layer">
                  <div className="date-pill">{event.date}</div>
                  <h3>{event.title}</h3>
                  <p className="loc-text">
                    <span className="pin">📍</span> {event.location}
                  </p>
                </div>
              </div>
            ))}
            {/* Exact duplicate for seamless loop */}
            {filteredEvents.map((event, index) => (
              <div key={`${event.id}-2`} className="event-card-premium">
                <div className="card-visual-layer">
                  <img src={event.image || '/api/placeholder/800/500'} alt={event.title} />
                  <div className="card-glass-details">
                    <span className="event-label">{event.category}</span>
                    <div className="price-tag">
                      <span className="from">FROM</span>
                      <span className="amount">₹{event.price || 0}</span>
                    </div>
                  </div>
                  <div className="spotlight-overlay">
                    <button onClick={() => handleRegister(event)} className="glow-cta">
                      Register Now
                    </button>
                  </div>
                </div>
                <div className="card-text-layer">
                  <div className="date-pill">{event.date}</div>
                  <h3>{event.title}</h3>
                  <p className="loc-text">
                    <span className="pin">📍</span> {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!loading && (error || filteredEvents.length === 0) && (
          <div className="empty-state-innovative">
            <div className="empty-icon">{error ? '⚠️' : '📂'}</div>
            <h3>{error ? 'Protocol Error' : 'No Active Events'}</h3>
            <p>{error || "We're currently curating new experiences. Check back soon!"}</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default Section2;
