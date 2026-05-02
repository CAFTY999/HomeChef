import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { X, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPopup({ setShowLogin, openSignup }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: ""
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-4xl w-full max-w-4xl overflow-hidden relative flex animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={() => setShowLogin(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Side: Mascot & Branding */}
        <div className="hidden lg:flex flex-1 bg-primary/5 p-12 flex-col justify-between items-center text-center">
           <div className="w-full">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Sign in to HomeChef</p>
           </div>
           <img src="/src/assets/mascot.png" alt="HomeChef Mascot" className="w-full max-h-[400px] object-contain drop-shadow-2xl" />
           <p className="text-xs font-bold text-slate-400 italic">"Authentic flavors, straight from a home kitchen."</p>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 lg:hidden text-center">
             <h2 className="text-3xl font-black text-slate-900 mb-2">Login</h2>
             <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Welcome to HomeChef</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input name="email" type="email" required placeholder="your@email.com" onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input name="password" type="password" required placeholder="••••••••" onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="pt-6 text-center border-t border-slate-50">
              <p className="text-sm font-bold text-slate-500">
                New to the platform?{" "}
                <button type="button" onClick={openSignup} className="text-primary font-black hover:underline underline-offset-4">Join Now</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}