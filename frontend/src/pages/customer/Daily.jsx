import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function CustomerDaily() {
  const [chefs, setChefs] = useState({});
  const [openChef, setOpenChef] = useState(null);

  const { user } = useAuth();

  const location = useLocation();
  const search = location.state?.search || "";

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

  // 🔥 FETCH ITEMS + GROUP BY CHEF
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/items");
      console.log("CUSTOMER ITEMS:", res.data);
      const dailyItems = res.data.filter(i => i.type === "daily");

      const filtered = dailyItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.chefName || "").toLowerCase().includes(search.toLowerCase())
      );

      const grouped = {};

      filtered.forEach(item => {
        if (!grouped[item.chefId]) {
          grouped[item.chefId] = {
            chefName: item.chefName || "Chef",
            items: []
          };
        }

        grouped[item.chefId].items.push(item);
      });

      setChefs(grouped);

    } catch (err) {
      console.log("Error fetching items:", err);
    }
  };

  // 🔁 AUTO REFRESH
  useEffect(() => {
    fetchItems();

    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Daily Food</h2>

        {/* ❗ EMPTY */}
        {Object.keys(chefs).length === 0 && (
          <p>No items available</p>
        )}

        {/* 👨‍🍳 CHEF LIST */}
        {Object.keys(chefs).map(chefId => {
          const chef = chefs[chefId];

          return (
            <div
              key={chefId}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "10px",
                background: "#fafafa"
              }}
            >
              {/* 🔥 CHEF HEADER */}
              <div
                onClick={() =>
                  setOpenChef(openChef === chefId ? null : chefId)
                }
                style={{ cursor: "pointer" }}
              >
                <h3>{chef.chefName}</h3>
              </div>

              {/* 🍱 MENU */}
              {openChef === chefId && (
                <div style={{ marginTop: "10px" }}>
                  {chef.items.map(item => (
                    <div
                      key={item._id}
                      style={{
                        border: "1px solid #eee",
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "8px",
                        background: "white"
                      }}
                    >
                      <b>{item.name}</b> - ₹{item.price}
                      <br />
                      Chef Rating: {item.chefRating?.toFixed(1) || 0} ⭐
                      <br />
                      Serves: {item.serves}
                      <br />
                      Available: {item.totalQuantity}
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}