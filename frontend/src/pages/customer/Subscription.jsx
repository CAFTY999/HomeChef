import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import ChefCard from "../../components/ChefCard";
import ItemCard from "../../components/ItemCard";
import { useAuth } from "../../context/AuthContext";
import { Search, Calendar, Sparkles, Filter, ArrowRight, User, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerSubscription() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState(location.state?.search || "");
  const [chefs, setChefs] = useState([]);
  const [featuredPlans, setFeaturedPlans] = useState([]);
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

  const handleSubscribe = async (item) => {
    try {
      await axios.post(
        "http://localhost:3000/api/subscriptions/subscribe",
        { 
          item,
          chefId: item.chefId,
          chefName: item.chefName
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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3000/api/items");
      const subItems = res.data.filter(i => 
        i.type === "subscription" && 
        (!user.location || (i.chefLocation || "").toLowerCase().includes(user.location.toLowerCase()))
      );

      // Filter logic based on search
      const matchedChefsMap = new Map();
      const allPlans = [];

      subItems.forEach(item => {
        const dishMatch = item.name.toLowerCase().includes(search.toLowerCase());
        const chefMatch = (item.chefName || "").toLowerCase().includes(search.toLowerCase());

        if (!search || dishMatch || chefMatch) {
          allPlans.push(item);
          if (!matchedChefsMap.has(item.chefId)) {
            matchedChefsMap.set(item.chefId, {
              chefId: item.chefId,
              chefName: item.chefName || "Unknown Chef",
              chefRating: item.chefRating || 0,
              location: item.location || "Local",
              cuisine: "Subscription Plans",
              bio: item.chefBio,
              speciality: item.chefSpeciality
            });
          }
        }
      });

      setFeaturedPlans(allPlans.slice(0, 8)); // Show some plans directly
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
      <Navbar search={search} setSearch={setSearch} />

      {/* Hero Header */}
      <section className="bg-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white font-black text-[10px] uppercase tracking-widest mb-8">
              <Calendar className="w-4 h-4 text-primary" /> Curated Meal Plans
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-none">
              Premium <span className="text-primary">Subscriptions.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
              Enjoy consistent, home-cooked gourmet meals delivered to your doorstep every single day. No stress, just soul-satisfying food.
            </p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px]"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* Search & Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center shadow-2xl shadow-slate-200/50 mb-20"
        >
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by meal type, chef name, or cuisine..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
             <Filter className="w-5 h-5" /> Filter Plans
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-[450px] rounded-[3rem] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-32">
            
            {/* Featured Plans Section */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="flex justify-between items-end mb-12">
                <div>
                  <div className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2">Ready to Start</div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Featured Meal Plans</h2>
                </div>
                <div className="hidden md:flex gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {featuredPlans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredPlans.map(item => (
                    <motion.div key={item._id} variants={itemVariants}>
                      <ItemCard 
                        item={item} 
                        onAddToCart={handleAddToCart} 
                        onSubscribe={handleSubscribe}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-[4rem] p-24 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                    <Search className="h-12 w-12 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">No Plans Found</h3>
                  <p className="text-slate-500 font-medium">We couldn't find any meal plans matching "{search}".</p>
                </div>
              )}
            </motion.div>

            {/* Master Chefs Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between items-end mb-12">
                <div>
                  <div className="text-orange-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">The Hands Behind the Food</div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Artisanal Home Chefs</h2>
                </div>
                <button onClick={() => navigate("/customer")} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2">
                  View All Kitchens <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {chefs.map(chef => (
                  <motion.div 
                    key={chef.chefId}
                    whileHover={{ y: -10 }}
                    onClick={() => navigate(`/customer/chef/${chef.chefId}`, { state: { category: 'subscription' } })}
                    className="glass-card p-10 rounded-[3.5rem] cursor-pointer group"
                  >
                    <div className="flex items-center gap-8 mb-8">
                      <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chef.chefName}`} 
                          alt={chef.chefName} 
                          className="w-full h-full object-cover bg-orange-50"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{chef.chefName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            ★ {chef.chefRating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" /> {chef.location.split(',')[0]}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 font-medium line-clamp-2 italic text-sm leading-relaxed mb-8">
                      "{chef.bio || `Specialist in ${chef.speciality || 'Traditional Telugu Cuisine'}`}"
                    </p>
                    
                    <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">View Menu</span>
                       <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-primary transition-colors">
                          <ArrowRight className="w-5 h-5" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
          </div>
        )}
      </div>
    </div>
  );
}