import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Ready() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    totalQuantity: ""
  });

  const [items, setItems] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 ADD ITEM
  const handleAdd = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/dish",
        {
          ...form,
          type: "ready"
        },
        {
          headers: { Authorization: user.token }
        }
      );

      alert("Item added");
      fetchItems();

    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 FETCH
  const fetchItems = async () => {
    const res = await axios.get("http://localhost:3000/api/my-items", {
      headers: { Authorization: user.token }
    });

    setItems(res.data.filter(i => i.type === "ready"));
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:3000/api/dish/${id}`, {
      headers: { Authorization: user.token }
    });

    fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h2>Ready-made Items</h2>

        {/* FORM */}
        <input name="name" placeholder="Item Name" onChange={handleChange} />
        <br />

        <input name="description" placeholder="Description" onChange={handleChange} />
        <br />

        <input name="price" placeholder="Price" onChange={handleChange} />
        <br />

        <input name="totalQuantity" placeholder="Stock Available" onChange={handleChange} />
        <br />

        <button onClick={handleAdd}>Add Item</button>

        <hr />

        {/* LIST */}
        <h3>Your Items</h3>

        {items.map(item => (
          <div key={item._id}>
            <b>{item.name}</b> - ₹{item.price}
            <br />
            Stock: {item.totalQuantity}
            <br />

            <button onClick={() => handleDelete(item._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}