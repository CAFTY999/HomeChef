import { useState } from "react";
import LoginPopup from "./LoginPopup";
import SignupPopup from "./SignupPopup";
import { ChefHat, ArrowRight } from "lucide-react";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-30 z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-96 h-96 bg-orange-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-96 h-96 bg-yellow-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        <div className="flex items-center group cursor-pointer">
          <div className="w-16 h-16 bg-white rounded-full border border-slate-100 shadow-md group-hover:shadow-lg transition-all duration-300 overflow-hidden flex items-center justify-center">
            <img 
              src="/src/assets/logo.png" 
              alt="HomeChef Logo" 
              className="w-full h-full object-cover scale-[1.3] transition-transform duration-500 group-hover:scale-[1.4]" 
            />
          </div>
          <span className="ml-4 text-3xl font-black text-slate-900 tracking-tighter uppercase">HomeChef</span>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowLogin(true)}
            className="text-slate-600 hover:text-primary font-medium px-4 py-2 transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => setShowSignup(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm hover:shadow"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* HERO CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-6 border border-orange-200">
            <span className="flex h-2 w-2 bg-orange-500 rounded-full mr-2"></span>
            Now delivering in your neighborhood
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Craving real <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              homemade food?
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0">
            Connect with passionate home chefs in your area. Enjoy authentic, hygienic, and delicious meals delivered straight to your door.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button 
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center group"
              onClick={() => setShowSignup(true)}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-full font-bold text-lg border border-slate-200 transition-colors shadow-sm"
              onClick={() => setShowLogin(true)}
            >
              I already have an account
            </button>
          </div>
          
          <div className="mt-10 flex items-center justify-center lg:justify-start space-x-6 text-sm font-medium text-slate-500">
             <div className="flex items-center">
               <span className="text-xl mr-2">✅</span> 100% Hygienic
             </div>
             <div className="flex items-center">
               <span className="text-xl mr-2">🍲</span> Authentic Recipes
             </div>
             <div className="flex items-center">
               <span className="text-xl mr-2">🚀</span> Fast Delivery
             </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-300/20 rounded-full filter blur-3xl transform scale-110"></div>
          <div className="relative z-10">
            <img 
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" 
              alt="Delicious homemade food" 
              className="w-full h-auto rounded-[3rem] shadow-2xl border-8 border-white/50 object-cover aspect-[4/3] rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </main>

      {/* POPUPS */}
      {showLogin && (
        <LoginPopup
          setShowLogin={setShowLogin}
          openSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {showSignup && (
        <SignupPopup
          setShowSignup={setShowSignup}
          openLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}