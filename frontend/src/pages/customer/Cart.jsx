import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, ArrowRight, ShoppingBag, MapPin, Search, Clock, Trash, Minus, ShieldCheck, Zap } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location Picker Component
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position}></Marker> : null;
}

// Update Map Center Component
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, {
        duration: 1.5
      });
    }
  }, [position, map]);
  return null;
}

export default function Cart() {
  const { user } = useAuth();
  const { type } = useParams(); // 🔥 daily / subscription / ready
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [deliveryPos, setDeliveryPos] = useState([12.9352, 77.6245]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/cart/${type}`,
        {
          headers: { Authorization: user.token }
        }
      );
      setItems(res.data.items || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [type]);

  const removeItem = async (id) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/remove",
        { type, itemId: id },
        { headers: { Authorization: user.token } }
      );
      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  const incrementItem = async (item) => {
    try {
      const mockItem = { 
        _id: item.itemId, 
        name: item.name, 
        price: item.price, 
        chefId: item.chefId, // ✅ important for multi-chef
        type 
      };
      await axios.post(
        "http://localhost:3000/api/cart/add",
        { item: mockItem },
        { headers: { Authorization: user.token } }
      );
      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  const decrementItem = async (id) => {
    try {
      await axios.post(
        "http://localhost:3000/api/cart/decrement",
        { type, itemId: id },
        { headers: { Authorization: user.token } }
      );
      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Empty your entire cart?")) return;
    try {
      await axios.post(
        "http://localhost:3000/api/cart/clear",
        { type },
        { headers: { Authorization: user.token } }
      );
      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const placeOrder = async () => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/place-order/${type}`,
        { deliveryLocation: deliveryPos },
        { headers: { Authorization: user.token } }
      );
      navigate(`/customer/track/${res.data.orderId}`);
    } catch (err) {
      console.log(err);
      alert("Error placing order");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.length > 0) {
        const lat = parseFloat(res.data[0].lat);
        const lon = parseFloat(res.data[0].lon);
        const newPos = [lat, lon];
        setDeliveryPos(newPos);
        
        const newSearch = { name: res.data[0].display_name, lat, lon };
        const updatedRecents = [newSearch, ...recentSearches.filter(s => s.name !== newSearch.name)].slice(0, 5);
        setRecentSearches(updatedRecents);
        localStorage.setItem("recentSearches", JSON.stringify(updatedRecents));
        setSearchQuery("");
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRecentClick = (search) => {
    setDeliveryPos([search.lat, search.lon]);
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-20 selection:bg-primary/20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-widest mb-4">
            <ShoppingBag className="w-4 h-4" /> Checkout Phase
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 capitalize">{type} Basket</h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">Review your selection and confirm your delivery details for a seamless home-cooked experience.</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass-card h-32 rounded-[2.5rem] animate-pulse"></div>
              ))}
            </div>
            <div className="lg:col-span-4 h-96 glass-card rounded-[2.5rem] animate-pulse"></div>
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[4rem] p-24 text-center border-dashed border-2 border-slate-100"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
              <ShoppingBag className="w-12 h-12 text-slate-200" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Your basket is empty</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">It looks like you haven't added any {type} items to your basket yet.</p>
            <button 
              onClick={() => navigate("/customer")}
              className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-900/20"
            >
              Start Exploring <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Items List */}
            <div className="lg:col-span-8 space-y-10">
              <div className="glass-card rounded-[3.5rem] overflow-hidden">
                <div className="p-10">
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-white">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Selected Items ({items.length})</h2>
                    <button 
                      onClick={clearCart}
                      className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                    >
                      Clear Entire Basket
                    </button>
                  </div>
                  
                  <div className="space-y-10">
                    <AnimatePresence>
                      {items.map((item, index) => (
                        <motion.div 
                          layout
                          key={item.itemId} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`flex items-center gap-8 ${index !== items.length - 1 ? 'border-b border-white/50 pb-10' : ''}`}
                        >
                          <div className="w-28 h-28 bg-white rounded-[2rem] overflow-hidden flex-shrink-0 shadow-xl border border-white">
                            <img src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{item.name}</h3>
                            <div className="text-slate-400 font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                               Price Unit <span className="w-1 h-1 bg-slate-200 rounded-full"></span> ₹{item.price}
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                                <button 
                                  onClick={() => decrementItem(item.itemId)}
                                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-rose-500 transition-all active:scale-90"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-sm font-black text-slate-800">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => incrementItem(item)}
                                  className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-primary transition-all active:scale-90"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeItem(item.itemId)}
                                className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-2xl transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                             <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{item.price * item.quantity}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Delivery Location Section */}
              <div className="glass-card rounded-[3.5rem] p-10 border border-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" /> Delivery Logistics
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-2">Specify your Drop-off coordinates for precision delivery.</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Manual Pin
                  </div>
                </div>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8 relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Enter delivery area or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                </form>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-8 flex flex-wrap gap-3">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentClick(search)}
                        className="flex items-center text-[10px] font-black bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 px-4 py-2 rounded-xl transition-all border border-slate-100 shadow-sm"
                      >
                        <Clock className="w-3 h-3 mr-2 opacity-50" />
                        <span className="truncate max-w-[150px] uppercase tracking-widest">{search.name.split(',')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="h-80 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative z-0">
                  <MapContainer center={deliveryPos} zoom={13} className="w-full h-full" scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={deliveryPos} setPosition={setDeliveryPos} />
                    <MapUpdater position={deliveryPos} />
                  </MapContainer>
                  
                  <div className="absolute top-6 left-6 z-[10] bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Pin Point Active</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 sticky top-32">
              <div className="glass-card rounded-[3.5rem] p-10 border border-white shadow-2xl shadow-primary/5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-10">Financial Summary</h2>
                
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Selection Total</span>
                    <span className="text-lg font-black text-slate-800">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Delivery Fee</span>
                    <span className="text-sm font-black text-green-500 uppercase tracking-widest">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Regulatory Tax (5%)</span>
                    <span className="text-lg font-black text-slate-800">₹{tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t-2 border-dashed border-slate-100 pt-8 mb-12">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Final Invoice</p>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <ShieldCheck className="w-6 h-6 text-primary mb-1" />
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secure</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={placeOrder}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-3xl py-6 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-2xl shadow-slate-900/20 group active:scale-95"
                >
                  Finalize Order
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
                
              </div>
              
              <div className="mt-8 px-10 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  By finalizing your order, you agree to HomeChef's premium service terms and conditions.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}