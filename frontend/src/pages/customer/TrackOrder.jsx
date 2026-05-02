import Navbar from "../../components/Navbar";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { PackageOpen, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

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
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/14164/14164194.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

// A nice small scooty delivery icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/9561/9561688.png',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  className: 'smooth-marker' // Custom class for smooth transition
});

export default function TrackOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [progress, setProgress] = useState(0);
  const [routePath, setRoutePath] = useState([]);
  const [order, setOrder] = useState(null);
  
  const [chefPos, setChefPos] = useState([12.9716, 77.5946]); // Bangalore center default
  const [userPos, setUserPos] = useState([12.9352, 77.6245]); // default

  // Polling order status
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

        // Update progress based on status
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

  // Fetch real road route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${chefPos[1]},${chefPos[0]};${userPos[1]},${userPos[0]}?geometries=geojson`;
        const res = await axios.get(url);
        if (res.data && res.data.routes && res.data.routes.length > 0) {
          // OSRM returns [lng, lat], Leaflet needs [lat, lng]
          const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePath(coords);
        }
      } catch (err) {
        console.error("Error fetching route", err);
      }
    };
    // only fetch if we have valid coordinates that changed
    if (chefPos && userPos) {
      fetchRoute();
    }
  }, [chefPos, userPos]);

  // Simulate scooty moving only when out_for_delivery
  useEffect(() => {
    if (order?.status === "out_for_delivery") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            
            // Auto mark as delivered when reaching destination
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

  // Calculate intermediate position for delivery partner along the exact route path
  let deliveryPos = chefPos;
  if (routePath.length > 0 && progress > 40) {
    const fraction = Math.min((progress - 40) / 60, 1); // 0 to 1
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
    // Fallback if no route path is available
    const fraction = Math.min((progress - 40) / 60, 1);
    deliveryPos = [
      chefPos[0] + (userPos[0] - chefPos[0]) * fraction,
      chefPos[1] + (userPos[1] - chefPos[1]) * fraction
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Global Style for smooth moving scooty */}
      <style>{`
        .smooth-marker {
          transition: transform 0.15s linear;
        }
      `}</style>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Tracking Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <PackageOpen className="w-6 h-6 mr-2 text-primary" />
              Order Status
            </h2>
            
            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              <div className="relative">
                <div className="absolute left-[-24px] bg-green-500 w-4 h-4 rounded-full border-4 border-white shadow"></div>
                <h3 className="font-bold text-slate-800">Order Placed</h3>
                <p className="text-sm text-slate-500">We have received your order</p>
              </div>
              <div className="relative">
                <div className={`absolute left-[-24px] w-4 h-4 rounded-full border-4 border-white shadow ${progress >= 30 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                <h3 className={`font-bold ${progress >= 30 ? 'text-slate-800' : 'text-slate-400'}`}>Preparing Food</h3>
                <p className="text-sm text-slate-500">Your chef is preparing the meal</p>
              </div>
              <div className="relative">
                <div className={`absolute left-[-24px] w-4 h-4 rounded-full border-4 border-white shadow ${progress >= 40 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                <h3 className={`font-bold ${progress >= 40 ? 'text-slate-800' : 'text-slate-400'}`}>Partner Assigned</h3>
                <p className="text-sm text-slate-500">Delivery partner is ready</p>
              </div>
              <div className="relative">
                <div className={`absolute left-[-24px] w-4 h-4 rounded-full border-4 border-white shadow ${progress > 40 ? 'bg-primary' : 'bg-slate-300'}`}></div>
                <h3 className={`font-bold ${progress > 40 ? 'text-slate-800' : 'text-slate-400'}`}>Out for Delivery</h3>
                <p className="text-sm text-slate-500">Delivery partner is on the way</p>
              </div>
              <div className="relative">
                <div className={`absolute left-[-24px] w-4 h-4 rounded-full border-4 border-white shadow ${progress === 100 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                <h3 className={`font-bold ${progress === 100 ? 'text-slate-800' : 'text-slate-400'}`}>Delivered</h3>
                <p className="text-sm text-slate-500">Enjoy your meal!</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Delivery Details</h3>
            {order?.deliveryPartnerName && (
              <div className="flex items-start mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <PackageOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Delivery Partner</p>
                  <p className="text-sm font-medium text-slate-800">{order.deliveryPartnerName}</p>
                </div>
              </div>
            )}
            <div className="flex items-start mb-4">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Delivery To</p>
                <p className="text-sm font-medium text-slate-800">{user?.location || "Your Location"}</p>
              </div>
            </div>
            {progress === 100 && (
              <button 
                onClick={() => navigate("/customer/profile")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 rounded-xl transition-colors mt-4"
              >
                View in My Orders
              </button>
            )}
          </div>
        </div>

        {/* Map Interface */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[500px] lg:h-auto relative z-0">
          {chefPos && userPos && (
            <MapContainer 
              center={[(chefPos[0] + userPos[0])/2, (chefPos[1] + userPos[1])/2]} 
              zoom={13} 
              className="w-full h-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Path */}
              {routePath.length > 0 ? (
                <Polyline positions={routePath} color="#3b82f6" weight={5} opacity={0.7} />
              ) : (
                <Polyline positions={[chefPos, userPos]} color="#94a3b8" dashArray="5, 10" weight={3} />
              )}
              
              {/* Chef Marker */}
              <Marker position={chefPos} icon={chefIcon}>
                <Popup>Chef's Kitchen</Popup>
              </Marker>

              {/* User Marker */}
              <Marker position={userPos} icon={userIcon}>
                <Popup>Delivery Location</Popup>
              </Marker>

              {/* Moving Delivery Partner Scooty */}
              {progress > 40 && progress < 100 && (
                <Marker position={deliveryPos} icon={deliveryIcon}>
                  <Popup>Delivery Partner</Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>

      </div>
    </div>
  );
}
