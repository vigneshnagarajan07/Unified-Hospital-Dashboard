import React from 'react';
import { Check, User, Target } from 'lucide-react';

export default function RecommendationItem({ rec, index, onDismiss }) {
  const getUrgencyBadge = () => {
    switch(rec.urgency) {
      case 'immediate': return <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">Immediate</span>;
      case 'today': return <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">Today</span>;
      case 'this_week': return <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-700">This Week</span>;
      default: return null;
    }
  };

  return (
    <div className={`p-5 hover:bg-slate-50 transition-colors animate-fade-in stagger-${(index % 6) + 1} flex items-start justify-between gap-4 group`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {getUrgencyBadge()}
          <span className="text-slate-400 text-sm font-medium flex items-center gap-1">📍 {rec.department}</span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{rec.title}</h3>
        <p className="text-slate-600 mb-3 text-sm">{rec.description}</p>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            <User size={14} /> {rec.owner}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Target size={14} className="text-primary" /> Impact Score: <span className="text-slate-700">{rec.impact_score}/10</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onDismiss}
        className="mt-2 shrink-0 flex items-center justify-center p-2 rounded-full md:px-4 md:py-2 md:rounded-lg border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
        title="Mark as Done"
      >
        <Check size={18} className="md:mr-2" />
        <span className="hidden md:inline font-bold text-sm">Done</span>
      </button>
    </div>
  );
}
