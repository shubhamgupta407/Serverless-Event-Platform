import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../components/ThemeToggle";
import "./Dashboard.css";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState(0);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [maxSeats, setMaxSeats] = useState("");
  const [category, setCategory] = useState("Hackathon");
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  // Announcements State
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("Broadcast");
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error listening to events:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!title || !content || !date || !location) return;
    setLoading(true);

    let imageUrl = "";
    if (imageFile) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.url) {
          imageUrl = data.url;
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Image upload failed, creating event without image.");
      }
      setUploadingImage(false);
    }

    try {
      await addDoc(collection(db, "events"), {
        title,
        content,
        date,
        location,
        price: Number(price),
        maxTeamSize: Number(maxTeamSize),
        maxSeats: maxSeats === "" ? null : Number(maxSeats),
        availableSeats: maxSeats === "" ? null : Number(maxSeats),
        category,
        image: imageUrl,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setContent("");
      setDate("");
      setLocation("");
      setPrice(0);
      setMaxTeamSize(1);
      setMaxSeats("");
      setCategory("Hackathon");
      setImageFile(null);
    } catch (error) {
      console.error("Error adding event:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const postAnnouncement = async () => {
    if (!msg) return;
    setLoadingAnnouncement(true);
    try {
      await addDoc(collection(db, "announcements"), {
        message: msg,
        type: type,
        createdAt: serverTimestamp(),
      });
      setMsg("");
      setType("Broadcast");
      alert("Announcement posted successfully!");
    } catch (error) {
      console.error("Error posting announcement:", error);
      alert("Failed to post announcement.");
    }
    setLoadingAnnouncement(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  return (
    <div className="dashboard-layout" style={{ position: 'relative', display: 'block', padding: '0' }}>
      <motion.div 
        className="dashboard-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="dashboard-header-bar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2 className="dashboard-welcome">Admin <span className="highlight">Command Center</span></h2>
            <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <ThemeToggle />
              <Link to="/dashboard" className="btn btn-secondary shadow-sm">User Panel</Link>
              <Link to="/" className="btn btn-secondary shadow-sm">Home</Link>
            </div>
          </div>
        </div>

        <div className="dashboard-content-area">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', maxWidth: '1400px', margin: '0 auto', alignItems: 'start' }}>
            {/* Left Side: Create Form */}
            <motion.div 
              className="admin-create-form"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Forge New Event</h3>
              <div className="form-group">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" className="admin-input" />
              </div>
              <div className="form-group-row">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input" />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="admin-input" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="admin-input">
                  <option value="Hackathon">Hackathon</option>
                  <option value="Tech">Tech</option>
                  <option value="Fest">Fest</option>
                  <option value="ESports">ESports</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div className="form-group-row">
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.4rem', display: 'block' }}>Entry Fee (INR)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="admin-input" min="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.4rem', display: 'block' }}>Team Size</label>
                  <input type="number" value={maxTeamSize} onChange={e => setMaxTeamSize(e.target.value)} className="admin-input" min="1" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.4rem', display: 'block' }}>Capacity</label>
                  <input type="number" value={maxSeats} onChange={e => setMaxSeats(e.target.value)} placeholder="Unlimited" className="admin-input" min="1" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--primary-accent)', opacity: 0.7, fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>EVENT BANNER</label>
                <div className="admin-input" style={{ position: 'relative', overflow: 'hidden', padding: '0.8rem' }}>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                  <span style={{ opacity: 0.6 }}>{imageFile ? `Selected: ${imageFile.name}` : 'Click to upload banner...'}</span>
                </div>
              </div>
              <div className="form-group">
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's this event about?" className="admin-textarea" rows="4"></textarea>
              </div>
              <button onClick={handleCreate} disabled={loading || uploadingImage} className="btn btn-primary btn-full neon-border-pulse">
                {loading ? (uploadingImage ? 'Uploading Data...' : 'Encoding...') : 'Initialize Protocol'}
              </button>
            </motion.div>

            {/* Right Side: Announcements */}
            <motion.div 
              className="admin-create-form"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ borderTop: '4px solid #00f2ff' }}
            >
              <h3>Neural Broadcast</h3>
              <div className="form-group">
                <input 
                  value={msg} 
                  onChange={e => setMsg(e.target.value)} 
                  placeholder="Status update to all units..." 
                  className="admin-input" 
                />
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.4rem', display: 'block' }}>Signal Priority</label>
                <select value={type} onChange={e => setType(e.target.value)} className="admin-input">
                  <option value="Register">Alpha (Registration)</option>
                  <option value="Alert">Omega (Urgent)</option>
                  <option value="Payment">Sigma (Finances)</option>
                  <option value="Broadcast">Delta (Global)</option>
                </select>
              </div>
              <button onClick={postAnnouncement} disabled={loadingAnnouncement || !msg} className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }}>
                {loadingAnnouncement ? 'Transmitting...' : 'Transmit Signal'}
              </button>
            </motion.div>
          </div>

          {/* Bottom Side: Events Management */}
          <div style={{ marginTop: '6rem' }}>
            <h3 className="section-title">Network Registry</h3>
            <motion.div 
              className="events-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence mode="popLayout">
                {events.map(event => (
                  <motion.div 
                    key={event.id} 
                    variants={itemVariants} 
                    layout 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="event-card"
                  >
                    {event.image && (
                      <img src={event.image} alt={event.title} className="event-card-banner" />
                    )}
                    <div className="event-card-header">
                      <h3 className="event-title">{event.title}</h3>
                      <button onClick={() => handleDelete(event.id)} className="btn-delete" title="Terminate Entry" style={{ padding: '8px', borderRadius: '4px', border: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    <div className="event-meta">
                        <span className="event-date">Entry Date: {event.date || 'TBD'}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="event-badge">{event.category || 'General'}</span>
                          <span className="price-tag">{event.price > 0 ? `₹${event.price}` : 'CORE'}</span>
                        </div>
                        {event.maxSeats && (
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${(event.availableSeats / event.maxSeats) * 100}%` }}></div>
                          </div>
                        )}
                        {event.maxSeats && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {event.availableSeats} Units remaining in cluster
                          </span>
                        )}
                        <p className="event-content">{event.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
