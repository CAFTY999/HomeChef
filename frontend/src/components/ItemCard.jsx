import { Plus } from "lucide-react";

export default function ItemCard({ item, onAddToCart }) {
  // Use actual isVeg from DB, fallback to true if undefined
  const isVeg = item.isVeg !== false;
  
  // Use a single default image for all items as requested
  const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-md flex items-center justify-center border bg-white shadow-sm ${isVeg ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
            <span className={`w-2 h-2 rounded-full mr-1 ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {isVeg ? 'VEG' : 'NON-VEG'}
          </span>
        </div>
        {item.totalQuantity < 5 && item.totalQuantity > 0 && (
          <div className="absolute bottom-3 left-3">
             <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">
                Only {item.totalQuantity} left
             </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-lg text-slate-800 line-clamp-1">{item.name}</h3>
          {item.type === "subscription" && item.duration && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full whitespace-nowrap">
              {item.duration}
            </span>
          )}
        </div>
        
        {item.chefName && (
          <p className="text-sm text-slate-500 mb-2 flex items-center">
            👨‍🍳 {item.chefName}
            {item.chefRating > 0 && (
              <span className="ml-2 text-yellow-500 flex items-center text-xs">
                ⭐ {item.chefRating.toFixed(1)}
              </span>
            )}
          </p>
        )}
        
        {item.description && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{item.description}</p>
        )}
        
        {/* Subscription Details (Categories & Options) */}
        {item.type === "subscription" && item.meals && item.meals.length > 0 && (
          <div className="mb-4 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Included in Plan</h4>
            {item.meals[0].categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">{cat.name}:</p>
                <div className="flex flex-wrap gap-1">
                  {cat.options.map((opt, oIdx) => (
                    <span key={oIdx} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-600 rounded-md">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Price</span>
            <span className="text-xl font-bold text-slate-800">₹{item.price}</span>
          </div>
          
          <button 
            onClick={() => onAddToCart && onAddToCart(item)}
            className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors"
            title="Add to Cart"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}