import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import { Clock, CalendarDays, UtensilsCrossed, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "../assets/hero_meal.png";

export default function Customer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const ordersRes = await axios.get("http://localhost:3000/api/customer/orders", {
          headers: { Authorization: user.token }
        });
        
        const itemsRes = await axios.get("http://localhost:3000/api/items");
        const allItems = itemsRes.data;
        
        if (ordersRes.data.length > 0) {
          const pastOrderItems = ordersRes.data.flatMap(o => o.items.map(i => i.itemId));
          const recommendedItems = allItems.filter(item => pastOrderItems.includes(item._id) || Math.random() > 0.7).slice(0, 4);
          setRecommendations(recommendedItems.length > 0 ? recommendedItems : allItems.slice(0, 4));
        } else {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-20 selection:bg-primary/20 overflow-x-hidden">
      <Navbar search={search} setSearch={setSearch} />

      {/* Hero Section - Immersive Design */}
      <section className="relative min-h-[85vh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fffcfb] via-[#fffcfb]/95 to-transparent z-10"></div>
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={heroImage} 
            alt="Hero Meal" 
            className="w-full h-full object-cover object-right"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold text-xs uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Discover Authentic Flavors
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
              Gourmet <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Home Kitchens.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg mb-10 leading-relaxed">
              Experience the soul of home-cooked meals, crafted by passionate local chefs and delivered with care to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate("/customer/daily")}
                className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                Order Now <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate("/customer/subscription")}
                className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black shadow-xl shadow-slate-100 hover:bg-slate-50 transition-all"
              >
                View Meal Plans
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-30">
        {/* Categories Section - Glassmorphism Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
        >
          {[
            { 
              title: "Daily Meals", 
              desc: "Fresh, curated everyday meals from local home kitchens.", 
              icon: CalendarDays, 
              color: "blue",
              path: "/customer/daily"
            },
            { 
              title: "Subscription", 
              desc: "Seamless weekly or monthly meal plans tailored for you.", 
              icon: Clock, 
              color: "purple",
              path: "/customer/subscription"
            },
            { 
              title: "Ready-made", 
              desc: "Handcrafted snacks, pickles, and artisanal delicacies.", 
              icon: UtensilsCrossed, 
              color: "green",
              path: "/customer/ready"
            }
          ].map((cat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              onClick={() => navigate(cat.path, { state: { search } })}
              className="glass-card p-10 rounded-[3rem] cursor-pointer group relative overflow-hidden"
            >
              <div className={`w-16 h-16 bg-${cat.color}-50 text-${cat.color}-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <cat.icon className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{cat.title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">{cat.desc}</p>
              
              <div className="mt-8 flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest group-hover:text-primary transition-colors">
                Explore Menu <ArrowRight className="w-4 h-4" />
              </div>
              
              {/* Decorative gradient corner */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recommended For You Section */}
        {!loading && recommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-24"
          >
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2">Curated for You</div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Chef's Highlights</h2>
              </div>
              
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ItemCard item={item} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}