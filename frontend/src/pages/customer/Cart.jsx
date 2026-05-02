import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, ArrowRight, ShoppingBag, MapPin, Search, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
  
  // Default map position (e.g. city center)
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

  // 🔥 FETCH CART
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

  // ❌ REMOVE ITEM completely
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

  // ➕ ADD ITEM (increment)
  const incrementItem = async (item) => {
    try {
      const mockItem = { _id: item.itemId, name: item.name, price: item.price, type };
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

  // ➖ DECREMENT ITEM
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

  // 🧹 CLEAR CART
  const clearCart = async () => {
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

  // 💰 TOTAL
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/place-order/${type}`,
        { deliveryLocation: deliveryPos }, // Pass coords to backend/track
        { headers: { Authorization: user.token } }
      );
      alert("Order placed successfully! Redirecting to tracking...");
      navigate(`/customer/track/${res.data.orderId}`);
    } catch (err) {
      console.log(err);
      alert("Error placing order");
    }
  };

  // 🔍 HANDLE SEARCH
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
        
        // Save to recent
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 capitalize flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3 text-primary" />
          {type} Cart
        </h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h3>
            <p className="text-slate-500 mb-8">Looks like you haven't added anything to your {type} cart yet.</p>
            <button 
              onClick={() => navigate("/customer")}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Items List */}
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Items ({items.length})</h2>
                    <button 
                      onClick={clearCart}
                      className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={item.itemId} className={`flex items-center py-2 ${index !== items.length - 1 ? 'border-b border-slate-50 pb-6' : ''}`}>
                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80`} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                          <div className="text-slate-500 font-medium mb-2">₹{item.price}</div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                              <button 
                                onClick={() => decrementItem(item.itemId)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-red-500 transition-colors"
                              >
                                <span className="text-lg leading-none mb-1">-</span>
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-slate-700">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => incrementItem(item)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-primary transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeItem(item.itemId)}
                              className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-xl font-bold text-slate-800">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Location Map */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary" />
                  Delivery Location
                </h2>
                <p className="text-sm text-slate-500 mb-4">Search for an address or click on the map to set your drop-off point.</p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-4 relative">
                  <input
                    type="text"
                    placeholder="Search for your building, street, or area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentClick(search)}
                        className="flex items-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors border border-slate-200"
                      >
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        <span className="truncate max-w-[150px]">{search.name.split(',')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="h-64 rounded-xl overflow-hidden border border-slate-200 z-0">
                  <MapContainer center={deliveryPos} zoom={13} className="w-full h-full" scrollWheelZoom={false}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker position={deliveryPos} setPosition={setDeliveryPos} />
                    <MapUpdater position={deliveryPos} />
                  </MapContainer>
                </div>
              </div>

            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes</span>
                    <span className="font-medium">₹{(total * 0.05).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{(total + total * 0.05).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={placeOrder}
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  Place Order
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                
                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center">
                  Secure checkout powered by HomeChef
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}