import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";

export default function Chef() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Chef Dashboard</h1>

        <div style={{ display: "flex", gap: "20px" }}>
          <Card
            title="Daily Food"
            desc="Manage daily dishes"
            onClick={() => navigate("/chef/daily")}
          />

          <Card
            title="Subscription"
            desc="Manage meal plans"
            onClick={() => navigate("/chef/subscription")}
          />

          <Card
            title="Ready-made"
            desc="Manage snacks & pickles"
            onClick={() => navigate("/chef/ready")}
          />
        <div
            className="card"
            onClick={() => navigate("/chef/orders")}
          >
            <h2>Orders</h2>
            <p>Incoming customer orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}