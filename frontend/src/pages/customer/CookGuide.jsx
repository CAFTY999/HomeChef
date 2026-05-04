import { useState } from "react";
import { ChefHat, Search, Utensils, Loader2, Sparkles, BookOpen, Clock, Plus, ArrowLeft, ArrowRight, Zap, Info } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CookGuide() {
  const { user } = useAuth();
  const [dish, setDish] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [rawResponse, setRawResponse] = useState("");
  const [mode, setMode] = useState("dish");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const formatText = (text) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    if (text.totalTimeInMinutes) return `${text.totalTimeInMinutes} mins`;
    if (text.time && typeof text.time === 'string') return text.time;
    return JSON.stringify(text, null, 2);
  };

  const formatRecipe = (recipe) => {
    if (!recipe) return "Recipe details not available. Try another dish!";
    if (typeof recipe === 'string') return recipe;
    if (recipe.steps && Array.isArray(recipe.steps)) {
      return recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
    }
    if (Array.isArray(recipe)) {
      return recipe.map((step, i) => `${i + 1}. ${step}`).join('\n');
    }
    if (typeof recipe === 'object' && recipe !== null) {
      const values = Object.values(recipe);
      if (values.every(v => typeof v === 'string')) {
        return values.map((step, i) => `${i + 1}. ${step}`).join('\n');
      }
    }
    return JSON.stringify(recipe, null, 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiData(null);
    setRawResponse("");
    setSelectedRecipe(null);

    try {
      const res = await fetch("http://localhost:3000/api/cook-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.token,
        },
        body: JSON.stringify(mode === "dish" ? { dish } : { ingredients }),
      });

      const data = await res.json();
      if (res.ok) {
        let structuredData = null;
        if (data.name || data.recommendations || data.instructions || data.recipe) {
          structuredData = data;
        } else if (data.response && typeof data.response === 'string') {
          try {
            const start = data.response.indexOf('{');
            const end = data.response.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
              const cleaned = data.response.substring(start, end + 1);
              structuredData = JSON.parse(cleaned);
            }
          } catch (e) {
            console.error("Frontend parsing failed", e);
          }
        }

        if (structuredData) {
          setAiData(structuredData);
          if (mode === "dish" && (structuredData.instructions || structuredData.recipe || structuredData.name)) {
            setSelectedRecipe(structuredData);
          }
        } else {
          setRawResponse(data.response);
        }
      } else {
        setRawResponse("Error: " + data.msg);
      }
    } catch (err) {
      setRawResponse("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const renderFoodBox = (item, isMain = false) => {
    const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&sig=${item.name}`;
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -10 }}
        key={item.name} 
        className={`glass-card rounded-[2.5rem] overflow-hidden group border border-white/40 ${isMain ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#fffcfb]' : ''}`}
      >
        <div className="relative h-56 overflow-hidden">
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-xl flex items-center bg-white shadow-xl ${item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
             <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center text-[10px] font-black text-white uppercase tracking-widest">
                <Clock className="w-3 h-3 mr-1.5 text-primary" /> {formatText(item.time)}
             </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-black text-2xl text-slate-900 leading-none tracking-tight line-clamp-1">{item.name}</h3>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
              item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {item.difficulty}
            </span>
          </div>
          
          <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{item.description}</p>
          
          <button 
            onClick={() => setSelectedRecipe(item)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group/btn active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            Explore Recipe <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fffcfb] selection:bg-primary/20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-6">
            <Zap className="w-4 h-4 fill-primary" /> Intelligence Core
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-6">Culinary <span className="text-primary italic">Intelligence</span></h1>
          <p className="text-slate-500 font-medium text-xl max-w-2xl mx-auto leading-relaxed">
            Your personal AI-powered chef assistant. Discover recipes, organize ingredients, and master home cooking in seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Controls Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            <div className="glass-card rounded-[3.5rem] p-10 border border-white/60 sticky top-32 shadow-2xl shadow-primary/5">
              <div className="flex bg-slate-100 p-2 rounded-[2rem] mb-10 border border-slate-200/50">
                <button
                  onClick={() => { setMode("dish"); setAiData(null); }}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === "dish" ? "bg-white text-primary shadow-lg shadow-primary/5 ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Find Guide
                </button>
                <button
                  onClick={() => { setMode("ingredients"); setAiData(null); }}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === "ingredients" ? "bg-white text-primary shadow-lg shadow-primary/5 ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Mix Ingredients
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {mode === "dish" ? (
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 ml-2">What's on your mind?</label>
                    <div className="relative group">
                      <ChefHat className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        placeholder="e.g. Hyderabadi Biryani"
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-sm font-bold text-slate-800 shadow-inner"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 ml-2">Available Ingredients</label>
                    <div className="relative group">
                      <Utensils className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <textarea
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="Rice, Chicken, Cardamom..."
                        className="w-full pl-16 pr-6 py-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-sm font-bold text-slate-800 min-h-[160px] resize-none shadow-inner"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-3xl shadow-2xl shadow-slate-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 fill-primary text-primary" />
                  )}
                  {loading ? 'Synthesizing...' : 'Initialize AI Search'}
                </button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Info className="w-3 h-3 text-primary" /> Neural engine active
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results Display */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-10"
                >
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card h-96 rounded-[2.5rem] animate-pulse border border-white/60"></div>
                  ))}
                </motion.div>
              ) : aiData ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-16"
                >
                  {aiData.name && (
                    <div>
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Primary Match
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        {renderFoodBox(aiData, true)}
                      </div>
                    </div>
                  )}

                  {(aiData.recommendations || aiData.relatedSuggestions) && (
                    <div>
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                        <Utensils className="h-4 w-4 text-primary" /> {mode === "dish" ? "Gastronomic Variants" : "Discovery Engine"}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        {(aiData.recommendations || aiData.relatedSuggestions).map(item => renderFoodBox(item))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : rawResponse ? (
                <motion.div 
                  key="raw"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 text-slate-100 p-12 rounded-[3.5rem] overflow-auto leading-relaxed shadow-4xl relative"
                >
                   <div className="absolute top-8 left-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Raw Processing</div>
                   <pre className="whitespace-pre-wrap font-sans text-sm mt-8 opacity-80">{formatText(rawResponse)}</pre>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-200 py-32 border-2 border-dashed border-slate-100 rounded-[4rem]"
                >
                  <ChefHat className="h-32 w-32 mb-8 opacity-10" />
                  <p className="font-black text-xl uppercase tracking-widest opacity-30">Waiting for intelligence input</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Recipe Deep-Dive Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="bg-white rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-4xl flex flex-col relative z-10"
            >
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-primary/20">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedRecipe.name}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gourmet Instruction Module</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="p-4 hover:bg-slate-50 rounded-3xl transition-all group"
                >
                  <X className="h-6 w-6 text-slate-400 group-hover:text-slate-900" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-12 bg-white space-y-12 no-scrollbar">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Time', value: formatText(selectedRecipe.time) || '30m', icon: Clock },
                    { label: 'Difficulty', value: selectedRecipe.difficulty || 'Easy', icon: Utensils },
                    { label: 'Type', value: selectedRecipe.isVeg ? 'Veg' : 'Non-Veg', color: selectedRecipe.isVeg ? 'text-green-600' : 'text-rose-600', icon: Info }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 p-6 rounded-[2rem] flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                      <stat.icon className={`h-5 w-5 mb-3 ${stat.color || 'text-slate-400'}`} />
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</span>
                      <span className={`text-sm font-black ${stat.color || 'text-slate-900'}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Ingredients Section */}
                {selectedRecipe.ingredients && (
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Culinary Requisites
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.isArray(selectedRecipe.ingredients) ? (
                        selectedRecipe.ingredients.map((ing, i) => {
                          const display = typeof ing === 'object' ? `${ing.measurement || ''} ${ing.name || ing.item || ''}`.trim() : ing;
                          return (
                            <div key={i} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all group">
                              <div className="w-2 h-2 bg-primary/20 rounded-full group-hover:scale-150 transition-transform" />
                              <span className="text-sm font-bold text-slate-700">{display}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm font-bold text-slate-600 p-4 bg-slate-50 rounded-2xl">{formatText(selectedRecipe.ingredients)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Guide Section */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Execution Protocol
                  </h3>
                  <div className="space-y-6">
                    {(selectedRecipe.instructions || selectedRecipe.recipe) ? (
                      (Array.isArray(selectedRecipe.instructions || selectedRecipe.recipe) ? (selectedRecipe.instructions || selectedRecipe.recipe) : [formatRecipe(selectedRecipe.instructions || selectedRecipe.recipe)]).map((step, i) => (
                        <div key={i} className="flex gap-8 group">
                          <div className="flex-shrink-0 w-12 h-12 rounded-[1.2rem] bg-slate-900 text-white text-sm font-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-900/10">
                            {i + 1}
                          </div>
                          <p className="text-md font-medium text-slate-700 leading-relaxed pt-2">{step}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-600">Protocol not specified.</p>
                    )}
                  </div>
                </div>

                {/* Chef Tips */}
                {selectedRecipe.tips && (
                  <div className="bg-primary/5 p-10 rounded-[3rem] border border-primary/10 relative overflow-hidden">
                    <Sparkles className="absolute -top-6 -right-6 w-32 h-32 text-primary/5" />
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary fill-primary" /> Master's Insight
                    </h3>
                    <ul className="space-y-4">
                      {(Array.isArray(selectedRecipe.tips) ? selectedRecipe.tips : [selectedRecipe.tips]).map((tip, i) => (
                        <li key={i} className="text-sm font-bold text-slate-700 italic flex gap-3">
                           <span className="text-primary font-black">“</span>
                           {tip}
                           <span className="text-primary font-black">”</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
