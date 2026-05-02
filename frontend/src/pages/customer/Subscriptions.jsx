import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, User, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/subscriptions/my", {
        headers: { Authorization: user.token }
      });
      setSubscriptions(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (subId, scheduleId, status) => {
    try {
      await axios.put("http://localhost:3000/api/subscriptions/update-status", {
        subscriptionId: subId,
        scheduleId,
        status
      }, {
        headers: { Authorization: user.token }
      });
      fetchSubscriptions();
    } catch (err) {
      console.log(err);
      alert("Error updating status");
    }
  };

  const handleCancelSubscription = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this subscription? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/subscriptions/${id}`, {
        headers: { Authorization: user.token }
      });
      fetchSubscriptions();
      alert("Subscription cancelled successfully.");
    } catch (err) {
      console.log(err);
      alert("Error cancelling subscription");
    }
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] pb-20 selection:bg-primary/20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6"
        >
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-widest mb-4">
              <Package className="w-4 h-4" /> My Culinary Journey
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Meal Plan Subscriptions</h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">Manage your active home-cooked meal plans and track your upcoming gourmet deliveries.</p>
          </div>
          <button 
            onClick={() => navigate("/customer/subscription")}
            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            Discover More Plans <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {loading ? (
          <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="glass-card rounded-[3rem] p-12 h-64 animate-pulse"></div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[4rem] p-24 text-center border-dashed border-2 border-slate-100"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
              <Calendar className="h-12 w-12 text-slate-200" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">No Active Subscriptions</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">You haven't subscribed to any meal plans yet. Our chefs are waiting to cook for you!</p>
            <a href="/customer/subscription" className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-900/20">
              Explore Meal Plans <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {subscriptions.map((sub, idx) => (
              <motion.div 
                key={sub._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-[3.5rem] overflow-hidden"
              >
                <div className="bg-slate-900/5 p-10 border-b border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-primary">
                      <Package className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{sub.itemName}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <User className="h-3 w-3" /> {sub.chefName}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {sub.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Contract Status</p>
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-200 hidden md:block"></div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ending On</p>
                      <p className="text-sm font-black text-slate-800">{new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                <div className="p-10 lg:p-14">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Delivery Schedule
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Delivered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-4">
                    {sub.deliverySchedule.map((day) => {
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                      return (
                        <div 
                          key={day._id}
                          className={`relative p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center min-h-[120px] ${
                            isToday 
                              ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg scale-105 z-10' 
                              : 'border-slate-50 bg-slate-50/30'
                          }`}
                        >
                          <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className={`text-2xl font-black mb-4 ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
                            {new Date(day.date).getDate()}
                          </p>
                          
                          <div className="flex justify-center">
                            {day.status === 'pending' ? (
                              isToday ? (
                                <button 
                                  onClick={() => handleUpdateStatus(sub._id, day._id, 'skipped')}
                                  className="text-[10px] font-black text-primary hover:underline hover:scale-105 transition-transform"
                                >
                                  Skip?
                                </button>
                              ) : (
                                <Clock className="h-5 w-5 text-slate-200" />
                              )
                            ) : day.status === 'delivered' ? (
                              <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-200">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="bg-rose-100 rounded-full p-1">
                                <XCircle className="h-4 w-4 text-rose-400" />
                              </div>
                            )}
                          </div>
                          
                          {isToday && (
                            <div className="absolute -top-3 px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                              Today
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-slate-50/50 px-10 py-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center text-[10px] text-slate-400 font-bold italic">
                    <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                    <span>Skip requests must be submitted before 9:00 AM on the day of delivery.</span>
                  </div>
                  <button 
                    onClick={() => handleCancelSubscription(sub._id)}
                    className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                  >
                    Terminate Subscription
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

