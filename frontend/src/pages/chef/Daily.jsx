import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Daily() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    serves: "",
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
        { ...form, type: "daily" },
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

  // 🔥 FETCH ITEMS
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/my-items", {
        headers: { Authorization: user.token }
      });
      console.log(res.data);
      // filter only daily
      const dailyItems = res.data.filter(item => item.type === "daily");
      setItems(dailyItems);

    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 DELETE ITEM
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
        <h2>Daily Food</h2>

        {/* FORM */}
        <input name="name" placeholder="Name" onChange={handleChange} />
        <br />

        <input name="description" placeholder="Description" onChange={handleChange} />
        <br />

        <input name="price" placeholder="Price" onChange={handleChange} />
        <br />

        <input name="serves" placeholder="Serves (people)" onChange={handleChange} />
        <br />

        <input name="totalQuantity" placeholder="Total Orders Available" onChange={handleChange} />
        <br />

        <button onClick={handleAdd}>Add</button>

        <hr />

        {/* LIST */}
        <h3>Your Daily Items</h3>

        {items.map(item => (
          <div key={item._id} style={{ marginBottom: "10px" }}>
            <b>{item.name}</b> - ₹{item.price}  
            <br />
            Serves: {item.serves} | Orders left: {item.totalQuantity}
            <br />
            <button onClick={() => handleDelete(item._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}