import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserTickets } from "../../services/registrationService";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../Dashboard.css";

export default function TicketsView() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (currentUser?.uid) {
        const userTickets = await getUserTickets(currentUser.uid);
        setTickets(userTickets);
      }
      setLoading(false);
    };
    fetchTickets();
  }, [currentUser]);

  if (loading) {
    return <div className="loader">Loading Tickets...</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="view-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="section-title">My Tickets</h3>

      {tickets.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🎟️</div>
          <h4>No Tickets Yet</h4>
          <p>You haven't purchased or RSVP'd to any events yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Browse Events</button>
        </div>
      ) : (
        <motion.div
          className="events-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {tickets.map(ticket => (
            <motion.div key={ticket.id} variants={itemVariants} className="event-card" style={{ borderTop: '4px solid var(--primary-accent)', position: 'relative' }}>
              {ticket.image && (
                <img src={ticket.image} alt={ticket.title} className="event-card-banner" style={{ height: '140px' }} />
              )}
              <div className="event-card-header" style={{ marginBottom: '0.8rem' }}>
                <h3 className="event-title">{ticket.title}</h3>
                <span className="event-badge">✓ {ticket.status || 'CONFIRMED'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--secondary-accent)', fontFamily: 'monospace', fontSize: '1.1rem', margin: 0, letterSpacing: '2px', fontWeight: 'bold' }}>
                  {ticket.ticketId}
                </p>
                <div style={{ width: '40px', height: '40px', background: '#fff', padding: '4px', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '100%', height: '100%', border: '2px solid #000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '20%', left: '20%', right: '20%', bottom: '20%', background: '#000' }}></div>
                  </div>
                </div>
              </div>

              <div className="event-meta">
                <span className="event-date" style={{ opacity: 0.7, color: 'var(--text-secondary)' }}>📅 {ticket.date || 'TBD'}</span>
                <span className="event-location" style={{ opacity: 0.7, color: 'var(--text-secondary)' }}>📍 {ticket.location || 'TBA'}</span>
              </div>

              <div style={{ background: 'var(--input-bg)', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>PROTOCOL:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>
                    {ticket.participationType?.toUpperCase()} {ticket.teamName && `[${ticket.teamName}]`}
                  </span>
                </div>

                {ticket.teamMembers && ticket.teamMembers.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {ticket.teamMembers.map((member, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>• {member.name || 'N/A'}</span>
                          <span style={{ color: 'var(--secondary-accent)', opacity: 0.8 }}>{member.email?.slice(0, 15)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CREDITS PAID:</span>
                    <span className="price-tag">{ticket.amount > 0 ? `₹${ticket.amount}` : 'FREE'}</span>
                  </div>
                  {ticket.paymentId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6, letterSpacing: '0.5px' }}>
                      <span>SIG: {ticket.paymentId}</span>
                      <span>NODE: {ticket.order_id || ticket.orderId?.slice(-8)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="event-footer" style={{ marginTop: '2rem' }}>
                <button className="btn btn-secondary btn-full neon-border-pulse">
                  Download Pass (.PDF)
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
