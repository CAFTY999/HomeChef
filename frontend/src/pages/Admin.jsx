import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import axios from "axios";

export default function Admin() {
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/profile", {
          headers: {
            Authorization: user?.token
          }
        });

        console.log("Admin Profile:", res.data);
      } catch (err) {
        console.log(err);
      }
    };

    if (user?.token) {
      fetchProfile();
    }
  }, [user]);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Admin Dashboard</h1>
        <h3>Welcome, Admin {user?.name} 🛠️</h3>
      </div>
    </div>
  );
}