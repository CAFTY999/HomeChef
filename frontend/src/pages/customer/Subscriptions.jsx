import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Subscriptions</h1>
          <p className="text-slate-500">Manage your active meal plans and track your daily deliveries.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Subscriptions</h2>
            <p className="text-slate-500 mb-6">You haven't subscribed to any meal plans yet.</p>
            <a href="/customer/subscription" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
              Explore Meal Plans
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {subscriptions.map((sub) => (
              <div key={sub._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                <div className="bg-primary/5 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{sub.itemName}</h2>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                      👨‍🍳 {sub.chefName} • <Clock className="h-3 w-3 mx-1" /> {sub.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Ending On</p>
                      <p className="text-sm font-bold text-slate-700">{new Date(sub.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" /> Delivery Schedule
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-3">
                    {sub.deliverySchedule.map((day) => {
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                      return (
                        <div 
                          key={day._id}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isToday ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-100'
                          }`}
                        >
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-sm font-bold text-slate-700 mb-2">
                            {new Date(day.date).getDate()}
                          </p>
                          
                          <div className="flex justify-center">
                            {day.status === 'pending' ? (
                              isToday ? (
                                <button 
                                  onClick={() => handleUpdateStatus(sub._id, day._id, 'skipped')}
                                  className="text-[10px] font-bold text-primary hover:underline"
                                >
                                  Skip?
                                </button>
                              ) : (
                                <Clock className="h-4 w-4 text-slate-300" />
                              )
                            ) : day.status === 'delivered' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center text-xs text-slate-500">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    <span>You can skip today's meal before 9:00 AM.</span>
                  </div>
                  <button 
                    onClick={() => handleCancelSubscription(sub._id)}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
