import Navbar from "../../components/Navbar";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import ItemCard from "../../components/ItemCard";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";

export default function CustomerReady() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(location.state?.search || "");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        setItems(res.data.filter(i => 
          i.type === "ready" && 
          (!user.location || (i.chefLocation || "").toLowerCase().includes(user.location.toLowerCase()))
        ));
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.chefName || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ready-made Items</h1>
            <p className="text-slate-500">Pickles, snacks, and delicacies ready to be delivered.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ready-made items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm h-80 animate-pulse">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between items-end">
                    <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
             <div className="text-4xl mb-4">🍯</div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
             <p className="text-slate-500">We couldn't find any ready-made items matching "{search}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ItemCard key={item._id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}