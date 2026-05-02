import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { X, User, Mail, MapPin, Lock, Map as MapIcon, ChefHat, Bike, ArrowRight } from "lucide-react";
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
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position}></Marker> : null;
}

export default function SignupPopup({ setShowSignup, openLogin }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", location: "", password: "", role: "customer" });
  const [coordinates, setCoordinates] = useState([12.9716, 77.5946]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, coordinates };
      const res = await axios.post("http://localhost:3000/api/signup", payload);
      login({ token: res.data.token, role: res.data.role, name: form.name });
      navigate(res.data.role === "delivery_partner" ? "/delivery" : "/" + res.data.role);
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-4xl w-full max-w-5xl overflow-hidden relative flex flex-col md:flex-row animate-in zoom-in-95 duration-300 my-8">
        
        <button onClick={() => setShowSignup(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20">
          <X className="w-6 h-6" />
        </button>

        {/* Left Side: Mascot */}
        <div className="hidden lg:flex w-1/3 bg-primary/5 p-12 flex-col justify-center items-center text-center border-r border-slate-50">
           <img src="/src/assets/mascot.png" alt="Mascot" className="w-full object-contain drop-shadow-2xl mb-8" />
           <h3 className="text-xl font-black text-slate-800 tracking-tight">Join the Family</h3>
           <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
              Empowering local home cooks, delivering warmth to your soul.
           </p>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-[85vh] no-scrollbar">
          <div className="mb-8 text-center md:text-left">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h2>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Start your culinary journey with HomeChef</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Role Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
               {[
                { id: "customer", label: "Customer", icon: User },
                { id: "chef", label: "Chef", icon: ChefHat },
                { id: "delivery_partner", label: "Delivery", icon: Bike }
               ].map(role => (
                 <button
                  key={role.id}
                  type="button"
                  onClick={() => setForm({...form, role: role.id})}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${form.role === role.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <role.icon className="w-4 h-4" /> {role.label}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Display Name</label>
                  <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input name="name" required placeholder="Name" onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" /></div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                  <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input name="email" type="email" required placeholder="Email" onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" /></div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Delivery Address</label>
               <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input name="location" required placeholder="Street, Area, City" onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" /></div>
            </div>

            {form.role === "chef" && (
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><MapIcon className="w-3 h-3" /> Pin Kitchen Location</label>
                <div className="h-44 rounded-2xl overflow-hidden relative z-0 border border-slate-200">
                  <MapContainer center={coordinates} zoom={12} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={coordinates} setPosition={setCoordinates} />
                  </MapContainer>
                </div>
              </div>
            )}

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Secure Password</label>
               <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input name="password" type="password" required placeholder="••••••••" onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" /></div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]">
               {loading ? "Creating account..." : "Complete Registration"}
               <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-sm font-bold text-slate-500">
               Already a member?{" "}
               <button type="button" onClick={openLogin} className="text-primary font-black hover:underline underline-offset-4">Sign In</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}