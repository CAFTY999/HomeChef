import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Mail, Settings, CheckCircle2, Clock, Map } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    address: ""
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH PROFILE
  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/profile-data",
        { headers: { Authorization: user.token } }
      );
      setForm(res.data);
    } catch(e) {}
  };

  // FETCH ORDERS
  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/customer/orders",
        { headers: { Authorization: user.token } }
      );
      setOrders(res.data);
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    try {
      await axios.put(
        "http://localhost:3000/api/profile-data",
        form,
        { headers: { Authorization: user.token } }
      );
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Error updating profile");
    }
  };

  // FILTERS
  const currentOrders = orders.filter(o => o.status === "pending" || o.status === "accepted" || o.status === "delivery_accepted" || o.status === "out_for_delivery");
  const previousOrders = orders.filter(o => o.status === "rejected" || o.status === "completed");

  const renderOrderCard = (order, isCurrent) => {
    return (
      <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 hover:shadow-md transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
              {order.type}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center ${isCurrent ? 'bg-yellow-100 text-yellow-700' : (order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
              {isCurrent ? <Clock className="w-3 h-3 mr-1" /> : (order.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null)}
              {order.status.replace("_", " ")}
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-800">Order from {order.chefName}</h3>
          {order.deliveryPartnerName && (
            <p className="text-xs font-semibold text-indigo-600 mb-1">
              Delivery Partner: {order.deliveryPartnerName}
            </p>
          )}
          <p className="text-sm text-slate-500 mb-2">
            {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
          </p>
          <div className="font-bold text-slate-900">₹{order.total}</div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          {isCurrent && (
            <button 
              onClick={() => navigate(`/customer/track/${order._id}`)}
              className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors w-full md:w-auto"
            >
              <Map className="w-4 h-4 mr-2" />
              Track Order
            </button>
          )}

          {/* ⭐ RATE BUTTON */}
          {order.status === "completed" && !order.rated && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
              <p className="text-xs text-slate-500 mb-2 font-medium text-center">Rate this order</p>
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(num => (
                  <button
                    key={num}
                    onClick={async () => {
                      await axios.put(
                        `http://localhost:3000/api/rate-order/${order._id}`,
                        { stars: num },
                        { headers: { Authorization: user.token } }
                      );
                      fetchOrders();
                    }}
                    className="text-slate-300 hover:text-yellow-400 transition-colors"
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          )}
          {order.status === "completed" && order.rated && (
            <div className="text-sm text-green-600 font-medium flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
               <CheckCircle2 className="w-4 h-4 mr-1" /> Rated
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Profile Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
            <div className="bg-slate-900 h-32 relative"></div>
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 bg-white rounded-full p-1 absolute -top-12 border border-slate-100 shadow-sm">
                <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                   <User className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              
              <div className="pt-14 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800">{form.name || "Customer"}</h2>
                <p className="text-slate-500 text-sm">Food Enthusiast</p>
              </div>

              <div className="py-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    className="flex-1 bg-transparent border-b border-slate-200 focus:border-primary focus:outline-none py-1 text-sm text-slate-700 transition-colors"
                    placeholder="Full Name"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    className="flex-1 bg-transparent border-b border-slate-200 py-1 text-sm text-slate-500 cursor-not-allowed"
                    placeholder="Email"
                    value={form.email || ""}
                    disabled
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    className="flex-1 bg-transparent border-b border-slate-200 focus:border-primary focus:outline-none py-1 text-sm text-slate-700 transition-colors"
                    placeholder="Phone Number"
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    className="flex-1 bg-transparent border-b border-slate-200 focus:border-primary focus:outline-none py-1 text-sm text-slate-700 transition-colors"
                    placeholder="Location"
                    value={form.location || ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    className="flex-1 bg-transparent border-b border-slate-200 focus:border-primary focus:outline-none py-1 text-sm text-slate-700 transition-colors resize-none h-16"
                    placeholder="Full Delivery Address"
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="w-full lg:w-2/3">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-primary" />
              Active Orders
            </h2>
            {loading ? (
               <div className="animate-pulse space-y-4">
                 <div className="h-32 bg-slate-200 rounded-2xl"></div>
               </div>
            ) : currentOrders.length > 0 ? (
              currentOrders.map(order => renderOrderCard(order, true))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-8 text-center">
                 <p className="text-slate-500">No active orders right now.</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2 text-slate-400" />
              Past Orders
            </h2>
            {loading ? (
               <div className="animate-pulse space-y-4">
                 <div className="h-32 bg-slate-200 rounded-2xl"></div>
                 <div className="h-32 bg-slate-200 rounded-2xl"></div>
               </div>
            ) : previousOrders.length > 0 ? (
              previousOrders.map(order => renderOrderCard(order, false))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-8 text-center">
                 <p className="text-slate-500">Your past orders will appear here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}