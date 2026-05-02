import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Chef() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Chef Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user?.name || "Chef"}! Manage your kitchen here.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            title="Daily Food"
            desc="Manage daily dishes and set availability"
            onClick={() => navigate("/chef/daily")}
          />

          <Card
            title="Subscription"
            desc="Manage your long-term meal plans"
            onClick={() => navigate("/chef/subscription")}
          />

          <Card
            title="Ready-made"
            desc="Manage your snacks, pickles, & delicacies"
            onClick={() => navigate("/chef/ready")}
          />
          
          <div
            className="bg-primary text-white rounded-2xl shadow-sm shadow-primary/20 p-6 cursor-pointer hover:bg-primary-dark transition-all flex flex-col justify-center"
            onClick={() => navigate("/chef/orders")}
          >
            <h2 className="text-xl font-bold mb-2 flex items-center">
              Orders
              <span className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">Live</span>
            </h2>
            <p className="text-white/80 text-sm">View and manage incoming customer orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}