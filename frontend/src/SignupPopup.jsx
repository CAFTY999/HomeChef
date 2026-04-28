import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./popup.css";
import { useAuth } from "./context/AuthContext";
export default function SignupPopup({ setShowSignup, openLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
  try {
    const res = await axios.post("http://localhost:3000/api/signup", form);

    // 🔥 AUTO LOGIN
    login({
      token: res.data.token,
      role: res.data.role,
      name: form.name
    });

    alert("Registered as " + res.data.role);

    // 🔥 REDIRECT
    navigate("/" + res.data.role);

  } catch (err) {
    console.log(err);

    if (err.response) {
      alert(err.response.data.error);
    } else {
      alert("Server not reachable");
    }
  }
};

const { login } = useAuth();
  return (
    <div className="overlay">
      <div className="popup-box">
        <h2>Sign Up</h2>

        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="location" placeholder="Location" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} />

        <button onClick={handleSignup}>Sign Up</button>

        <p className="link" onClick={openLogin}>
          Already have account? Login
        </p>

        <button onClick={() => setShowSignup(false)}>Close</button>
      </div>
    </div>
  );
}