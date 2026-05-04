import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User as UserIcon, LogOut, Menu, ChefHat, Flame, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Navbar({ search, setSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 detect current page
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 🔥 SMART CART NAVIGATION
  const handleCartClick = () => {
    if (location.pathname.includes("daily")) {
      navigate("/customer/cart/daily");
    } else if (location.pathname.includes("subscription")) {
      navigate("/customer/cart/subscription");
    } else if (location.pathname.includes("ready")) {
      navigate("/customer/cart/ready");
    } else {
      // fallback (from dashboard)
      navigate("/customer/cart/daily");
    }
  };

  return (
    <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/20 shadow-[0_2px_20px_rgba(0,0,0,0.03)] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20 w-full">
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => navigate(user?.role === 'customer' ? "/customer" : user?.role === 'delivery_partner' ? "/delivery" : "/")}
          >
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center"
            >
              <img 
                src="/src/assets/logo.png" 
                alt="HomeChef Logo" 
                className="w-full h-full object-cover scale-[1.2]" 
              />
            </motion.div>
            <span className="ml-4 text-xl font-black text-slate-900 tracking-tighter uppercase italic">HomeChef</span>
          </div>

          {/* Optional Search Bar */}
          {setSearch && (
            <div className="hidden md:flex flex-1 justify-center px-12">
              <div className="relative w-full max-w-lg group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find your next favorite chef..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user?.role === 'customer' && (
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mr-4">
                <button 
                  onClick={() => navigate("/customer/cook-guide")}
                  className={`p-2.5 rounded-xl transition-all ${location.pathname.includes('cook-guide') ? 'bg-white text-orange-500 shadow-sm ring-1 ring-orange-100' : 'text-slate-400 hover:text-orange-500 hover:bg-white'}`}
                  title="Cooking Guide"
                >
                  <Flame className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => navigate("/customer/my-subscriptions")}
                  className={`p-2.5 rounded-xl transition-all ${location.pathname.includes('my-subscriptions') ? 'bg-white text-blue-500 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-blue-500 hover:bg-white'}`}
                  title="My Subscriptions"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleCartClick}
                  className={`p-2.5 rounded-xl transition-all relative ${location.pathname.includes('cart') ? 'bg-white text-primary shadow-sm ring-1 ring-orange-100' : 'text-slate-400 hover:text-primary hover:bg-white'}`}
                  title="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            )}

            {user && (
              <button 
                onClick={() => navigate("/customer/profile")}
                className="flex items-center gap-3 pl-2 pr-5 py-2 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
              >
                <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Welcome</p>
                  <p className="text-sm font-black text-slate-800 leading-none">{user?.name?.split(' ')[0]}</p>
                </div>
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all ml-2"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-2xl text-slate-500 bg-slate-50 border border-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-slate-100 shadow-2xl p-6 space-y-4"
        >
          {user?.role === 'customer' && (
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-50">
               {[
                 { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', path: '/customer/cook-guide', label: 'Cook' },
                 { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', path: '/customer/my-subscriptions', label: 'Subs' },
                 { icon: ShoppingCart, color: 'text-primary', bg: 'bg-orange-50', action: handleCartClick, label: 'Cart' },
                 { icon: UserIcon, color: 'text-slate-600', bg: 'bg-slate-50', path: '/customer/profile', label: 'Profile' }
               ].map((item, i) => (
                 <button 
                  key={i}
                  onClick={() => { item.action ? item.action() : navigate(item.path); setIsMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-2"
                 >
                   <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                     <item.icon className="h-6 w-6" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                 </button>
               ))}
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-3 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </motion.div>
      )}
    </nav>
  );
}