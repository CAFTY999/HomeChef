import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Clock, CheckCircle2, XCircle, ShoppingBag, Send, Bike } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/chef/orders",
        { headers: { Authorization: user.token } }
      );
      setOrders(res.data);
    } catch(e) {} finally {
      setLoading(false);
    }
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
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incoming Orders</h1>
            <p className="text-slate-500">Manage orders from your customers here.</p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
             <div className="h-40 bg-slate-200 rounded-2xl"></div>
             <div className="h-40 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
             <div className="text-4xl mb-4">🍽️</div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No incoming orders</h3>
             <p className="text-slate-500">Waiting for customers to place orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
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
                  {order.deliveryPartnerName && (
                    <p className="text-sm font-medium text-slate-500 mb-2">
                      Delivery by: <span className="text-indigo-600">{order.deliveryPartnerName}</span>
                    </p>
                  )}
                  <div className="font-bold text-slate-900 text-lg mb-4">Total: ₹{order.total}</div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order Items</h4>
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li key={item.itemId} className="flex justify-between items-center text-sm font-medium text-slate-700">
                          <span>{item.quantity}x {item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 md:w-64 flex flex-col justify-center space-y-3">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(order._id, "accepted")}
                        className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Accept Order
                      </button>
                      <button
                        onClick={() => updateStatus(order._id, "rejected")}
                        className="w-full flex items-center justify-center bg-white text-red-500 hover:bg-red-50 border border-red-200 px-4 py-3 rounded-xl font-medium transition-colors"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <div className="text-center text-blue-600 bg-blue-50 p-3 rounded-xl font-medium border border-blue-100">
                      Waiting for a delivery partner to accept...
                    </div>
                  )}
                  {order.status === "delivery_accepted" && (
                    <button
                      onClick={() => updateStatus(order._id, "out_for_delivery")}
                      className="w-full flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <Bike className="w-5 h-5 mr-2" />
                      Send for Delivery
                    </button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <div className="text-center text-purple-600 bg-purple-50 p-3 rounded-xl font-medium border border-purple-100">
                      Out for delivery. Waiting for partner to deliver.
                    </div>
                  )}
                  {(order.status === "completed" || order.status === "rejected") && (
                    <div className="text-center text-slate-500 text-sm font-medium">
                      Order finalized.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}