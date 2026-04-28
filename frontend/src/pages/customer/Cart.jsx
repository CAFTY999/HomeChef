import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function Cart() {
  const { user } = useAuth();
  const { type } = useParams(); // 🔥 daily / subscription / ready

  const [items, setItems] = useState([]);

  // 🔥 FETCH CART
  const fetchCart = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/cart/${type}`,
        {
          headers: { Authorization: user.token }
        }
      );

      setItems(res.data.items || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [type]);

  // ❌ REMOVE ITEM
  const removeItem = async (id) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/remove",
        {
          type,
          itemId: id
        },
        {
          headers: { Authorization: user.token }
        }
      );

      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  // 🧹 CLEAR CART
  const clearCart = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/clear",
        { type },
        {
          headers: { Authorization: user.token }
        }
      );

      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  // 💰 TOTAL
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    try {
      await axios.post(
        `http://localhost:3000/api/place-order/${type}`,
        {},
        {
          headers: {
            Authorization: user.token
          }
        }
      );

      alert("Order placed successfully");

      fetchCart();

    } catch (err) {
      console.log(err);
      alert("Error placing order");
    }
  };
  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>{type.toUpperCase()} Cart</h2>

        {items.length === 0 && <p>Empty cart</p>}

        {items.map(item => (
          <div key={item.itemId} style={box}>
            <b>{item.name}</b> - ₹{item.price}
            <br />
            Quantity: {item.quantity}
            <br />

            <button onClick={() => removeItem(item.itemId)}>
              Remove
            </button>
          </div>
        ))}

        <hr />

        <h3>Total: ₹{total}</h3>

        <button onClick={clearCart} style={{ marginRight: "10px" }}>
          Clear Cart
        </button>

        <button onClick={placeOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
}

const box = {
  border: "1px solid #ddd",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "8px"
};