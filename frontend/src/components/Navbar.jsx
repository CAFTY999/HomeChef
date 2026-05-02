import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User as UserIcon, LogOut, Menu, ChefHat, Flame } from "lucide-react";
import { useState } from "react";

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
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => navigate(user?.role === 'customer' ? "/customer" : user?.role === 'delivery_partner' ? "/delivery" : "/")}
          >
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <span className="ml-3 text-xl font-bold text-slate-800 tracking-tight">HomeChef</span>
          </div>

          {/* Optional Search Bar for Customer Home/Categories */}
          {setSearch && (
            <div className="hidden md:flex flex-1 justify-center px-8">
              <input 
                type="text" 
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chefs or dishes..."
                className="w-full max-w-md bg-slate-100 border-none rounded-full py-2 px-5 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && <span className="text-sm font-medium text-slate-600">Hi, {user?.name}</span>}
            
            {user?.role === 'customer' && (
              <>
                <button 
                  onClick={handleCartClick}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative"
                  title="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
                
                <button 
                  onClick={() => navigate("/customer/profile")}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                  title="Profile"
                >
                  <UserIcon className="h-5 w-5" />
                </button>

                <button 
                  onClick={() => navigate("/customer/cook-guide")}
                  className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                  title="Cooking Guide"
                >
                  <Flame className="h-5 w-5" />
                </button>
              </>
            )}
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
             {setSearch && (
              <div className="py-2">
                <input 
                  type="text" 
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-slate-100 border-none rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            )}
            <div className="flex items-center px-3 py-3 border-b border-slate-100">
              <span className="text-base font-medium text-slate-800">Hi, {user?.name}</span>
            </div>
            {user?.role === 'customer' && (
              <>
                <button 
                  onClick={() => { handleCartClick(); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md"
                >
                  <ShoppingCart className="h-5 w-5 mr-3" /> Cart
                </button>
                <button 
                  onClick={() => { navigate("/customer/profile"); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full px-3 py-3 text-base font-medium text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md"
                >
                  <UserIcon className="h-5 w-5 mr-3" /> Profile
                </button>
                <button 
                  onClick={() => { navigate("/customer/cook-guide"); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full px-3 py-3 text-base font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                >
                  <Flame className="h-5 w-5 mr-3 text-orange-500" /> Cook Guide
                </button>
              </>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="h-5 w-5 mr-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}