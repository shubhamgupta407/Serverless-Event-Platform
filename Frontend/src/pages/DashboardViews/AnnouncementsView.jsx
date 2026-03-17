import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import "../Dashboard.css";

const tagColors = {
  Register: "#00f2ff", // Electric Cyan
  Alert: "#ff4d4d",    // Tactical Red
  Payment: "#7000ff",  // Vivid Amethyst
  Broadcast: "#ffaa00", // Signal Amber
};

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );

    // onSnapshot = real-time listener, updates instantly
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      className="view-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: "var(--card-bg)",
        minHeight: "75vh",
        padding: "2rem",
        borderRadius: "var(--radius-main)",
        border: "1px solid var(--glass-border)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <h2 style={{ color: "var(--text-primary)", marginBottom: "2rem" }}>Live Announcements</h2>

      {announcements.length === 0 ? (
        <div className="empty-state-card" style={{ marginTop: '2rem' }}>
          <div className="empty-icon">📢</div>
          <h4 style={{ color: "var(--text-primary)" }}>No Recent Announcements</h4>
          <p style={{ color: "var(--text-secondary)" }}>Stay tuned for real-time updates from event organizers.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--glass-border)",
                background: "var(--input-bg)",
                borderRadius: "12px",
                color: "var(--text-primary)",
              }}
            >
              <div style={{
                minWidth: "80px",
                color: "var(--text-secondary)",
                fontSize: "0.85rem"
              }}>
                {formatTime(a.createdAt)}
              </div>

              <div style={{
                background: `${tagColors[a.type] || tagColors.Broadcast}20`,
                color: tagColors[a.type] || tagColors.Broadcast,
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                minWidth: "100px",
                textAlign: "center"
              }}>
                {a.type}
              </div>

              <div style={{ flex: 1, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                {a.message}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
