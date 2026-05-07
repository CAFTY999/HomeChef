import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { X, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mascot from "./assets/mascot.png"; // adjust path

export default function LoginPopup({ setShowLogin, openSignup }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "customer"
  });
 
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/login", form);
      login({ token: res.data.token, role: res.data.role, name: res.data.name });
      navigate(res.data.role === "delivery_partner" ? "/delivery" : "/" + res.data.role);
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
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
        onClick={() => setShowLogin(false)}
      ></motion.div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] lg:rounded-[3.5rem] shadow-4xl w-full max-w-4xl overflow-hidden relative flex flex-col lg:flex-row z-10 max-h-[92vh] lg:max-h-[95vh]"
      >
        {/* Close Button */}
        <button 
          onClick={() => setShowLogin(false)}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all z-20"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Left Side: Immersive Branding */}
        <div className="hidden lg:flex flex-1 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                <Sparkles className="w-4 h-4" /> Welcome Back
              </div>
              <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter mb-6">Continue your <br/> <span className="text-primary italic">culinary</span> journey.</h2>
           </div>
           
           <div>
            <img src={mascot} alt="HomeChef Mascot" className="w-full object-contain" />
           </div>

           {/* Decorative elements */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-30 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-6 sm:p-10 lg:p-20 flex flex-col justify-center bg-white">
          <div className="mb-8 sm:mb-12">
             <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2">Login</h2>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Sign in to your HomeChef account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
            {/* Role Toggle for Login */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Login as</label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {[
                  { id: "customer", label: "Customer" },
                  { id: "chef", label: "Chef" },
                  { id: "delivery_partner", label: "Delivery" }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({...form, role: r.id})}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${form.role === r.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input name="email" type="email" required placeholder="your@email.com" onChange={handleChange} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Key</label>
                <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input name="password" type="password" required placeholder="••••••••" onChange={handleChange} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-2xl shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group mt-4">
              {loading ? "Verifying..." : "Sign into Account"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-10 text-center border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                New to HomeChef?{" "}
                <button type="button" onClick={openSignup} className="text-primary font-black hover:underline underline-offset-4 ml-2">Create Account</button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}