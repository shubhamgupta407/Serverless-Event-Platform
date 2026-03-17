import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { db } from '../firebase';
import {
  collection, onSnapshot, query,
  orderBy, limit, getDocs
} from 'firebase/firestore';
import '../styles/Section1.css';

const RevealText = ({ text, className }) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={charIndex}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: (wordIndex * 5 + charIndex) * 0.02,
                ease: [0.19, 1, 0.22, 1],
              }}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const Section1 = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // --- Firestore State ---
  const [tickets, setTickets] = useState([]);
  const [arrivedList, setArrivedList] = useState([
    { id: 'd1', userId: 'Aman123', ticketCode: 'Premium', issuedAt: new Date() },
    { id: 'd2', userId: 'Sneha99', ticketCode: 'VIP', issuedAt: new Date(Date.now() - 300000) }
  ]);
  const [pendingCount, setPendingCount] = useState(2);
  const [checkedInCount, setCheckedInCount] = useState(128);
  const [totalCount, setTotalCount] = useState(150);
  const [revenueData, setRevenueData] = useState([40, 70, 100, 60, 85]);
  const [totalRevenue, setTotalRevenue] = useState(12450);
  const [totalSales, setTotalSales] = useState(24);
  const [notifCount, setNotifCount] = useState(3);

  // 1️⃣ Live ticket types from events collection
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(3));
    const unsub = onSnapshot(q, snap => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 2️⃣ Live check-in data from registrations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'registrations'), snap => {
      if (snap.empty) return;
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const confirmed = all.filter(r => r.status === 'confirmed');
      const pending = all.filter(r => r.status === 'pending');
      setCheckedInCount(confirmed.length);
      setPendingCount(pending.length);
      setTotalCount(all.length);
    });
    return () => unsub();
  }, []);

  // 3️⃣ Live arrived attendees from tickets
  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('issuedAt', 'desc'), limit(2));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) return;
      setArrivedList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 4️⃣ Analytics — revenue from registrations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'registrations'), snap => {
      if (snap.empty) return;
      const all = snap.docs.map(d => d.data());
      setTotalSales(all.length);
      const counts = [0, 0, 0, 0, 0];
      all.forEach((r, i) => { counts[i % 5]++; });
      const max = Math.max(...counts, 1);
      setRevenueData(counts.map(c => Math.round((c / max) * 100)));
      setTotalRevenue(all.length * 499);
    });
    return () => unsub();
  }, []);

  // 5️⃣ Unread announcements count
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'), snap => {
      if (snap.empty) return;
      setNotifCount(snap.size);
    });
    return () => unsub();
  }, []);

  const capacity = totalCount > 0
    ? Math.min(Math.round((checkedInCount / totalCount) * 100), 100)
    : 85; 

  const formatTime = (ts) => {
    if (!ts) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const ticketColors = ['p-g', 'p-v', 'p-e'];
  const ticketIcons = ['🎟', '⭐', '⚡'];

  return (
    <section className="features-section" ref={containerRef}>
      <div className="features-container" id="features" data-scroll-section>
        <div className="features-header">
          <h2 className="features-title">
            <RevealText text="Events Managed." />
            <br />
            <RevealText text="Zero Complexity." />
          </h2>
          <motion.p
            className="features-subtitle"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            Our serverless platform automates ticketing, check-ins,
            analytics, and notifications so you can focus on delivering great events.
          </motion.p>
        </div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >

          {/* Card 1: Smart Ticketing — DYNAMIC */}
          <motion.div className="glow-border-wrapper" variants={itemVariants}>
            <div className="glow-border-inner">
              <div className="feature-card">
                <div className="card-visual visual-ticketing">
                  <div className="visual-glint"></div>
                  <div className="visual-glow glow-orange"></div>
                  <div className="mock-ui mock-command-menu">
                    <div className="mock-search">
                      <span className="icon">🎟️</span>
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: "auto" }}
                        transition={{ duration: 1.5, ease: "steps(15)", delay: 0.5 }}
                        style={{ overflow: 'hidden', display: 'inline-block', whiteSpace: 'nowrap' }}
                      >
                        Search tickets...
                      </motion.span>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      >|</motion.span>
                    </div>

                    <motion.div
                      className="mock-items"
                      initial="hidden"
                      whileInView="visible"
                      variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1, delayChildren: 1.5 } }
                      }}
                    >
                      {tickets.length > 0 ? (
                        tickets.map((t, i) => (
                          <motion.div
                            key={t.id}
                            className={`mock-item ${i === 0 ? 'active' : ''}`}
                            variants={itemVariants}
                          >
                            <span>{ticketIcons[i % 3]} {t.title}</span>
                            <span className="mock-shortcut">
                              {t.price ? `₹${t.price}` : `₹${[499, 1499, 299][i % 3]}`}
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        // Fallback while loading
                        ['General Admission', 'VIP Pass', 'Early Bird'].map((name, i) => (
                          <motion.div
                            key={i}
                            className={`mock-item ${i === 0 ? 'active' : ''}`}
                            variants={itemVariants}
                          >
                            <span>{ticketIcons[i]} {name}</span>
                            <span className="mock-shortcut">
                              {['₹499', '₹1499', '₹299'][i]}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </div>
                </div>
                <div className="card-content">
                  <h3>Smart Ticketing.</h3>
                  <p>Create and sell tickets instantly. Support dynamic pricing and a secure booking system.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Real-Time Check-Ins — DYNAMIC */}
          <motion.div className="glow-border-wrapper card-wide" variants={itemVariants}>
            <div className="glow-border-inner">
              <div className="feature-card">
                <div className="card-visual visual-checkin">
                  <div className="visual-glint"></div>
                  <div className="visual-glow glow-blue"></div>
                  <div className="mock-ui mock-kanban">

                    {/* Live stats row */}
                    <div className="live-stats-row">
                      <div className="live-pill">
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.4 }}
                          className="live-dot"
                        />
                        LIVE
                      </div>
                      <div className="stat-chips">
                        <span className="chip chip-green">{checkedInCount} in</span>
                        <span className="chip chip-gray">{pendingCount} pending</span>
                        <span className="chip chip-blue">{capacity}% capacity</span>
                      </div>
                    </div>

                    <div className="mock-board-column">
                      <div className="column-header">Arrived</div>
                      {arrivedList.length > 0 ? (
                        arrivedList.map((a, i) => (
                          <motion.div
                            key={a.id}
                            className="mock-task"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.2 }}
                          >
                            <div className="task-title">{a.userId?.slice(0, 8) || 'Attendee'}</div>
                            <div className="task-meta">
                              {a.ticketCode || 'General'} • {formatTime(a.issuedAt)}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        // Fallback
                        ['Jane Doe', 'John Smith'].map((name, i) => (
                          <motion.div
                            key={i}
                            className="mock-task"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 + i * 0.2 }}
                          >
                            <div className="task-title">{name}</div>
                            <div className="task-meta">
                              {['VIP Pass', 'General'][i]} • {['10:05 AM', '10:12 AM'][i]}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    <div className="mock-board-column dim">
                      <div className="column-header">
                        Pending Validation
                        {pendingCount > 0 && (
                          <span className="count-badge">{pendingCount}</span>
                        )}
                      </div>
                      {[...Array(Math.min(pendingCount, 2) || 1)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="mock-task skeleton"
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <h3>Real-Time Check-Ins.</h3>
                  <p>QR code based entry with instant attendee verification and live tracking across all gates.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Live Analytics — DYNAMIC */}
          <motion.div className="glow-border-wrapper card-wide" variants={itemVariants}>
            <div className="glow-border-inner">
              <div className="feature-card">
                <div className="card-visual visual-analytics">
                  <div className="visual-glint"></div>
                  <div className="visual-glow glow-purple"></div>
                  <div className="mock-ui mock-chart">
                    <div className="chart-beam"></div>
                    <div className="chart-bars">
                      {revenueData.map((h, i) => (
                        <motion.div
                          key={i}
                          className="bar"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h || 10}%` }}
                          transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: "circOut" }}
                          style={i === 2 ? { background: 'var(--accent-prismatic)' } : {}}
                        />
                      ))}
                    </div>
                    <div className="chart-stats">
                      <div className="stat-pill">
                        <span className="dot pink"></span>
                        ₹{totalRevenue.toLocaleString()} revenue
                      </div>
                      <div className="stat-pill">
                        <span className="dot blue"></span>
                        {totalSales} sales
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-content">
                  <h3>Live Analytics.</h3>
                  <p>Monitor ticket sales, track attendance patterns, and gain actionable revenue insights instantly.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Automated Notifications — DYNAMIC */}
          <motion.div className="glow-border-wrapper" variants={itemVariants}>
            <div className="glow-border-inner">
              <div className="feature-card">
                <div className="card-visual visual-notifications">
                  <div className="visual-glint"></div>
                  <div className="visual-glow glow-multi ring-spin"></div>
                  <motion.div
                    className="notification-bell"
                    animate={{
                      rotate: [0, -10, 10, -10, 10, 0],
                      y: [0, -2, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 2 }}
                  >
                    <span className="bell-icon">🔔</span>
                    <motion.span
                      className="badge"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1.5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.8 }}
                      key={notifCount}
                    >
                      {notifCount > 0 ? notifCount : 3}
                    </motion.span>
                  </motion.div>
                </div>
                <div className="card-content">
                  <h3>Automated Notifications.</h3>
                  <p>Send event reminders, schedule updates, via email and push notifications automatically.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default Section1;