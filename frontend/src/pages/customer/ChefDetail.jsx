import Navbar from "../../components/Navbar";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ItemCard from "../../components/ItemCard";
import { Star, MapPin, Search, ArrowLeft, Filter, Sparkles, ChefHat, Info, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChefDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [chefInfo, setChefInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState("all"); // 'all', 'veg', 'non-veg'
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || "daily"); 

  useEffect(() => {
    const fetchChefData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/api/items");
        // Find items belonging to this chef
        const chefItems = res.data.filter(item => item.chefId === id);
        setItems(chefItems);
        
        if (chefItems.length > 0) {
          setChefInfo({
            name: chefItems[0].chefName,
            rating: chefItems[0].chefRating,
            location: chefItems[0].location || "Local Kitchen",
            bio: chefItems[0].chefBio,
            speciality: chefItems[0].chefSpeciality
          });
        }
      } catch (err) {
        console.error("Error fetching chef items:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChefData();
  }, [id]);

  const handleAddToCart = async (item) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/add",
        { item },
        { headers: { Authorization: user.token } }
      );
      alert("Added to cart ✅");
    } catch (err) {
      console.error(err);
      alert("Error adding to cart ❌");
    }
  };

  const handleSubscribe = async (item) => {
    try {
      await axios.post(
        "http://localhost:3000/api/subscriptions/subscribe",
        { 
          item,
          chefId: id,
          chefName: chefInfo?.name
        },
        { headers: { Authorization: user.token } }
      );
      alert("Subscription started! Check your 'My Subscriptions' page. ✅");
      navigate("/customer/my-subscriptions");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Error starting subscription ❌");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isVeg = item.isVeg !== false;
      const matchesType = filterType === "all" || (filterType === "veg" && isVeg) || (filterType === "non-veg" && !isVeg);
      const matchesPrice = item.price <= maxPrice;
      const matchesCategory = item.type === selectedCategory;
      return matchesSearch && matchesType && matchesPrice && matchesCategory;
    });
  }, [items, searchQuery, filterType, maxPrice, selectedCategory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-20 selection:bg-primary/20">
      <Navbar />
      
      {/* Immersive Chef Header */}
      <div className="bg-slate-900 text-white relative overflow-hidden pt-16 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 font-black text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discover
          </button>

          {loading ? (
             <div className="animate-pulse flex flex-col md:flex-row items-center gap-10">
               <div className="w-32 h-32 bg-white/10 rounded-[3rem]"></div>
               <div className="space-y-4 flex-1">
                 <div className="h-12 bg-white/10 rounded-2xl w-64 mx-auto md:mx-0"></div>
                 <div className="h-6 bg-white/10 rounded-xl w-48 mx-auto md:mx-0"></div>
               </div>
             </div>
          ) : chefInfo ? (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12 text-center md:text-left">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 md:w-48 md:h-48 rounded-[3.5rem] overflow-hidden border-8 border-white/10 shadow-2xl relative"
              >
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chefInfo.name}`} 
                  alt={chefInfo.name} 
                  className="w-full h-full object-cover bg-white/5"
                />
                <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full"></div>
              </motion.div>
              
              <div className="flex-1">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-4"
                >
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter">{chefInfo.name}</h1>
                  {chefInfo.speciality && (
                    <span className="px-4 py-2 bg-primary/20 text-primary text-[10px] font-black rounded-full border border-primary/20 uppercase tracking-widest mb-2">
                      {chefInfo.speciality}
                    </span>
                  )}
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-400 mb-8"
                >
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-black text-white">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    {chefInfo.rating > 0 ? chefInfo.rating.toFixed(1) : "New Master Chef"}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <MapPin className="w-4 h-4 text-primary" />
                    {chefInfo.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-green-400">
                    <ChefHat className="w-4 h-4" /> Active Now
                  </div>
                </motion.div>

                {chefInfo.bio && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-2xl text-slate-400 text-lg leading-relaxed italic font-medium"
                  >
                    "{chefInfo.bio}"
                  </motion.p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 font-black uppercase tracking-widest">Master Chef information not found.</div>
          )}
        </div>
        
        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Enhanced Filters Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="glass-card rounded-[3rem] p-8 sticky top-24 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="font-black text-lg text-slate-800 tracking-tight">Cuisine Filters</h3>
              </div>
              
              {/* Search Within Menu */}
              <div className="mb-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Search Menu</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Find a dish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Diet Toggle */}
              <div className="mb-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1">Dietary Preference</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "all", label: "Everything" },
                    { id: "veg", label: "Pure Veg" },
                    { id: "non-veg", label: "Non-Veg" }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFilterType(type.id)}
                      className={`flex items-center px-6 py-4 rounded-xl text-sm font-black transition-all ${
                        filterType === type.id 
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 ${type.id === 'veg' ? 'bg-green-500' : type.id === 'non-veg' ? 'bg-rose-500' : 'bg-primary'}`}></div>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget</label>
                  <span className="text-xs font-black text-slate-900">₹{maxPrice}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary mb-2"
                />
                <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <span>₹0</span>
                  <span>₹10k</span>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-300">
                  <Info className="w-4 h-4" />
                  <p className="text-[10px] font-bold italic leading-tight">Prices include gourmet packaging and home delivery.</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Dynamic Menu Section */}
          <div className="flex-1">
            {/* High-Fidelity Category Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl shadow-slate-100 mb-12 overflow-x-auto no-scrollbar">
              {[
                { id: "daily", label: "Daily Meals", icon: ChefHat },
                { id: "subscription", label: "Subscription Plans", icon: Sparkles },
                { id: "ready", label: "Ready-made / Gourmet", icon: History }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-xs font-black whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === cat.id 
                      ? "bg-slate-900 text-white shadow-xl scale-105" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white"
                  }`}
                >
                  <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-primary' : 'text-slate-300'}`} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-end justify-between mb-10">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter capitalize">
                    {selectedCategory === 'ready' ? 'Pickles & Snacks' : `${selectedCategory} Specials`}
                  </h2>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 ml-1">
                    Showing {filteredItems.length} curated options
                  </p>
               </div>
            </div>
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card h-[400px] rounded-[3rem] animate-pulse"></div>
                  ))}
                </motion.div>
              ) : filteredItems.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-[4rem] py-32 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-100"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                    <UtensilsCrossed className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Items Match Filters</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto mt-4">We couldn't find any dishes in this category that match your specific filters.</p>
                  <button 
                    onClick={() => {setFilterType("all"); setSearchQuery(""); setMaxPrice(10000);}}
                    className="mt-8 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                >
                  {filteredItems.map(item => (
                    <motion.div key={item._id} variants={itemVariants}>
                      <ItemCard 
                        item={item} 
                        onAddToCart={handleAddToCart} 
                        onSubscribe={handleSubscribe} 
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

const UtensilsCrossed = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
    <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Z" />
    <path d="m18 16 4 4" />
    <path d="m20 18-4 4" />
  </svg>
);
