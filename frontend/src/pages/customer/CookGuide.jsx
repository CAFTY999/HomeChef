import { useState } from "react";
import { ChefHat, Search, Utensils, Loader2, Sparkles, BookOpen, Clock, Plus } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

export default function CookGuide() {
  const { user } = useAuth();
  const [dish, setDish] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null); // stores the structured JSON
  const [rawResponse, setRawResponse] = useState(""); // fallback
  const [mode, setMode] = useState("dish");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const formatText = (text) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    // Handle time objects: { totalTimeInMinutes: 20 } or { time: '20m' }
    if (text.totalTimeInMinutes) return `${text.totalTimeInMinutes} mins`;
    if (text.time && typeof text.time === 'string') return text.time;
    return JSON.stringify(text, null, 2);
  };

  const formatRecipe = (recipe) => {
    if (!recipe) return "Recipe details not available. Try another dish!";
    
    // Case 1: Simple string
    if (typeof recipe === 'string') return recipe;
    
    // Case 2: Object with a 'steps' array
    if (recipe.steps && Array.isArray(recipe.steps)) {
      return recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
    }
    
    // Case 3: Simple array
    if (Array.isArray(recipe)) {
      return recipe.map((step, i) => `${i + 1}. ${step}`).join('\n');
    }
    
    // Case 4: Object with step1, step2, etc. or just an object of strings
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

        // If backend already parsed it
        if (data.name || data.recommendations || data.instructions || data.recipe) {
          structuredData = data;
        } 
        // Last resort: if backend failed but returned a response string that looks like JSON
        else if (data.response && typeof data.response === 'string') {
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
          // If searching for a dish and we got instructions/recipe, show it immediately
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
    const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80&sig=${item.name}`;
    
    return (
      <div key={item.name} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 group ${isMain ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <div className="relative h-40 overflow-hidden">
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center bg-white shadow-sm border ${item.isVeg ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
              {item.isVeg ? 'VEG' : 'NON-VEG'}
            </span>
          </div>
          {item.time && (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {formatText(item.time)}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              item.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : 
              item.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
            }`}>
              {item.difficulty}
            </span>
            {item.instructions && (
              <button 
                onClick={() => setSelectedRecipe(item)}
                className="text-primary text-xs font-bold hover:underline"
              >
                View Guide
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">AI Cooking Guide</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get instant food recommendations and recipes in a snap.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100 p-6 sticky top-24">
              <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
                <button
                  onClick={() => { setMode("dish"); setAiData(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mode === "dish" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Find Recipe
                </button>
                <button
                  onClick={() => { setMode("ingredients"); setAiData(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mode === "ingredients" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  By Ingredients
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "dish" ? (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 ml-1">Search Dish</label>
                    <input
                      type="text"
                      value={dish}
                      onChange={(e) => setDish(e.target.value)}
                      placeholder="e.g. Biryani, Pasta..."
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-sm text-slate-800"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 ml-1">Your Ingredients</label>
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="Rice, Chicken, Onion..."
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-sm text-slate-800 min-h-[100px] resize-none"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? 'Thinking...' : 'Search AI'}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white h-64 rounded-2xl border border-slate-100"></div>
                ))}
              </div>
            )}

            {!loading && aiData && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Search Result if searching for a dish */}
                {aiData.name && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-primary" /> Result Found
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {renderFoodBox(aiData, true)}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {(aiData.recommendations || aiData.relatedSuggestions) && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-primary" /> 
                      {mode === "dish" ? "Related Suggestions" : "Recommended for You"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(aiData.recommendations || aiData.relatedSuggestions).map(item => renderFoodBox(item))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && rawResponse && (
              <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl overflow-auto leading-relaxed shadow-2xl">
                <pre className="whitespace-pre-wrap font-sans text-sm">{formatText(rawResponse)}</pre>
              </div>
            )}

            {!loading && !aiData && !rawResponse && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <ChefHat className="h-20 w-20 mb-4 opacity-20" />
                <p className="font-medium text-lg">Your recipes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{selectedRecipe.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Plus className="h-6 w-6 rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8 bg-slate-50/50 space-y-8">
              <div className="flex gap-4">
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Time</span>
                  <span className="text-sm font-bold text-slate-700">{formatText(selectedRecipe.time) || '30m'}</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Difficulty</span>
                  <span className="text-sm font-bold text-slate-700">{selectedRecipe.difficulty || 'Easy'}</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Type</span>
                  <span className={`text-sm font-bold ${selectedRecipe.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedRecipe.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>
              </div>

              {/* Ingredients Section */}
              {selectedRecipe.ingredients && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" /> Ingredients You'll Need
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.isArray(selectedRecipe.ingredients) ? (
                      selectedRecipe.ingredients.map((ing, i) => {
                        // Handle object format: { name, measurement }
                        if (typeof ing === 'object' && ing !== null) {
                          const display = `${ing.measurement || ''} ${ing.name || ing.item || ''}`.trim();
                          return (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                              {display || JSON.stringify(ing)}
                            </li>
                          );
                        }
                        // Handle string format
                        return (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                            {ing}
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-sm text-slate-600">{formatText(selectedRecipe.ingredients)}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Instructions Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Step-by-Step Guide
                </h3>
                <div className="space-y-4">
                  {selectedRecipe.instructions ? (
                    Array.isArray(selectedRecipe.instructions) ? (
                      selectedRecipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-600 leading-relaxed">{step}</p>
                        </div>
                      ))
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed text-sm">
                        {formatRecipe(selectedRecipe.instructions)}
                      </pre>
                    )
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed text-sm">
                      {formatRecipe(selectedRecipe.recipe)}
                    </pre>
                  )}
                </div>
              </div>

              {/* Tips Section */}
              {selectedRecipe.tips && (
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                  <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Chef's Secret Tips
                  </h3>
                  <ul className="space-y-2">
                    {Array.isArray(selectedRecipe.tips) ? (
                      selectedRecipe.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-orange-700 italic">
                           " {tip} "
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-orange-700 italic">" {selectedRecipe.tips} "</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
