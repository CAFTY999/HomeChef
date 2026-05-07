import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { X, User, Mail, MapPin, Lock, Map as MapIcon, ChefHat, Bike, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import mascot from "./assets/mascot.png"; // adjust path


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
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", location: "", password: "", role: "customer", otp: "" });
  const [coordinates, setCoordinates] = useState([12.9716, 77.5946]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOTP = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email.endsWith("@gmail.com")) {
      alert("Only @gmail.com emails are allowed");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/send-otp", { email });
      setOtpSent(true);
      alert(res.data.message);
      // For development, if email fails but OTP is returned in devOtp
      if (res.data.devOtp) {
        console.log("Dev OTP:", res.data.devOtp);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert("Please verify your email with OTP first");
      return;
    }
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        email: form.email.trim().toLowerCase(),
        otp: form.otp.trim(),
        coordinates 
      };
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={() => setShowSignup(false)}
      ></motion.div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] lg:rounded-[3.5rem] shadow-4xl w-full max-w-6xl overflow-hidden relative flex flex-col lg:flex-row z-10 max-h-[95vh] lg:max-h-[90vh]"
      >
        <button onClick={() => setShowSignup(false)} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all z-20">
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Left Side: Benefits & Mascot */}
        <div className="hidden lg:flex w-1/3 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden border-r border-white/5">
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                <Sparkles className="w-4 h-4" /> Start Journey
              </div>
              <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-8">Join the <br/> <span className="text-primary italic">HomeChef</span> family today.</h2>
            <div>
                        <img src={mascot} alt="HomeChef Mascot" className="w-full object-contain" />
                       </div>  
              
           </div>

           

           {/* Decorative background */}
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-6 sm:p-10 lg:p-10 xl:p-16 overflow-y-auto no-scrollbar bg-white">
          <div className="mb-6 sm:mb-10">
             <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h2>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Start your culinary journey with us</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6 sm:space-y-8">
            {/* Role Toggle */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select your role</label>
              <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-inner">
                {[
                  { id: "customer", label: "Customer", icon: User },
                  { id: "chef", label: "Chef", icon: ChefHat },
                  { id: "delivery_partner", label: "Delivery", icon: Bike }
                ].map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setForm({...form, role: role.id})}
                    className={`flex-1 py-4 text-xs font-black rounded-[1.5rem] transition-all flex items-center justify-center gap-2 ${form.role === role.id ? 'bg-white text-primary shadow-lg shadow-primary/5 ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <role.icon className="w-4 h-4" /> {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input name="name" required placeholder="Display name" onChange={handleChange} className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" />
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                   <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group flex-1">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <input 
                        name="email" 
                        type="email" 
                        required 
                        disabled={otpSent}
                        placeholder="your@gmail.com" 
                        value={form.email}
                        onChange={handleChange} 
                        className={`w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner ${otpSent ? 'opacity-60 cursor-not-allowed' : ''}`} 
                      />
                    </div>
                    {!otpSent ? (
                      <button 
                        type="button" 
                        onClick={handleSendOTP} 
                        disabled={otpLoading || !form.email}
                        className="flex-1 px-6 py-5 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/20 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {otpLoading ? "..." : "Send OTP"}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setOtpSent(false)} 
                        className="flex-1 px-6 py-5 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all whitespace-nowrap"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex justify-between">
                    <span>Enter 6-Digit OTP</span>
                    <button 
                      type="button" 
                      onClick={handleSendOTP}
                      className="text-primary hover:underline"
                    >
                      Resend OTP?
                    </button>
                  </label>
                <div className="relative group">
                  <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary transition-colors" />
                  <input 
                    name="otp" 
                    required 
                    placeholder="123456" 
                    maxLength={6}
                    onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-5 bg-primary/5 border-2 border-primary/20 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" 
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase">OTP Sent!</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Delivery Location</label>
               <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input name="location" required placeholder="Street, Area, City" onChange={handleChange} className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" />
              </div>
            </div>

            {form.role === "chef" && (
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2"><MapIcon className="w-3 h-3" /> Pin Kitchen Location</label>
                <div className="h-56 rounded-3xl overflow-hidden relative z-0 border border-slate-200 shadow-sm">
                  <MapContainer center={coordinates} zoom={12} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={coordinates} setPosition={setCoordinates} />
                  </MapContainer>
                </div>
              </div>
            )}

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Password</label>
               <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="Min 8 chars, 1 letter, 1 special char" 
                  onChange={handleChange} 
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" 
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 px-2">Must contain at least 8 characters, letters, numbers and special symbols (@$!%*#?&).</p>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-2xl shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group">
                {loading ? "Creating Account..." : "Join HomeChef"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-center pb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Already registered?{" "}
                <button type="button" onClick={openLogin} className="text-primary font-black hover:underline underline-offset-4 ml-2">Sign In</button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}