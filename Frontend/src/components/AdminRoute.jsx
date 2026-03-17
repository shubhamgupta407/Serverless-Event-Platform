import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export const ADMIN_UID = "pijoc1HoHnW89CSLJN1LJdpxwri2";

export default function AdminRoute({ children }) {
  const user = auth.currentUser;

  if (!user) return <Navigate to="/signin" />;
  if (user.uid !== ADMIN_UID) return <Navigate to="/" />;

  return children;
}
