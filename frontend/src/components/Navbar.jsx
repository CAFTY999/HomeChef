import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 detect current page

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 🔥 SMART CART NAVIGATION
  const handleCartClick = () => {
    if (location.pathname.includes("daily")) {
      navigate("/customer/cart/daily");
    } else if (location.pathname.includes("subscription")) {
      navigate("/customer/cart/subscription");
    } else if (location.pathname.includes("ready")) {
      navigate("/customer/cart/ready");
    } else {
      // fallback (from dashboard)
      navigate("/customer/cart/daily");
    }
  };

  return (
    <div className="navbar">
      <h2 className="logo" onClick={() => navigate("/")}>
        HomeChef
      </h2>

      <div className="nav-right">
        <span>Hi, {user?.name}</span>

        {/* 🛒 CART BUTTON */}
        <button onClick={handleCartClick}>
          Cart
        </button>
        <button onClick={() => navigate("/customer/profile")}>
          Profile
        </button>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}