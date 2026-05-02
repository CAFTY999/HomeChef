import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Mail, Settings, CheckCircle2, Clock, Map, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Download, Star, History, ShoppingBag, ReceiptText, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", location: "", phone: "", address: "", walletBalance: 0 });
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [activeView, setActiveView] = useState("active");
  const [showInvoice, setShowInvoice] = useState(null); // Stores the order for the modal

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/profile-data", { headers: { Authorization: user.token } });
      setForm(res.data);
    } catch(e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/customer/orders", { headers: { Authorization: user.token } });
      setOrders(res.data);
    } catch(e) {} finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/wallet/transactions", { headers: { Authorization: user.token } });
      setTransactions(res.data);
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
    fetchProfile();
    fetchOrders();
    fetchTransactions();
    const interval = setInterval(() => { fetchOrders(); fetchProfile(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:3000/api/profile-data", form, { headers: { Authorization: user.token } });
      alert("Profile updated!");
    } catch (e) {}
  };

  const currentOrders = orders.filter(o => ["pending", "accepted", "delivery_accepted", "out_for_delivery"].includes(o.status));
  const previousOrders = orders.filter(o => ["rejected", "completed"].includes(o.status));

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-12 selection:bg-primary/20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Profile Card */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-orange-100/50 border border-white/60 mb-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
             <div className="relative">
                <div className="w-40 h-40 bg-gradient-to-br from-primary to-rose-400 rounded-[3rem] flex items-center justify-center text-white shadow-3xl shadow-primary/20">
                   <User className="w-16 h-16" />
                </div>
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full"></div>
             </div>
             
             <div className="flex-1 text-center lg:text-left">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{form.name || "Home Chef"}</h1>
                <p className="text-slate-400 font-bold mb-8 tracking-wide uppercase text-[10px]">Verified HomeChef Member</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                   <div className="px-6 py-3 bg-white/60 rounded-2xl border border-white text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary" /> {form.email}
                   </div>
                   <div className="px-6 py-3 bg-white/60 rounded-2xl border border-white text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {form.phone || "No phone"}
                   </div>
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white min-w-[320px] shadow-3xl relative overflow-hidden group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">My Balance</p>
                   <h2 className="text-5xl font-black mb-8">₹{form.walletBalance?.toLocaleString()}</h2>
                   <div className="flex gap-3">
                      <input 
                        type="number" 
                        placeholder="Top up" 
                        value={topUpAmount}
                        onChange={e => setTopUpAmount(e.target.value)}
                        className="flex-1 bg-white/10 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                      />
                      <button onClick={handleAddMoney} className="bg-primary hover:bg-orange-600 px-6 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
                         <Plus className="w-6 h-6" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-white/60 backdrop-blur-xl p-2 rounded-3xl shadow-xl shadow-slate-100 border border-white mb-10 sticky top-6 z-30 max-w-2xl mx-auto overflow-x-auto no-scrollbar">
           {[
            { id: "active", label: "Active", icon: ShoppingBag, count: currentOrders.length },
            { id: "past", label: "History", icon: History, count: previousOrders.length },
            { id: "wallet", label: "Wallet", icon: Wallet, count: transactions.length },
            { id: "settings", label: "Settings", icon: Settings }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveView(tab.id)}
               className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-xs font-black transition-all duration-300 whitespace-nowrap ${
                 activeView === tab.id ? "bg-slate-900 text-white shadow-2xl" : "text-slate-400 hover:text-slate-600"
               }`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Content Section */}
        <div className="max-w-5xl mx-auto">
           {activeView === "active" && (
             <div className="space-y-6">
                {currentOrders.length === 0 ? (
                  <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-24 text-center border border-white shadow-sm">
                    <ShoppingBag className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-slate-300 uppercase tracking-widest">No active orders</h3>
                  </div>
                ) : currentOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 group hover:scale-[1.01] transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-primary group-hover:rotate-3 transition-transform">
                           <Clock className="w-10 h-10" />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{order.status.replace("_", " ")}</p>
                           </div>
                           <h3 className="font-black text-slate-800 text-2xl">Chef {order.chefName}</h3>
                           <p className="text-sm text-slate-400 font-bold">{order.items?.map(i => i.name).join(', ')}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="text-right hidden md:block">
                           <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{order.total}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <button onClick={() => navigate(`/customer/track/${order._id}`)} className="flex-1 md:flex-none bg-primary text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:bg-orange-600 transition-all">
                           Track Order
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {activeView === "past" && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {previousOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 hover:shadow-2xl transition-all">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                           <h3 className="font-black text-slate-800 text-xl">Chef {order.chefName}</h3>
                        </div>
                        <button onClick={() => setShowInvoice(order)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-primary transition-all">
                           <ReceiptText className="w-6 h-6" />
                        </button>
                     </div>
                     <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-900">₹{order.total}</p>
                        {order.status === "completed" && !order.rated ? (
                           <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                 <button key={s} onClick={() => handleRate(order._id, s)} className="text-slate-100 hover:text-yellow-400 text-3xl">★</button>
                              ))}
                           </div>
                        ) : order.rated ? (
                           <div className="px-4 py-2 bg-green-50 rounded-xl text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Rated
                           </div>
                        ) : null}
                     </div>
                  </div>
                ))}
             </div>
           )}

           {activeView === "wallet" && (
              <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                 <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Financial Records</h3>
                    <Wallet className="w-8 h-8 text-slate-200" />
                 </div>
                 <div className="divide-y divide-slate-50">
                    {transactions.map(t => (
                      <div key={t._id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all">
                         <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                               {t.type === 'credit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-lg leading-tight mb-1">{t.description}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(t.date).toLocaleString()}</p>
                            </div>
                         </div>
                         <div className={`text-2xl font-black ${t.type === 'credit' ? 'text-emerald-500' : 'text-slate-800'}`}>
                            {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {activeView === "settings" && (
             <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-50 max-w-2xl mx-auto">
                <h3 className="text-2xl font-black text-slate-800 mb-10 text-center">Security & Identity</h3>
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                      <input className="w-full bg-slate-50/50 border-none rounded-2xl px-6 py-5 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                      <input className="w-full bg-slate-50/50 border-none rounded-2xl px-6 py-5 font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Home Address</label>
                      <textarea className="w-full bg-slate-50/50 border-none rounded-2xl px-6 py-5 font-bold h-32 resize-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                   </div>
                   <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all">
                      Update Profile Info
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Invoice Modal - SMOOTH & INTEGRATED */}
      {showInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInvoice(null)}></div>
           <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-4xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
              {/* Modal Header */}
              <div className="bg-primary p-10 text-white flex justify-between items-start">
                 <div>
                    <h2 className="text-4xl font-black tracking-tighter mb-1">HomeChef</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Order Receipt</p>
                 </div>
                 <button onClick={() => setShowInvoice(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="p-10">
                 <div className="flex justify-between items-end mb-10">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
                       <p className="font-black text-slate-800 text-lg">{form.name}</p>
                       <p className="text-xs text-slate-400 font-medium">{form.email}</p>
                    </div>
                    <div className="text-right">
                       <div className="px-4 py-2 bg-green-50 rounded-xl text-green-600 text-[10px] font-black uppercase tracking-widest inline-block mb-3">PAID</div>
                       <p className="text-xs text-slate-400 font-bold">#{showInvoice._id.substring(0,8).toUpperCase()}</p>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Order Items</p>
                    {showInvoice.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 text-sm">{item.quantity}x {item.name}</span>
                          <span className="font-black text-slate-800 text-sm">₹{(item.quantity * item.price).toLocaleString()}</span>
                       </div>
                    ))}
                 </div>

                 <div className="bg-slate-50 rounded-3xl p-8 flex justify-between items-center mb-10">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Total Amount</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{showInvoice.total.toLocaleString()}</span>
                 </div>

                 <div className="flex items-center gap-4 text-slate-300">
                    <div className="w-12 h-12 border-2 border-slate-100 rounded-full flex items-center justify-center text-[8px] font-black uppercase text-center leading-tight p-1">
                       Verified<br/>Chef
                    </div>
                    <p className="text-[10px] italic font-medium leading-relaxed">
                       This order was freshly prepared by Chef {showInvoice.chefName} and delivered to your doorstep.
                    </p>
                 </div>
              </div>
              
              <div className="p-8 border-t border-slate-50 bg-slate-50/50 text-center">
                 <p className="text-xs font-bold text-slate-400">Thank you for ordering with HomeChef! ❤️</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}