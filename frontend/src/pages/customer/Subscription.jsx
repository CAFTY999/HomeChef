import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function CustomerSubscription() {
  const [plans, setPlans] = useState([]);
  const { user } = useAuth();

  // 🔥 ADD TO CART (BACKEND)
  const handleAddToCart = async (plan) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/add",
        { item: plan },
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
        setPlans(res.data.filter(i => i.type === "subscription"));
      })
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Subscription Plans</h2>

        {plans.length === 0 && <p>No plans available</p>}

        {plans.map(plan => (
          <div
            key={plan._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "20px",
              borderRadius: "10px"
            }}
          >
            <b>{plan.name}</b> - ₹{plan.price}
            Chef Rating: {plan.chefRating?.toFixed(1) || 0} ⭐
            <br />
            Slots: {plan.totalQuantity}
            <br /><br />

            {/* 🍱 MEAL STRUCTURE */}
            {plan.meals.map((meal, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                {meal.categories.map((cat, j) => (
                  <div key={j}>
                    <b>{cat.name}</b>: {cat.options.join(", ")}
                  </div>
                ))}
              </div>
            ))}

            <button
              onClick={() => handleAddToCart(plan)}
              style={{
                marginTop: "5px",
                padding: "6px 12px",
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