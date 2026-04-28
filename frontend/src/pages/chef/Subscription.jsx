import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Subscription() {
  const { user } = useAuth();

  // 🔹 Basic Info
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");

  // 🔹 Dynamic categories
  const [categories, setCategories] = useState([
    { name: "", options: "" }
  ]);

  const [plans, setPlans] = useState([]);

  // 🔹 Handle category change
  const handleCategoryChange = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);
  };

  // 🔹 Add new category
  const addCategory = () => {
    setCategories([...categories, { name: "", options: "" }]);
  };

  // 🔹 Convert to DB format
  const formatCategories = () => {
    return categories.map(cat => ({
      name: cat.name,
      options: cat.options.split(",").map(opt => opt.trim())
    }));
  };

  // 🔥 ADD PLAN
  const handleAdd = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/dish",
        {
          type: "subscription",
          name,
          price,
          totalQuantity,
          meals: [
            {
              categories: formatCategories()
            }
          ]
        },
        {
          headers: { Authorization: user.token }
        }
      );

      alert("Subscription plan added");

      // reset
      setName("");
      setPrice("");
      setTotalQuantity("");
      setCategories([{ name: "", options: "" }]);

      fetchPlans();

    } catch (err) {
      console.log(err);
      alert("Error adding plan");
    }
  };

  // 🔥 FETCH PLANS
  const fetchPlans = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/my-items", {
        headers: { Authorization: user.token }
      });

      setPlans(res.data.filter(item => item.type === "subscription"));
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 DELETE PLAN
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/dish/${id}`, {
        headers: { Authorization: user.token }
      });

      fetchPlans();
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Subscription Plans</h2>

        {/* 🔹 PLAN INFO */}
        <input
          placeholder="Plan Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <br />

        <input
          placeholder="Total Subscriptions Allowed"
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(e.target.value)}
        />
        <br /><br />

        {/* 🔥 DYNAMIC CATEGORIES */}
        <h3>Meal Categories</h3>

        {categories.map((cat, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <input
              placeholder="Category (Base, Sweet, Drink...)"
              value={cat.name}
              onChange={(e) =>
                handleCategoryChange(index, "name", e.target.value)
              }
            />

            <input
              placeholder="Options (Rice,Roti,Juice...)"
              value={cat.options}
              onChange={(e) =>
                handleCategoryChange(index, "options", e.target.value)
              }
            />
          </div>
        ))}

        <button onClick={addCategory}>+ Add Category</button>

        <br /><br />

        <button onClick={handleAdd}>Add Subscription Plan</button>

        <hr />

        {/* 🔥 DISPLAY */}
        <h3>Your Plans</h3>

        {plans.map(plan => (
          <div key={plan._id} style={{ marginBottom: "15px" }}>
            <b>{plan.name}</b> - ₹{plan.price}
            <br />
            Total Slots: {plan.totalQuantity}

            {plan.meals.map((meal, i) => (
              <div key={i}>
                {meal.categories.map((cat, j) => (
                  <div key={j}>
                    <b>{cat.name}</b>: {cat.options.join(", ")}
                  </div>
                ))}
              </div>
            ))}

            <button onClick={() => handleDelete(plan._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}