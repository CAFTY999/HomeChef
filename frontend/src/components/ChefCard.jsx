import { Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChefCard({ chefId, chefName, rating, location, cuisine }) {
  const navigate = useNavigate();
  // Generate a random avatar based on name
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${chefName}`;

  return (
    <div 
      onClick={() => {
        let category = "daily";
        if (cuisine === "Daily Meals") category = "daily";
        else if (cuisine === "Ready-made") category = "ready";
        else if (cuisine === "Subscription Plans") category = "subscription";
        
        navigate(`/customer/chef/${chefId}`, { state: { category } });
      }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex flex-col items-center text-center"
    >
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
          <img src={avatarUrl} alt={chefName} className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-2 right-0 bg-white rounded-full px-2 py-1 shadow border border-slate-100 flex items-center">
          <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
          <span className="text-xs font-bold text-slate-700">{rating > 0 ? rating.toFixed(1) : "New"}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-2 hover-expand cursor-pointer" title={chefName}>{chefName}</h3>
      {cuisine && <p className="text-sm text-slate-500 mb-3">{cuisine}</p>}
      
      <div className="flex items-center text-slate-500 text-sm mt-auto bg-slate-50 px-3 py-1.5 rounded-full">
        <MapPin className="h-3.5 w-3.5 mr-1" />
        <span className="truncate max-w-[120px]" title={location}>{location || "Local Chef"}</span>
      </div>
    </div>
  );
}
