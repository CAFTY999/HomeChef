import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./customer.css";

export default function Customer() {
  const navigate = useNavigate();

  // 🔥 GLOBAL SEARCH STATE
  const [search, setSearch] = useState("");

  return (
    <div>
      {/* 🔍 PASS SEARCH TO NAVBAR */}
      <Navbar search={search} setSearch={setSearch} />

      <div className="hero">
        <h1>Discover Homemade Food 🍱</h1>
        <p>Choose your category</p>

        <div className="cards">
          <div
            className="card"
            onClick={() => navigate("/customer/daily", { state: { search } })}
          >
            <h2>Daily Food</h2>
            <p>Fresh meals everyday</p>
          </div>

          <div
            className="card"
            onClick={() =>
              navigate("/customer/subscription", { state: { search } })
            }
          >
            <h2>Subscription</h2>
            <p>Weekly plans</p>
          </div>

          <div
            className="card"
            onClick={() =>
              navigate("/customer/ready", { state: { search } })
            }
          >
            <h2>Ready-made</h2>
            <p>Pickles & snacks</p>
          </div>
        </div>
      </div>
    </div>
  );
}