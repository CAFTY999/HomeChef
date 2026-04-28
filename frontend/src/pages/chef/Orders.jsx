import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await axios.get(
      "http://localhost:3000/api/chef/orders",
      {
        headers: {
          Authorization: user.token
        }
      }
    );

    setOrders(res.data);
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `http://localhost:3000/api/order-status/${id}`,
      { status },
      {
        headers: {
          Authorization: user.token
        }
      }
    );

    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Incoming Orders</h2>

        {orders.length === 0 && <p>No orders</p>}

        {orders.map(order => (
          <div
            key={order._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "10px"
            }}
          >
            <b>{order.customerName}</b>
            <br />
            Type: {order.type}
            <br />
            Total: ₹{order.total}
            <br />
            Status: {order.status}
            <br /><br />

            {order.items.map(item => (
              <div key={item.itemId}>
                {item.name} x {item.quantity}
              </div>
            ))}

            <br />

            {order.status === "pending" && (
              <>
                <button
                  onClick={() =>
                    updateStatus(order._id, "accepted")
                  }
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    updateStatus(order._id, "rejected")
                  }
                  style={{ marginLeft: "10px" }}
                >
                  Reject
                </button>
              </>
            )}
            {order.status === "accepted" && (
                <button
                    onClick={() =>
                    updateStatus(order._id, "completed")
                    }
                >
                    Mark Delivered
                </button>
                )}
          </div>
        ))}
      </div>
    </div>
  );
}