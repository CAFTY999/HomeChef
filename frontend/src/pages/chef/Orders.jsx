import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Clock, CheckCircle2, XCircle, ShoppingBag, Send, Bike, Calendar, User } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "subscriptions"

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/chef/orders",
        { headers: { Authorization: user.token } }
      );
      setOrders(res.data);
    } catch(e) {}
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/chef/subscriptions",
        { headers: { Authorization: user.token } }
      );
      setSubscriptions(res.data);
    } catch(e) {}
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:3000/api/order-status/${id}`,
        { status },
        { headers: { Authorization: user.token } }
      );
      fetchOrders();
    } catch(e) {}
  };

  useEffect(() => {
    fetchOrders();
    fetchSubscriptions();
    setLoading(false);
    const interval = setInterval(() => {
      fetchOrders();
      fetchSubscriptions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Chef Dashboard</h1>
              <p className="text-slate-500">Manage your orders and subscriptions.</p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "orders" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              Direct Orders ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab("subscriptions")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "subscriptions" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              Active Subscribers ({subscriptions.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
             <div className="h-40 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : activeTab === "orders" ? (
          // --- DIRECT ORDERS VIEW ---
          orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
               <div className="text-4xl mb-4">🍽️</div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">No incoming orders</h3>
               <p className="text-slate-500">Waiting for customers to place orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map(order => (
                <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {order.type}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'delivery_accepted' ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1">{order.customerName}</h3>
                    <div className="font-bold text-slate-900 text-lg mb-4">Total: ₹{order.total}</div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <ul className="space-y-2 text-sm font-medium text-slate-700">
                        {order.items.map(item => <li key={item.itemId}>{item.quantity}x {item.name}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 md:w-64 flex flex-col justify-center space-y-3">
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(order._id, "accepted")} className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors">
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Accept Order
                        </button>
                        <button onClick={() => updateStatus(order._id, "rejected")} className="w-full flex items-center justify-center bg-white text-red-500 hover:bg-red-50 border border-red-200 px-4 py-3 rounded-xl font-medium transition-colors">
                          <XCircle className="w-5 h-5 mr-2" /> Reject
                        </button>
                      </>
                    )}
                    {order.status === "delivery_accepted" && (
                      <button onClick={() => updateStatus(order._id, "out_for_delivery")} className="w-full flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-medium transition-colors">
                        <Bike className="w-5 h-5 mr-2" /> Send for Delivery
                      </button>
                    )}
                    {order.status === "completed" && <div className="text-center text-green-600 font-bold">Delivered</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // --- SUBSCRIPTIONS VIEW ---
          subscriptions.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
               <div className="text-4xl mb-4">📅</div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">No active subscribers</h3>
               <p className="text-slate-500">Your meal plans will appear here once users subscribe.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {subscriptions.map(sub => (
                <div key={sub._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Customer ID: {sub.userId.substring(0, 8)}...</h3>
                      <p className="text-sm font-bold text-primary">{sub.itemName}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" /> Ends: {new Date(sub.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                      {sub.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{sub.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}