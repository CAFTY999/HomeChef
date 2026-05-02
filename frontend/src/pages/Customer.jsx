import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import { Clock, CalendarDays, UtensilsCrossed } from "lucide-react";

export default function Customer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch past orders to derive recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // 1. Fetch user's past orders
        const ordersRes = await axios.get("http://localhost:3000/api/customer/orders", {
          headers: { Authorization: user.token }
        });
        
        // 2. Fetch all items
        const itemsRes = await axios.get("http://localhost:3000/api/items");
        const allItems = itemsRes.data;
        
        if (ordersRes.data.length > 0) {
          // simple recommendation logic: find categories/types they ordered most
          // For simplicity in this demo, just pick items from the chef they ordered from most
          // or just show random popular items if logic is too complex
          const pastOrderItems = ordersRes.data.flatMap(o => o.items.map(i => i.itemId));
          const recommendedItems = allItems.filter(item => pastOrderItems.includes(item._id) || Math.random() > 0.7).slice(0, 4);
          setRecommendations(recommendedItems.length > 0 ? recommendedItems : allItems.slice(0, 4));
        } else {
          // New user: suggest random top items
          setRecommendations(allItems.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching recommendations", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.token) {
      fetchRecommendations();
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar search={search} setSearch={setSearch} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="text-center max-w-3xl mx-auto relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Home-cooked meals, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">delivered fresh.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-10">
              Discover authentic, hygienic, and delicious food prepared by passionate home chefs in your neighborhood.
            </p>
          </div>
          
          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-30">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-12 -right-24 w-96 h-96 bg-orange-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        {/* Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div 
            onClick={() => navigate("/customer/daily", { state: { search } })}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Daily Meals</h2>
            <p className="text-slate-500">Fresh everyday meals from local chefs around you.</p>
          </div>

          <div 
            onClick={() => navigate("/customer/subscription", { state: { search } })}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Subscription</h2>
            <p className="text-slate-500">Subscribe to weekly or monthly meal plans hassle-free.</p>
          </div>

          <div 
            onClick={() => navigate("/customer/ready", { state: { search } })}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ready-made</h2>
            <p className="text-slate-500">Snacks, pickles, and ready-to-eat delicacies.</p>
          </div>
        </div>

        {/* Recommended For You Section */}
        {!loading && recommendations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map(item => (
                <ItemCard key={item._id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}