import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import ChefCard from "../../components/ChefCard";
import ItemCard from "../../components/ItemCard";
import { useAuth } from "../../context/AuthContext";
import { Search } from "lucide-react";

export default function CustomerSubscription() {
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.search || "");
  const [chefs, setChefs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const handleAddToCart = async (item) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/add",
        { item },
        { headers: { Authorization: user.token } }
      );
      alert("Added to cart ✅");
    } catch (err) {
      console.log(err);
      alert("Error adding to cart ❌");
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/items");
      const subItems = res.data.filter(i => i.type === "subscription");

      // Filter logic based on search
      const matchedDishes = [];
      const matchedChefsMap = new Map();

      subItems.forEach(item => {
        const dishMatch = item.name.toLowerCase().includes(search.toLowerCase());
        const chefMatch = (item.chefName || "").toLowerCase().includes(search.toLowerCase());

        if (search && dishMatch) {
          matchedDishes.push(item);
        }

        // Always populate chefs if no search, or if chef name matches
        if (!search || chefMatch) {
          if (!matchedChefsMap.has(item.chefId)) {
            matchedChefsMap.set(item.chefId, {
              chefId: item.chefId,
              chefName: item.chefName || "Unknown Chef",
              chefRating: item.chefRating || 0,
              location: item.location || "Local",
              cuisine: "Subscription Plans",
            });
          }
        }
      });

      setDishes(matchedDishes);
      setChefs(Array.from(matchedChefsMap.values()));
    } catch (err) {
      console.log("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Plans</h1>
            <p className="text-slate-500">Find chefs offering weekly or monthly meal subscriptions.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search plans or chefs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-64 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4"></div>
                <div className="h-6 bg-slate-200 rounded mx-auto w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded mx-auto w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded-full mx-auto w-2/3 mt-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* MATCHING DISHES (Only if searched) */}
            {search && dishes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Plans matching "{search}"</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {dishes.map(item => (
                    <ItemCard key={item._id} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              </div>
            )}

            {/* CHEFS LIST */}
            {chefs.length > 0 ? (
              <div>
                {search && <h2 className="text-2xl font-bold text-slate-800 mb-6">Chefs matching "{search}"</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {chefs.map(chef => (
                    <ChefCard
                      key={chef.chefId}
                      chefId={chef.chefId}
                      chefName={chef.chefName}
                      rating={chef.chefRating}
                      location={chef.location}
                      cuisine={chef.cuisine}
                    />
                  ))}
                </div>
              </div>
            ) : (
              !dishes.length && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No results found</h3>
                  <p className="text-slate-500">We couldn't find any chefs or plans matching "{search}".</p>
                </div>
              )
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}