import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Profile() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    address: ""
  });

  const [orders, setOrders] = useState([]);

  // FETCH PROFILE
  const fetchProfile = async () => {
    const res = await axios.get(
      "http://localhost:3000/api/profile-data",
      {
        headers: { Authorization: user.token }
      }
    );

    setForm(res.data);
  };

  // FETCH ORDERS
  const fetchOrders = async () => {
    const res = await axios.get(
      "http://localhost:3000/api/customer/orders",
      {
        headers: { Authorization: user.token }
      }
    );

    setOrders(res.data);
  };

  useEffect(() => {
    fetchProfile();
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    await axios.put(
      "http://localhost:3000/api/profile-data",
      form,
      {
        headers: { Authorization: user.token }
      }
    );

    alert("Profile updated");
  };

  // FILTERS
  const currentOrders = orders.filter(
    o => o.status === "pending" || o.status === "accepted"
  );

  const previousOrders = orders.filter(
    o =>
      o.status === "rejected" ||
      o.status === "completed"
  );

  const renderOrders = (list, type) => {
  const filtered = list.filter(o => o.type === type);

  if (filtered.length === 0) return <p>No {type} orders</p>;

  return filtered.map(order => (
    <div style={box} key={order._id}>
      <b>{order.type.toUpperCase()}</b>
      <br />
      Chef: {order.chefName}
      <br />
      Total: ₹{order.total}
      <br />
      Status: {order.status}

      {/* ⭐ RATE BUTTON */}
      {order.status === "completed" &&
        !order.rated && (
        <div style={{ marginTop: "10px" }}>
          {[1,2,3,4,5].map(num => (
            <button
              key={num}
              onClick={async () => {
                await axios.put(
                  `http://localhost:3000/api/rate-order/${order._id}`,
                  { stars: num },
                  {
                    headers: {
                      Authorization: user.token
                    }
                  }
                );

                fetchOrders();
              }}
              style={{ marginRight: "5px" }}
            >
              ⭐ {num}
            </button>
          ))}
        </div>
      )}
    </div>
  ));
};

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>My Profile</h2>

        {/* PROFILE FORM */}
        <input
          placeholder="Name"
          value={form.name || ""}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />
        <br /><br />

        <input
          placeholder="Email"
          value={form.email || ""}
          disabled
        />
        <br /><br />

        <input
          placeholder="Location"
          value={form.location || ""}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
        />
        <br /><br />

        <input
          placeholder="Phone"
          value={form.phone || ""}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />
        <br /><br />

        <textarea
          placeholder="Address"
          value={form.address || ""}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />
        <br /><br />

        <button onClick={handleSave}>
          Save Profile
        </button>

        <hr /><br />

        {/* CURRENT */}
        <h2>Current Orders</h2>

        <h3>Food</h3>
        {renderOrders(currentOrders, "daily")}

        <h3>Subscription</h3>
        {renderOrders(currentOrders, "subscription")}

        <h3>Refreshments</h3>
        {renderOrders(currentOrders, "ready")}

        <hr /><br />

        {/* PREVIOUS */}
        <h2>Previous Orders</h2>
        
        <h3>Food</h3>
        {renderOrders(previousOrders, "daily")}

        <h3>Subscription</h3>
        {renderOrders(previousOrders, "subscription")}

        <h3>Refreshments</h3>
        {renderOrders(previousOrders, "ready")}
      </div>
    </div>
  );
}

const box = {
  border: "1px solid #ddd",
  padding: "15px",
  marginBottom: "10px",
  borderRadius: "10px"
};