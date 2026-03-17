import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, orderBy, query, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { registerForEvent, getUserRegisteredEventIds } from "../../services/registrationService";
import emailjs from '@emailjs/browser';
import "../Dashboard.css";

export default function EventsView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participationType, setParticipationType] = useState('Individual');
  const [teamSize, setTeamSize] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '', phone: '' }]); // Array of member objects
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

    // Use onSnapshot for real-time seat tracking on the user side too!
    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    const fetchRegistrations = async () => {
      if (currentUser?.uid) {
        const ids = await getUserRegisteredEventIds(currentUser.uid);
        setRegisteredEvents(new Set(ids));
      }
    };

    fetchRegistrations();

    return () => unsubscribeEvents();
  }, [currentUser]);

  const handleOpenModal = (event) => {
    setSelectedEvent(event);
    setParticipationType('Individual');
    setTeamSize(1);
    setTeamName('');
    setTeamMembers([{ name: '', email: '', phone: '' }]);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handlePaymentAndRegister = async () => {
    if (!currentUser || !selectedEvent) return;

    // Validation
    if (participationType === 'Team') {
      if (!teamName.trim()) {
        alert("Please enter a Team Name.");
        return;
      }
      if (teamMembers.some(member => !member.name.trim() || !member.email.trim() || !member.phone.trim())) {
        alert("Please fill out all details (Name, Email, Phone) for every team member.");
        return;
      }
    } else {
      if (!teamMembers[0]?.name.trim() || !teamMembers[0]?.email.trim() || !teamMembers[0]?.phone.trim()) {
        alert("Please enter your full details (Name, Email, Phone).");
        return;
      }
    }

    setRegistering(true);

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
        setRegistering(false);
        return;
      }

      // Calculate Total Price
      const basePrice = selectedEvent.price || 0;
      const finalPrice = participationType === 'Team' ? basePrice * teamSize : basePrice;

      // 2. Create Order on Backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          currency: 'INR',
          receipt: `rcpt_${selectedEvent.id.slice(0, 10)}_${currentUser.uid.slice(0, 10)}`
        })
      });
      const orderData = await orderRes.json();

      if (!orderData.id) throw new Error("Failed to create Razorpay order");

      // 3. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EventPlatform",
        description: `Registration for ${selectedEvent.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          // 4. On Success: Call Registration Service
          const registrationData = {
            participationType,
            teamSize: participationType === 'Team' ? teamSize : 1,
            teamName: participationType === 'Team' ? teamName : null,
            teamMembers,
            paymentStatus: 'Paid',
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            amount: finalPrice,
            // Metadata for ticket view consistency
            title: selectedEvent.title,
            date: selectedEvent.date || 'TBD',
            location: selectedEvent.location || 'TBA',
            image: selectedEvent.image || ''
          };

          const success = await registerForEvent(currentUser.uid, selectedEvent.id, registrationData);

          if (success) {
            setRegisteredEvents(prev => new Set(prev).add(selectedEvent.id));

            // --- EMAILJS INTEGRATION ---
            try {
              const emailParams = {
                user_name: currentUser.displayName || currentUser.email.split('@')[0] || "Attendee",
                email: currentUser.email,
                event_name: selectedEvent.title,
                event_date: selectedEvent.date || 'TBD',
                event_location: selectedEvent.location || 'TBA',
                ticket_id: response.razorpay_payment_id || `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Attendee: ${currentUser.displayName || "Attendee"}, Ticket: ${response.razorpay_payment_id}`)}`,
                to_name: currentUser.displayName || "Attendee",
                to_email: currentUser.email
              };

              await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                emailParams,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
              );
              console.log("Confirmation email sent successfully!");
            } catch (emailError) {
              console.error("Failed to send confirmation email:", emailError);
            }
            // ---------------------------

            alert("Successfully registered! Your ticket has been generated and emailed to you.");
            handleCloseModal();
          } else {
            alert("Payment successful but database update failed. Please contact support.");
          }
          setRegistering(false);
        },
        prefill: {
          email: currentUser.email,
          name: teamMembers[0]?.name || currentUser.displayName || "",
          contact: teamMembers[0]?.phone || ""
        },
        theme: {
          color: "#7000ff"
        },
        modal: {
          ondismiss: function () {
            setRegistering(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error("Dashboard Registration Error:", error);
      alert("Failed to initiate registration. Is the backend running?");
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="loader">Loading Events...</div>;
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
    <div className="view-content">
      <h3 className="section-title">Upcoming Events</h3>
      <motion.div
        className="events-grid"
        variants={containerVariants}
        animate="show"
      >
        {events.length === 0 ? (
          <motion.div variants={itemVariants} className="no-events-container">
            <p className="no-events">No upcoming events at the moment. Check back later!</p>
          </motion.div>
        ) : (
          events.map(event => (
            <motion.div key={event.id} variants={itemVariants} className="event-card">
              {event.image && (
                <img src={event.image} alt={event.title} className="event-card-banner" />
              )}
              <div className="event-card-header">
                <h3 className="event-title">{event.title}</h3>
                <span className="event-badge">{event.category || "Upcoming"}</span>
              </div>
              <div className="event-meta">
                <span className="event-date">📅 {event.date || 'TBD'}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>📍 {event.location || 'TBA'}</span>
                  <span className="price-tag">{event.price > 0 ? `₹${event.price}` : 'FREE'}</span>
                </div>

                {event.maxSeats && (
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${(event.availableSeats / event.maxSeats) * 100}%` }}></div>
                  </div>
                )}
                {event.maxSeats && (
                  <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {event.availableSeats} of {event.maxSeats} slots remaining
                  </span>
                )}
                <p className="event-content">{event.content}</p>
              </div>

              <div className="event-footer">
                <button
                  className="btn btn-primary btn-full shadow-lg"
                  disabled={registeredEvents.has(event.id) || event.availableSeats === 0}
                  onClick={() => handleOpenModal(event)}
                >
                  {registeredEvents.has(event.id)
                    ? "✓ REGISTERED"
                    : (event.availableSeats === 0 ? "CLUSTER FULL" : "INITIALIZE REGISTRATION")}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* RSVP Checkout Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <style>
              {`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                  .hide-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                  }
                `}
            </style>
            <motion.div
              className="modal-content admin-create-form hide-scrollbar"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '500px',
                margin: 0,
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {selectedEvent.image && (
                <img src={selectedEvent.image} alt={selectedEvent.title} className="event-card-banner" style={{ margin: '-3rem -3rem 2rem -3rem', width: 'calc(100% + 6rem)' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Register: {selectedEvent.title}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Participation Type</label>
                {selectedEvent.maxTeamSize > 1 ? (
                  <select
                    value={participationType}
                    onChange={e => {
                      setParticipationType(e.target.value);
                      const defaultSize = e.target.value === 'Team' ? 2 : 1;
                      setTeamSize(defaultSize);
                      setTeamMembers(Array(defaultSize).fill().map(() => ({ name: '', email: '', phone: '' })));
                    }}
                    className="admin-input"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Team">Team</option>
                  </select>
                ) : (
                  <input type="text" value="Individual (Solo Event)" disabled className="admin-input" />
                )}
              </div>

              {participationType === 'Team' && (
                <>
                  <div className="form-group-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Team Name *</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        placeholder="Enter your team name"
                        className="admin-input"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Team Size</label>
                      <select
                        value={teamSize}
                        onChange={e => {
                          const size = Number(e.target.value);
                          setTeamSize(size);
                          const newMembers = [...teamMembers];
                          if (size > newMembers.length) {
                            newMembers.push(...Array(size - newMembers.length).fill().map(() => ({ name: '', email: '', phone: '' })));
                          } else {
                            newMembers.length = size;
                          }
                          setTeamMembers(newMembers);
                        }}
                        className="admin-input"
                      >
                        {Array.from({ length: selectedEvent.maxTeamSize - 1 }, (_, i) => i + 2).map(num => (
                          <option key={num} value={num}>{num} Members</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  {participationType === 'Team' ? 'Team Members Details *' : 'Your Details *'}
                </h4>
                {teamMembers.map((member, index) => (
                  <div key={index} style={{ marginBottom: '1.5rem', background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ color: '#85C79A', fontSize: '0.85rem', marginBottom: '0.8rem', display: 'block', fontWeight: 'bold' }}>
                      {participationType === 'Team' ? `Member ${index + 1}` : 'Participant Details'}
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={e => {
                        const newMembers = [...teamMembers];
                        newMembers[index].name = e.target.value;
                        setTeamMembers(newMembers);
                      }}
                      placeholder="Full Name"
                      className="admin-input"
                      style={{ marginBottom: '0.8rem' }}
                    />
                    <input
                      type="email"
                      value={member.email}
                      onChange={e => {
                        const newMembers = [...teamMembers];
                        newMembers[index].email = e.target.value;
                        setTeamMembers(newMembers);
                      }}
                      placeholder="Gmail Address"
                      className="admin-input"
                      style={{ marginBottom: '0.8rem' }}
                    />
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={e => {
                        const newMembers = [...teamMembers];
                        newMembers[index].phone = e.target.value;
                        setTeamMembers(newMembers);
                      }}
                      placeholder="Phone Number"
                      className="admin-input"
                    />
                  </div>
                ))}
              </div>

              <div style={{
                background: 'var(--input-bg)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginTop: '2rem',
                marginBottom: '1.5rem',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  <span>Ticket Price:</span>
                  <span>{selectedEvent.price > 0 ? `₹${selectedEvent.price}` : 'Free'} {participationType === 'Team' && `x ${teamSize}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span>Platform Fee:</span>
                  <span>₹0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-accent)' }}>
                  <span>Total Amount:</span>
                  <span>{selectedEvent.price > 0 ? `₹${participationType === 'Team' ? selectedEvent.price * teamSize : selectedEvent.price}` : 'Free'}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handlePaymentAndRegister}
                disabled={registering}
              >
                {registering ? 'Processing...' : (selectedEvent.price > 0 ? `Pay ₹${participationType === 'Team' ? selectedEvent.price * teamSize : selectedEvent.price} & Register` : 'Register Now')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
