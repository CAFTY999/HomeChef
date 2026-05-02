import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { X, User, Mail, MapPin, Lock, Map as MapIcon, ChefHat, Bike } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position}></Marker> : null;
}

export default function SignupPopup({ setShowSignup, openLogin }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    password: "",
    role: "customer"
  });

  const [coordinates, setCoordinates] = useState([12.9716, 77.5946]); // Default: Bangalore

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, coordinates };
      const res = await axios.post("http://localhost:3000/api/signup", payload);

      login({
        token: res.data.token,
        role: res.data.role,
        name: form.name
      });

      alert("Registered as " + res.data.role);
      navigate(res.data.role === "delivery_partner" ? "/delivery" : "/" + res.data.role);
    } catch (err) {
      console.log(err);
      if (err.response) {
        alert(err.response.data.error);
      } else {
        alert("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 my-8">
        
        <button 
          onClick={() => setShowSignup(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
          <p className="text-slate-500 text-sm">Join HomeChef to explore delicious food</p>
        </div>

        <form onSubmit={handleSignup} className="px-8 pb-8 space-y-4">
          
          {/* Role Selection */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setForm({...form, role: "customer"})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.role === "customer" ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User className="w-4 h-4 inline-block mr-1" /> Customer
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, role: "chef"})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.role === "chef" ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ChefHat className="w-4 h-4 inline-block mr-1" /> Chef
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, role: "delivery_partner"})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.role === "delivery_partner" ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Bike className="w-4 h-4 inline-block mr-1" /> Delivery
            </button>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              name="name" 
              required
              placeholder={form.role === "chef" ? "Chef / Kitchen Name" : form.role === "delivery_partner" ? "Delivery Partner Name" : "Full Name"}
              onChange={handleChange} 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              name="email" 
              type="email"
              required
              placeholder="Email address" 
              onChange={handleChange} 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              name="location" 
              required
              placeholder="Address / Area" 
              onChange={handleChange} 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {form.role === "chef" && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <MapIcon className="w-3 h-3 mr-1" /> Pick Kitchen Location
              </label>
              <div className="h-40 rounded-lg overflow-hidden border border-slate-200 relative z-0">
                <MapContainer center={coordinates} zoom={12} className="w-full h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={coordinates} setPosition={setCoordinates} />
                </MapContainer>
              </div>
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              name="password" 
              type="password" 
              required
              placeholder="Password" 
              onChange={handleChange} 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-sm mt-2"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={openLogin}
              className="text-primary font-bold hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}