import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Bike, Package, CheckCircle2, Navigation, Send, MapPin, Phone } from "lucide-react";

export default function Delivery() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/delivery/orders",
        { headers: { Authorization: user.token } }
      );
      setOrders(res.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/delivery/accept/${id}`,
        {},
        { headers: { Authorization: user.token } }
      );
      fetchOrders();
    } catch(e) {
      console.error(e);
    }
  };

  const markDelivered = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/order-status/${id}`,
        { status: "completed" },
        { headers: { Authorization: user.token } }
      );
      fetchOrders();
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const availableOrders = orders.filter(o => o.status === "accepted");
  const myDeliveries = orders.filter(o => o.status === "delivery_accepted" || o.status === "out_for_delivery");
  const pastDeliveries = orders.filter(o => o.status === "completed" || o.status === "rejected");

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Delivery Dashboard</h1>
            <p className="text-slate-500">Find nearby orders and manage your current deliveries.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              Available Orders
            </h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                 <div className="h-40 bg-slate-200 rounded-2xl"></div>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-8 text-center shadow-sm">
                 <div className="text-4xl mb-4">🍽️</div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">No pending orders</h3>
                 <p className="text-sm text-slate-500">Wait for chefs to accept orders.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 mb-2 inline-block">
                          Ready for Pickup
                        </span>
                        <h3 className="font-bold text-lg text-slate-800">Order from {order.chefName}</h3>
                        <p className="text-sm text-slate-500 mt-1">Deliver to: {order.customerName}</p>
                        
                        <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-3 mb-3">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">Pickup</p>
                              <p>{order.chefAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 mb-3">
                            <Navigation className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">Drop-off</p>
                              <p>{order.customerAddress}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Items Ordered</p>
                            <p className="text-sm font-medium text-slate-600">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 text-lg ml-4">₹{order.total}</div>
                    </div>
                    <button
                      onClick={() => acceptDelivery(order._id)}
                      className="w-full flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Deliveries */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-slate-700" />
              My Deliveries
            </h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                 <div className="h-40 bg-slate-200 rounded-2xl"></div>
              </div>
            ) : myDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-8 text-center shadow-sm">
                 <div className="text-4xl mb-4">🛵</div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">No active deliveries</h3>
                 <p className="text-sm text-slate-500">Accept an order to start delivering.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myDeliveries.map(order => (
                  <div key={order._id} className="bg-slate-800 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block ${
                            order.status === 'out_for_delivery' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {order.status === 'out_for_delivery' ? 'Out for Delivery' : 'Waiting for Chef'}
                          </span>
                          <h3 className="font-bold text-xl">Deliver to {order.customerName}</h3>
                          <p className="text-slate-400 text-sm mt-1">Pickup from: {order.chefName}</p>
                          
                          <div className="mt-6 bg-white/10 p-5 rounded-xl text-sm">
                            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-white/10">
                              <MapPin className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-indigo-300 uppercase tracking-wider font-bold mb-1">Pickup Location</p>
                                <p>{order.chefAddress}</p>
                                <div className="flex items-center mt-2 text-xs text-slate-300 font-medium">
                                  <Phone className="w-3 h-3 mr-1" /> {order.chefPhone}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-white/10">
                              <Navigation className="w-5 h-5 text-green-300 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-green-300 uppercase tracking-wider font-bold mb-1">Drop-off Location</p>
                                <p>{order.customerAddress}</p>
                                <div className="flex items-center mt-2 text-xs text-slate-300 font-medium">
                                  <Phone className="w-3 h-3 mr-1" /> {order.customerPhone}
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Order Items</p>
                              <p className="text-slate-200 text-sm font-medium">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.status === 'out_for_delivery' && (
                        <button
                          onClick={() => markDelivered(order._id)}
                          className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-md mt-4"
                        >
                          <Send className="w-5 h-5 mr-2" />
                          Mark Delivered
                        </button>
                      )}
                      {order.status === 'delivery_accepted' && (
                        <div className="text-sm text-slate-300 mt-4 bg-white/10 p-3 rounded-xl text-center">
                          Please wait at the kitchen. The chef will send the order out for delivery when ready.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Past Deliveries */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
            Past Deliveries
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
               <div className="h-24 bg-slate-200 rounded-2xl"></div>
            </div>
          ) : pastDeliveries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-8 text-center shadow-sm max-w-2xl">
               <h3 className="text-lg font-bold text-slate-800 mb-1">No past deliveries</h3>
               <p className="text-sm text-slate-500">Your completed deliveries will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastDeliveries.map(order => (
                <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 mb-2 inline-block">
                        Completed
                      </span>
                      <h3 className="font-bold text-slate-800">Deliver to {order.customerName}</h3>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>From: {order.chefName}</p>
                    <p>Total: ₹{order.total}</p>
                    <p className="text-xs mt-2">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
