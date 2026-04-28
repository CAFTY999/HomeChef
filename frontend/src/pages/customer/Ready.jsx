import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function CustomerReady() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  // 🔥 ADD TO CART (BACKEND)
  const handleAddToCart = async (item) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/add",
        { item },
        {
          headers: { Authorization: user.token }
        }
      );

      alert("Added to cart ✅");
    } catch (err) {
      console.log(err);
      alert("Error adding to cart ❌");
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/items")
      .then(res => {
        setItems(res.data.filter(i => i.type === "ready"));
      })
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Ready-made</h2>

        {items.length === 0 && <p>No items available</p>}

        {items.map(item => (
          <div
            key={item._id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px"
            }}
          >
            <b>{item.name}</b> - ₹{item.price}
            Chef Rating: {item.chefRating?.toFixed(1) || 0} ⭐
            <br />
            Stock: {item.totalQuantity}
            <br />

            <button
              onClick={() => handleAddToCart(item)}
              style={{
                marginTop: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                background: "black",
                color: "white",
                cursor: "pointer"
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}