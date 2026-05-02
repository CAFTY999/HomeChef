import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { CalendarDays, Plus, Trash2, Tag, UtensilsCrossed } from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

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

  // 🔹 Remove category
  const removeCategory = (index) => {
    if (categories.length === 1) return;
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
  };

  // 🔹 Convert to DB format
  const formatCategories = () => {
    return categories.map(cat => ({
      name: cat.name,
      options: cat.options.split(",").map(opt => opt.trim())
    }));
  };

  // 🔥 ADD PLAN
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/api/dish",
        {
          type: "subscription",
          name,
          price,
          totalQuantity,
          meals: [{ categories: formatCategories() }]
        },
        { headers: { Authorization: user.token } }
      );
      alert("Subscription plan added! ✅");
      setName(""); setPrice(""); setTotalQuantity("");
      setCategories([{ name: "", options: "" }]);
      fetchPlans();
    } catch (err) {
      console.log(err);
      alert("Error adding plan ❌");
    } finally {
      setLoading(false);
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
    if(!window.confirm("Are you sure you want to delete this subscription plan?")) return;
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
        
        {/* ADD PLAN FORM */}
        <div className="w-full lg:w-[45%]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" />
              Create Subscription Plan
            </h2>

            <form onSubmit={handleAdd} className="space-y-6">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                  <input 
                    required
                    placeholder="e.g. Monthly Premium Lunch" 
                    value={name}
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 3000" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Subscriptions</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 20" 
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-slate-800 flex items-center">
                    <UtensilsCrossed className="w-4 h-4 mr-2 text-slate-400" />
                    Meal Categories
                  </h3>
                  <p className="text-xs text-slate-500">Add options for users to choose from</p>
                </div>

                <div className="space-y-4">
                  {categories.map((cat, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group">
                      {categories.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <div className="space-y-3">
                        <input
                          required
                          placeholder="Category Name (e.g. Base, Dessert)"
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                        <input
                          required
                          placeholder="Options separated by comma (e.g. Rice, Roti)"
                          value={cat.options}
                          onChange={(e) => handleCategoryChange(index, "options", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={addCategory}
                  className="mt-3 text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Another Category
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-sm mt-6 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Subscription Plan"}
              </button>
            </form>
          </div>
        </div>

        {/* LIST OF PLANS */}
        <div className="w-full lg:w-[55%]">
          <div className="flex items-center space-x-3 mb-6">
             <div className="bg-primary/10 p-2 rounded-xl">
               <CalendarDays className="w-6 h-6 text-primary" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Your Active Plans</h2>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100 border-dashed">
               <div className="text-4xl mb-4">📅</div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">No subscription plans</h3>
               <p className="text-slate-500">Create your first long-term meal plan for your customers.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {plans.map(plan => (
                <div key={plan._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row group">
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800 mb-1">{plan.name}</h3>
                        <div className="text-sm font-medium text-slate-500">
                          Max Subscribers: <span className="text-slate-800 font-bold">{plan.totalQuantity}</span>
                        </div>
                      </div>
                      <div className="bg-slate-100 px-3 py-1 rounded-lg text-lg font-bold text-slate-800 flex items-center">
                        <Tag className="w-4 h-4 mr-1 text-slate-400" /> ₹{plan.price}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Meal Configuration</h4>
                      {plan.meals.map((meal, i) => (
                        <div key={i} className="space-y-2">
                          {meal.categories.map((cat, j) => (
                            <div key={j} className="flex flex-col sm:flex-row sm:items-baseline text-sm">
                              <span className="font-bold text-slate-700 w-24 shrink-0">{cat.name}:</span>
                              <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                                {cat.options.map((opt, k) => (
                                  <span key={k} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 flex flex-col justify-center items-center md:w-32 shrink-0">
                    <button 
                      onClick={() => handleDelete(plan._id)}
                      className="w-full flex flex-col items-center justify-center text-red-500 hover:text-red-600 transition-colors py-2"
                    >
                      <Trash2 className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">Delete</span>
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