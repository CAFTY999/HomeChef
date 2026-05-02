import Navbar from "../../components/Navbar";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { PackageOpen, MapPin, ChefHat, Bike, CheckCircle2, Clock, Navigation, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const chefIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3565/3565401.png',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44]
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/14164/14164194.png',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/9561/9561688.png',
  iconSize: [54, 54],
  iconAnchor: [27, 27],
  className: 'smooth-marker'
});

export default function TrackOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [progress, setProgress] = useState(0);
  const [routePath, setRoutePath] = useState([]);
  const [order, setOrder] = useState(null);
  
  const [chefPos, setChefPos] = useState([12.9716, 77.5946]);
  const [userPos, setUserPos] = useState([12.9352, 77.6245]);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/order/${orderId}`, {
          headers: { Authorization: user.token }
        });
        const currentOrder = res.data.order;
        setOrder(currentOrder);
        
        if (res.data.chefLocation && res.data.chefLocation.length === 2) {
          setChefPos(res.data.chefLocation);
        }
        if (currentOrder.deliveryLocation && currentOrder.deliveryLocation.length === 2) {
          setUserPos(currentOrder.deliveryLocation);
        }

        if (currentOrder.status === "pending") setProgress(10);
        else if (currentOrder.status === "accepted") setProgress(30);
        else if (currentOrder.status === "delivery_accepted") setProgress(40);
        else if (currentOrder.status === "completed") setProgress(100);
        else if (currentOrder.status === "out_for_delivery") {
          setProgress(prev => Math.max(prev, 40));
        }

      } catch (err) {
        console.error("Error fetching order status", err);
      }
    };
    
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [orderId, user.token]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${chefPos[1]},${chefPos[0]};${userPos[1]},${userPos[0]}?geometries=geojson`;
        const res = await axios.get(url);
        if (res.data && res.data.routes && res.data.routes.length > 0) {
          const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePath(coords);
        }
      } catch (err) {
        console.error("Error fetching route", err);
      }
    };
    if (chefPos && userPos) {
      fetchRoute();
    }
  }, [chefPos, userPos]);

  useEffect(() => {
    if (order?.status === "out_for_delivery") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            axios.put(
              `http://localhost:3000/api/order-status/${orderId}`,
              { status: "completed" },
              { headers: { Authorization: user.token } }
            ).then(() => {
              setOrder(o => ({...o, status: "completed"}));
            }).catch(e => console.error(e));
            return 100; 
          }
          return prev + 0.5; 
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [order?.status, orderId, user.token]);

  let deliveryPos = chefPos;
  if (routePath.length > 0 && progress > 40) {
    const fraction = Math.min((progress - 40) / 60, 1);
    const exactIndex = fraction * (routePath.length - 1);
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.ceil(exactIndex);
    
    if (lowerIndex === upperIndex) {
      deliveryPos = routePath[lowerIndex];
    } else {
      const remainder = exactIndex - lowerIndex;
      const p1 = routePath[lowerIndex];
      const p2 = routePath[upperIndex];
      deliveryPos = [
        p1[0] + (p2[0] - p1[0]) * remainder,
        p1[1] + (p2[1] - p1[1]) * remainder
      ];
    }
  } else if (progress > 40) {
    const fraction = Math.min((progress - 40) / 60, 1);
    deliveryPos = [
      chefPos[0] + (userPos[0] - chefPos[0]) * fraction,
      chefPos[1] + (userPos[1] - chefPos[1]) * fraction
    ];
  }

  const steps = [
    { id: 'placed', label: 'Order Confirmed', desc: 'Received at kitchen', icon: PackageOpen, min: 0 },
    { id: 'preparing', label: 'Cooking', desc: 'Chef is preparing', icon: ChefHat, min: 30 },
    { id: 'assigned', label: 'Partner Ready', desc: 'Assigned for delivery', icon: CheckCircle2, min: 40 },
    { id: 'shipping', label: 'On the Way', desc: 'Out for delivery', icon: Bike, min: 41 },
    { id: 'delivered', label: 'Delivered', desc: 'Enjoy your meal', icon: Zap, min: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#fffcfb] flex flex-col selection:bg-primary/20">
      <Navbar />

      <style>{`
        .smooth-marker { transition: transform 0.15s linear; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Tracking Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[450px] flex flex-col gap-8"
        >
          <div className="glass-card rounded-[3.5rem] p-10 border border-white shadow-2xl shadow-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Navigation className="w-40 h-40" />
            </div>

            <div className="relative z-10">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> Live Journey
              </h2>
              
              <div className="space-y-10 relative">
                {/* Connector Line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>
                <div 
                  className="absolute left-[23px] top-4 w-1 bg-primary rounded-full transition-all duration-1000"
                  style={{ height: `${progress}%` }}
                ></div>

                {steps.map((step, i) => (
                  <div key={i} className="flex gap-8 relative group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl z-10 ${progress >= step.min ? 'bg-slate-900 text-white' : 'bg-white text-slate-300 ring-1 ring-slate-100'}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-black uppercase tracking-widest ${progress >= step.min ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</h3>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${progress >= step.min ? 'text-primary' : 'text-slate-300'}`}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[3.5rem] p-10 border border-white shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Logistics Intelligence</h3>
            <div className="space-y-8">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100">
                    <Bike className="w-6 h-6 text-slate-400" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilot</p>
                    <p className="text-sm font-black text-slate-800">{order?.deliveryPartnerName || "Assigning..."}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100">
                    <MapPin className="w-6 h-6 text-slate-400" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop-off Destination</p>
                    <p className="text-sm font-black text-slate-800 line-clamp-1">{user?.location || "Primary Address"}</p>
                 </div>
               </div>
            </div>

            {progress === 100 && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate("/customer/profile")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-3xl transition-all mt-10 text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-slate-900/20"
              >
                Return to Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Map Display */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 glass-card rounded-[4rem] border-4 border-white shadow-4xl overflow-hidden min-h-[600px] relative z-0"
        >
          {chefPos && userPos && (
            <MapContainer 
              center={[(chefPos[0] + userPos[0])/2, (chefPos[1] + userPos[1])/2]} 
              zoom={13} 
              className="w-full h-full"
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {routePath.length > 0 ? (
                <Polyline positions={routePath} color="#f97316" weight={6} opacity={0.8} lineJoin="round" />
              ) : (
                <Polyline positions={[chefPos, userPos]} color="#94a3b8" dashArray="10, 15" weight={3} />
              )}
              
              <Marker position={chefPos} icon={chefIcon}>
                <Popup><span className="font-black text-xs">Origin Kitchen</span></Popup>
              </Marker>

              <Marker position={userPos} icon={userIcon}>
                <Popup><span className="font-black text-xs">Destination Point</span></Popup>
              </Marker>

              {progress > 40 && progress < 100 && (
                <Marker position={deliveryPos} icon={deliveryIcon}>
                  <Popup><span className="font-black text-xs">Live Pilot Tracking</span></Popup>
                </Marker>
              )}
            </MapContainer>
          )}

          <div className="absolute top-10 left-10 z-[10] flex flex-col gap-4">
             <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-2xl flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Telemetry Active</span>
             </div>
             
             {order?.status === "out_for_delivery" && (
                <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">ETA: ~12 Minutes</span>
                </div>
             )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
