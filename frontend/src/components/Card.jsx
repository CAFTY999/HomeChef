export default function Card({ title, desc, onClick }) {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" 
      onClick={onClick}
    >
      <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{title}</h2>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  );
}