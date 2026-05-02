import Navbar from "../../components/Navbar";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ItemCard from "../../components/ItemCard";
import { Star, MapPin, Search } from "lucide-react";

export default function ChefDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  
  const [items, setItems] = useState([]);
  const [chefInfo, setChefInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState("all"); // 'all', 'veg', 'non-veg'
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || "daily"); 

  useEffect(() => {
    const fetchChefData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/items");
        // Find items belonging to this chef
        const chefItems = res.data.filter(item => item.chefId === id);
        setItems(chefItems);
        
        if (chefItems.length > 0) {
          setChefInfo({
            name: chefItems[0].chefName,
            rating: chefItems[0].chefRating,
            location: chefItems[0].location || "Local Kitchen"
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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Query
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Veg/Non-Veg Filter
      const isVeg = item.isVeg !== false;
      const matchesType = filterType === "all" || (filterType === "veg" && isVeg) || (filterType === "non-veg" && !isVeg);
      
      // 3. Price Filter
      const matchesPrice = item.price <= maxPrice;

      // 4. Category Filter
      const matchesCategory = item.type === selectedCategory;

      return matchesSearch && matchesType && matchesPrice && matchesCategory;
    });
  }, [items, searchQuery, filterType, maxPrice, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      
      {/* Chef Profile Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {loading ? (
             <div className="animate-pulse flex items-center space-x-6">
               <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
               <div className="space-y-3">
                 <div className="h-8 bg-slate-200 rounded w-48"></div>
                 <div className="h-4 bg-slate-200 rounded w-32"></div>
               </div>
             </div>
          ) : chefInfo ? (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chefInfo.name}`} 
                  alt={chefInfo.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{chefInfo.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-600">
                  <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    {chefInfo.rating > 0 ? chefInfo.rating.toFixed(1) : "New"}
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                    {chefInfo.location}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">Chef information not found.</div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Filters</h3>
            
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            {/* Veg / Non-Veg */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Dietary</h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="diet" value="all" checked={filterType === "all"} onChange={(e) => setFilterType(e.target.value)} className="text-primary focus:ring-primary" />
                  <span className="ml-2 text-sm text-slate-600">All Items</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="diet" value="veg" checked={filterType === "veg"} onChange={(e) => setFilterType(e.target.value)} className="text-primary focus:ring-primary" />
                  <span className="ml-2 text-sm text-slate-600">Pure Veg</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="diet" value="non-veg" checked={filterType === "non-veg"} onChange={(e) => setFilterType(e.target.value)} className="text-primary focus:ring-primary" />
                  <span className="ml-2 text-sm text-slate-600">Non-Veg</span>
                </label>
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Max Price: ₹{maxPrice}</h4>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>₹0</span>
                <span>₹10000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="flex-1">
          {/* Category Tabs - Hidden if navigating from a specific category section */}
          {!location.state?.category && (
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setSelectedCategory("daily")}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${selectedCategory === "daily" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Daily Meals
              </button>
              <button 
                onClick={() => setSelectedCategory("subscription")}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${selectedCategory === "subscription" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Subscription Plans
              </button>
              <button 
                onClick={() => setSelectedCategory("ready")}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${selectedCategory === "ready" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Ready-made (Pickles & Snacks)
              </button>
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-800 mb-6 capitalize">
            {location.state?.category ? (selectedCategory === 'ready' ? 'Pickles & Snacks' : `${selectedCategory} Plans`) : (selectedCategory === 'ready' ? 'Pickles & Snacks' : `${selectedCategory} Items`)}
          </h2>
          
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm h-80 animate-pulse">
                    <div className="h-48 bg-slate-200"></div>
                    <div className="p-4">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-10 bg-slate-200 rounded-xl w-10 ml-auto"></div>
                    </div>
                  </div>
                ))}
             </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100 border-dashed">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">No items found</h3>
              <p className="text-slate-500">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <ItemCard key={item._id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
