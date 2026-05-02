import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Mail, Settings, CheckCircle2, Clock, Map, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Download, Star, History, ShoppingBag, ReceiptText, X, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", location: "", phone: "", address: "", walletBalance: 0 });
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [activeView, setActiveView] = useState("active");
  const [showInvoice, setShowInvoice] = useState(null);

  const fetchProfile = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get("http://localhost:3000/api/profile-data", { headers: { Authorization: user.token } });
      if (res.data) setForm(res.data);
    } catch(e) {}
  };

  const fetchOrders = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get("http://localhost:3000/api/customer/orders", { headers: { Authorization: user.token } });
      if (Array.isArray(res.data)) setOrders(res.data);
    } catch(e) {} finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get("http://localhost:3000/api/wallet/transactions", { headers: { Authorization: user.token } });
      if (Array.isArray(res.data)) setTransactions(res.data);
    } catch(e) {}
  };

  const handleAddMoney = async () => {
    if (!topUpAmount || isNaN(topUpAmount) || topUpAmount <= 0) return alert("Enter valid amount");
    try {
      await axios.post("http://localhost:3000/api/wallet/add-money", { amount: topUpAmount }, { headers: { Authorization: user.token } });
      setTopUpAmount("");
      alert("Balance updated! 💰");
      fetchProfile();
      fetchTransactions();
    } catch(e) { alert("Error"); }
  };

  const handleRate = async (orderId, stars) => {
    try {
      await axios.put(`http://localhost:3000/api/rate-order/${orderId}`, { stars }, { headers: { Authorization: user.token } });
      fetchOrders();
    } catch(e) {}
  };

  useEffect(() => {
    if (user?.token) {
      fetchProfile();
      fetchOrders();
      fetchTransactions();
    }
    const interval = setInterval(() => { 
      if (user?.token) {
        fetchOrders(); 
        fetchProfile(); 
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:3000/api/profile-data", form, { headers: { Authorization: user.token } });
      alert("Profile updated!");
    } catch (e) {}
  };

  const currentOrders = Array.isArray(orders) ? orders.filter(o => ["pending", "accepted", "delivery_accepted", "out_for_delivery"].includes(o.status)) : [];
  const previousOrders = Array.isArray(orders) ? orders.filter(o => ["rejected", "completed"].includes(o.status)) : [];

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-20 selection:bg-primary/20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Profile Quick Look */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass-card rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10"
          >
             <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-rose-400 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                   <User className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
             </div>
             
             <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{form?.name || "Home Chef"}</h1>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-slate-400 font-bold mb-6 tracking-widest uppercase text-[10px]">Elite Member Since 2024</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                   <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 shadow-sm flex items-center gap-2">
                      <Mail className="w-3 h-3 text-primary" /> {form?.email}
                   </div>
                   <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 shadow-sm flex items-center gap-2">
                      <Phone className="w-3 h-3 text-primary" /> {form?.phone || "No phone"}
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Wallet Command Center */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card-dark rounded-[3rem] p-10 text-white min-w-[380px] relative overflow-hidden"
          >
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Available Funds</p>
                    <h2 className="text-5xl font-black tracking-tighter">₹{form?.walletBalance?.toLocaleString() || "0"}</h2>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      className="w-full bg-white/10 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all placeholder:text-white/20"
                    />
                  </div>
                  <button onClick={handleAddMoney} className="bg-primary hover:bg-orange-600 px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
                     <Plus className="w-5 h-5" /> Top up
                  </button>
                </div>
             </div>
             
             {/* Decorative pattern */}
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/60 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white flex gap-2">
            {[
              { id: "active", label: "Active", icon: ShoppingBag, count: currentOrders.length },
              { id: "past", label: "History", icon: History, count: previousOrders.length },
              { id: "wallet", label: "Transactions", icon: TrendingUp },
              { id: "settings", label: "Security", icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-xs font-black transition-all duration-300 ${
                  activeView === tab.id 
                    ? "bg-slate-900 text-white shadow-xl scale-105" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${activeView === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeView === "active" && (
              <motion.div 
                key="active"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                 {currentOrders.length === 0 ? (
                   <div className="glass-card rounded-[3.5rem] p-20 text-center flex flex-col items-center">
                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                       <ShoppingBag className="w-10 h-10 text-slate-200" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No active orders</h3>
                     <p className="text-sm text-slate-400 font-bold mt-4 max-w-xs">Your kitchen is currently quiet. Why not discover something delicious?</p>
                     <button onClick={() => navigate("/customer")} className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                       Browse Chefs
                     </button>
                   </div>
                 ) : currentOrders.map(order => (
                   <motion.div 
                     layout
                     key={order._id} 
                     className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-2xl transition-all"
                   >
                      <div className="flex items-center gap-8">
                         <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-primary group-hover:rotate-3 transition-transform">
                            <Clock className="w-10 h-10" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-2">
                               <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                               <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">{order.status.replace("_", " ")}</p>
                            </div>
                            <h3 className="font-black text-slate-800 text-2xl tracking-tight">Chef {order.chefName}</h3>
                            <p className="text-sm text-slate-400 font-bold mt-1">{order.items?.map(i => i.name).join(', ') || "Custom Order"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8 w-full md:w-auto">
                         <div className="text-right hidden md:block">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{order.total}</p>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleTimeString()}</p>
                         </div>
                         <button onClick={() => navigate(`/customer/track/${order._id}`)} className="flex-1 md:flex-none bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-3">
                            Track Order <ArrowRight className="w-5 h-5" />
                         </button>
                      </div>
                   </motion.div>
                 ))}
              </motion.div>
            )}

            {activeView === "past" && (
              <motion.div 
                key="past"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                 {previousOrders.length === 0 ? (
                   <div className="col-span-full glass-card rounded-[3.5rem] p-20 text-center flex flex-col items-center">
                     <History className="w-16 h-16 text-slate-200 mb-6" />
                     <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No order history</h3>
                   </div>
                 ) : previousOrders.map(order => (
                   <div key={order._id} className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-50 hover:shadow-2xl transition-all relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-10">
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <h3 className="font-black text-slate-800 text-2xl tracking-tight">Chef {order.chefName}</h3>
                         </div>
                         <button onClick={() => setShowInvoice(order)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-primary hover:bg-primary/5 transition-all">
                            <ReceiptText className="w-6 h-6" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between">
                         <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{order.total}</p>
                         {order.status === "completed" && !order.rated ? (
                            <div className="flex gap-1">
                               {[1,2,3,4,5].map(s => (
                                  <button key={s} onClick={() => handleRate(order._id, s)} className="text-slate-100 hover:text-yellow-400 text-3xl transition-colors">★</button>
                               ))}
                            </div>
                         ) : order.rated ? (
                            <div className="px-4 py-2 bg-green-50 rounded-xl text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 className="w-4 h-4" /> Rated Order
                            </div>
                         ) : (
                            <div className="px-4 py-2 bg-rose-50 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest">Cancelled</div>
                         )}
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeView === "wallet" && (
              <motion.div 
                key="wallet"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-card rounded-[3.5rem] overflow-hidden"
              >
                 <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Real-time transaction history</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-slate-300" />
                    </div>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                       <div className="p-20 text-center text-slate-300 font-bold italic">No transactions recorded yet.</div>
                    ) : transactions.map(t => (
                      <div key={t._id} className="p-10 flex justify-between items-center hover:bg-slate-50/50 transition-all">
                         <div className="flex items-center gap-8">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                               {t.type === 'credit' ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-xl tracking-tight mb-1">{t.description}</p>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{new Date(t.date).toLocaleString()}</p>
                            </div>
                         </div>
                         <div className={`text-3xl font-black tracking-tighter ${t.type === 'credit' ? 'text-emerald-500' : 'text-slate-800'}`}>
                            {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeView === "settings" && (
              <motion.div 
                key="settings"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-card rounded-[3.5rem] p-16 max-w-2xl mx-auto"
              >
                 <div className="text-center mb-12">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Settings className="w-10 h-10 text-slate-200" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-800 tracking-tight">Identity & Security</h3>
                   <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Manage your personal information</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Legal Full Name</label>
                       <input className="w-full bg-slate-50/80 border-none rounded-2xl px-6 py-5 font-bold text-slate-800 focus:ring-2 focus:ring-primary transition-all shadow-sm" value={form?.name || ""} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Verified Phone</label>
                       <input className="w-full bg-slate-50/80 border-none rounded-2xl px-6 py-5 font-bold text-slate-800 focus:ring-2 focus:ring-primary transition-all shadow-sm" value={form?.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Delivery Headquarters</label>
                       <textarea className="w-full bg-slate-50/80 border-none rounded-2xl px-6 py-5 font-bold text-slate-800 h-32 resize-none focus:ring-2 focus:ring-primary transition-all shadow-sm" value={form?.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                    <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all hover:bg-slate-800 mt-10">
                       Save Profile Updates
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInvoice(null)}></div>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-[4rem] shadow-4xl overflow-hidden"
             >
                {/* Modal Header */}
                <div className="bg-primary p-12 text-white flex justify-between items-start relative overflow-hidden">
                   <div className="relative z-10">
                      <h2 className="text-5xl font-black tracking-tighter mb-1 italic">HomeChef</h2>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Official Order Receipt</p>
                   </div>
                   <button onClick={() => setShowInvoice(null)} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                   </button>
                   {/* Decorative circle */}
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="p-12">
                   <div className="flex justify-between items-end mb-12">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                         <p className="font-black text-slate-800 text-2xl tracking-tight">{form?.name || "Customer"}</p>
                         <p className="text-xs text-slate-400 font-bold mt-1">{form?.email}</p>
                      </div>
                      <div className="text-right">
                         <div className="px-5 py-2 bg-green-50 rounded-xl text-green-600 text-[10px] font-black uppercase tracking-widest inline-block mb-4">COMPLETED</div>
                         <p className="text-xs text-slate-400 font-black">#{showInvoice?._id?.substring(0,8).toUpperCase()}</p>
                      </div>
                   </div>

                   <div className="space-y-5 mb-12">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Order Particulars</p>
                      {showInvoice?.items?.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-sm italic">{item.quantity}x {item.name}</span>
                            <span className="font-black text-slate-900 text-sm">₹{(item.quantity * item.price).toLocaleString()}</span>
                         </div>
                      ))}
                   </div>

                   <div className="bg-slate-50 rounded-[2.5rem] p-10 flex justify-between items-center mb-12">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount Paid</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{showInvoice?.total?.toLocaleString() || "0"}</span>
                   </div>

                   <div className="flex items-center gap-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                      <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center p-1 bg-white overflow-hidden shadow-2xl">
                         <img 
                            src="/src/assets/logo.png" 
                            alt="Verified Seal" 
                            className="w-full h-full object-cover scale-[1.2]" 
                         />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                           <CheckCircle2 className="w-3 h-3" /> Quality Verified
                         </p>
                         <p className="text-xs italic font-bold leading-relaxed text-slate-500 max-w-[220px]">
                            "Freshly prepared by Chef {showInvoice?.chefName} with hand-picked ingredients and traditional love."
                         </p>
                      </div>
                   </div>
                </div>
                
                <div className="p-10 border-t border-slate-50 bg-slate-50/30 text-center">
                   <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Thank you for supporting home kitchens ❤️</p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}