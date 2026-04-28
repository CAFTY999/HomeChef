import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./popup.css";
import { useAuth } from "./context/AuthContext";

export default function LoginPopup({ setShowLogin, openSignup }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const { login } = useAuth();

const handleLogin = async () => {
  try {
    const res = await axios.post("http://localhost:3000/api/login", form);

    // ✅ store globally
    login({
      token: res.data.token,
      role: res.data.role,
      name: res.data.name
    });

    alert("Welcome " + res.data.name);

    navigate("/" + res.data.role);

  } catch (err) {
    alert(err.response?.data?.msg || "Login failed");
  }
};

  return (
    <div className="overlay">
      <div className="popup-box">
        <h2>Login</h2>

        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />

        <button onClick={handleLogin}>Login</button>

        <p className="link" onClick={openSignup}>
          New user? Sign up
        </p>

        <button onClick={() => setShowLogin(false)}>Close</button>
      </div>
    </div>
  );
}