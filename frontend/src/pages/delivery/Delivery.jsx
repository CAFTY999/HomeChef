import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Bike, Package, CheckCircle2, Navigation, Send, MapPin, Phone, Calendar } from "lucide-react";

export default function Delivery() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subDeliveries, setSubDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "subscriptions"

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/delivery/orders",
        { headers: { Authorization: user.token } }
      );
      setOrders(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  const fetchSubDeliveries = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/delivery/subscriptions/today",
        { headers: { Authorization: user.token } }
      );
      setSubDeliveries(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  const acceptDelivery = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/delivery/accept/${id}`, {}, { headers: { Authorization: user.token } });
      fetchOrders();
    } catch(e) {}
  };

  const markDelivered = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/order-status/${id}`, { status: "completed" }, { headers: { Authorization: user.token } });
      fetchOrders();
    } catch(e) {}
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:3000/api/order-status/${id}`, { status }, { headers: { Authorization: user.token } });
      fetchOrders();
    } catch(e) {}
  };

  const handleSubDelivered = async (subId, scheduleId) => {
    try {
      await axios.put(`http://localhost:3000/api/subscriptions/update-status`, 
        { subscriptionId: subId, scheduleId, status: "delivered" }, 
        { headers: { Authorization: user.token } }
      );
      fetchSubDeliveries();
      alert("Subscription meal marked as delivered! ✅");
    } catch(e) {
      alert("Error updating status");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSubDeliveries();
    setLoading(false);
    const interval = setInterval(() => {
      fetchOrders();
      fetchSubDeliveries();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const availableOrders = orders.filter(o => o.status === "accepted");
  const myDeliveries = orders.filter(o => o.status === "delivery_accepted" || o.status === "out_for_delivery");

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Bike className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Delivery Partner</h1>
              <p className="text-slate-500">Track and manage your daily deliveries.</p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab("direct")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "direct" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              One-time Orders ({availableOrders.length + myDeliveries.length})
            </button>
            <button 
              onClick={() => setActiveTab("subscriptions")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "subscriptions" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              Subscription Deliveries ({subDeliveries.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4"><div className="h-40 bg-slate-200 rounded-2xl"></div></div>
        ) : activeTab === "direct" ? (
          // --- DIRECT ORDERS VIEW ---
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Package className="w-5 h-5 mr-2 text-primary" /> Available for Pickup</h2>
              {availableOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed p-8 text-center shadow-sm">No pending orders.</div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <div key={order._id} className="bg-white rounded-2xl border p-6 shadow-sm">
                      <h3 className="font-bold text-lg text-slate-800">Order from {order.chefName}</h3>
                      <p className="text-sm text-slate-500">Customer: {order.customerName}</p>
                      <button onClick={() => acceptDelivery(order._id)} className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold">Accept Delivery</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Navigation className="w-5 h-5 mr-2 text-slate-700" /> Active Deliveries</h2>
              {myDeliveries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed p-8 text-center shadow-sm">No active deliveries.</div>
              ) : (
                <div className="space-y-4">
                  {myDeliveries.map(order => (
                    <div key={order._id} className="bg-slate-800 text-white rounded-2xl p-6">
                      <h3 className="font-bold text-xl">Deliver to {order.customerName}</h3>
                      <p className="text-slate-400">Chef: {order.chefName}</p>
                      {order.status === 'delivery_accepted' && (
                        <button 
                          onClick={() => updateStatus(order._id, "out_for_delivery")} 
                          className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <Bike className="w-5 h-5" /> Start Delivery
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => markDelivered(order._id)} 
                          className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Mark Delivered
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // --- SUBSCRIPTION DELIVERIES VIEW ---
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subDeliveries.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-16 text-center border border-dashed">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No subscription meals today</h3>
                <p className="text-slate-500">Subscription deliveries will appear here on their scheduled dates.</p>
              </div>
            ) : (
              subDeliveries.map(sub => (
                <div key={sub._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Today's Subscription</span>
                      <span className="text-sm font-bold text-slate-800">₹{sub.price} (Prepaid)</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{sub.itemName}</h3>
                    <p className="text-sm text-slate-500 mb-4 flex items-center">👨‍🍳 {sub.chefName}</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                       <div className="flex items-start gap-2">
                         <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Deliver To</p>
                            <p className="text-sm font-medium text-slate-700">Customer ID: {sub.userId.substring(0,8)}...</p>
                         </div>
                       </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t">
                    <button 
                      onClick={() => handleSubDelivered(sub._id, sub.todaySchedule._id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Delivered
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
