import { useState } from "react";
import LoginPopup from "./LoginPopup";
import SignupPopup from "./SignupPopup";
import "./home.css";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="hero">

      {/* NAVBAR */}
      <div className="nav">
        <h2>HomeChef</h2>

        <div className="nav-buttons">
          <button onClick={() => setShowLogin(true)}>Login</button>
          <button onClick={() => setShowSignup(true)}>Sign Up</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        <div className="left">
          <h1>Delicious Homemade Food</h1>
          <p>Connecting home chefs with customers</p>

          <button className="main-btn" onClick={() => setShowSignup(true)}>
            Get Started
          </button>
        </div>

        <div className="right"></div>
      </div>

      {/* POPUPS */}
      {showLogin && (
        <LoginPopup
          setShowLogin={setShowLogin}
          openSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showSignup && (
        <SignupPopup
          setShowSignup={setShowSignup}
          openLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}