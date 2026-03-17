import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import "./Dashboard.css";

export default function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-header-bar">
          <h2 className="dashboard-welcome">
            Welcome back, <span className="highlight">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Attendee'}</span>
          </h2>
          <ThemeToggle />
        </div>
        <div className="dashboard-content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
