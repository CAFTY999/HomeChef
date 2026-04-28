import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/" />;

  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}