import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { PackageOpen, Plus, Trash2 } from "lucide-react";

export default function Ready() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    totalQuantity: "",
    isVeg: true,
    imageUrl: ""
  });

  const [items, setItems] = useState([]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSelectChange = (e) => {
    setForm({ ...form, isVeg: e.target.value === 'true' });
  };

  // 🔥 ADD ITEM
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/api/dish",
        { ...form, type: "ready" },
        { headers: { Authorization: user.token } }
      );
      alert("Item added successfully! ✅");
      setForm({ name: "", description: "", price: "", totalQuantity: "", isVeg: true, imageUrl: "" });
      fetchItems();
    } catch (err) {
      console.log(err);
      alert("Error adding item ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH ITEMS
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/my-items", {
        headers: { Authorization: user.token }
      });
      setItems(res.data.filter(item => item.type === "ready"));
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 DELETE ITEM
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/dish/${id}`, {
        headers: { Authorization: user.token }
      });
      fetchItems();
    } catch(e) {}
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
        
        {/* ADD NEW ITEM FORM */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" />
              Add Ready-made Item
            </h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                <input 
                  name="name" 
                  required
                  placeholder="e.g. Mango Pickle" 
                  value={form.name}
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  required
                  placeholder="Describe your item..." 
                  value={form.description}
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                <input 
                  name="imageUrl" 
                  placeholder="https://example.com/image.jpg" 
                  value={form.imageUrl}
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dietary</label>
                  <select
                    name="isVeg"
                    value={form.isVeg}
                    onChange={handleSelectChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="true">🟢 Veg</option>
                    <option value="false">🔴 Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                  <input 
                    name="price" 
                    type="number"
                    required
                    placeholder="e.g. 200" 
                    value={form.price}
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available Stock</label>
                <input 
                  name="totalQuantity" 
                  type="number"
                  required
                  placeholder="How many units available?" 
                  value={form.totalQuantity}
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-sm mt-4 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Item to Store"}
              </button>
            </form>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="w-full lg:w-2/3">
          <div className="flex items-center space-x-3 mb-6">
             <div className="bg-primary/10 p-2 rounded-xl">
               <PackageOpen className="w-6 h-6 text-primary" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Your Ready-made Items</h2>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100 border-dashed">
               <div className="text-4xl mb-4">🍯</div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">No items added yet</h3>
               <p className="text-slate-500">Start by adding your first ready-made item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map(item => (
                <div key={item._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
                  {item.imageUrl && (
                    <div className="h-40 bg-slate-100 relative">
                       <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-xl text-slate-800">{item.name}</h3>
                       <div className="bg-slate-100 px-2 py-1 rounded-lg text-sm font-bold text-slate-800">
                         ₹{item.price}
                       </div>
                    </div>
                    
                    <span className={`inline-block mb-3 px-2 py-1 text-xs font-bold rounded-md border ${item.isVeg !== false ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${item.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {item.isVeg !== false ? 'VEG' : 'NON-VEG'}
                    </span>

                    <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                    
                    <div className="flex justify-between items-center text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                      <span>Stock Available:</span>
                      <span className="font-bold text-slate-800">{item.totalQuantity}</span>
                    </div>

                    <button 
                      onClick={() => handleDelete(item._id)}
                      className="w-full flex items-center justify-center bg-white text-red-500 border border-red-200 hover:bg-red-50 py-2 rounded-xl font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}