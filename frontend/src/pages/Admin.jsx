import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Users, Activity, Settings } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/profile", {
          headers: { Authorization: user?.token }
        });
        setProfile(res.data);
        console.log("Admin Profile:", res.data);
      } catch (err) {
        console.log(err);
      }
    };
    if (user?.token) {
      fetchProfile();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Welcome, Super Admin {user?.name} 🛠️</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="bg-blue-100 p-4 rounded-full mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-800">1,248</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="bg-green-100 p-4 rounded-full mr-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Orders</p>
              <h3 className="text-2xl font-bold text-slate-800">86</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="bg-purple-100 p-4 rounded-full mr-4">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">System Status</p>
              <h3 className="text-2xl font-bold text-green-600">Healthy</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center border-dashed">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Platform Administration</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            You have full access to manage users, chefs, and platform settings. Detailed administrative tools will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}