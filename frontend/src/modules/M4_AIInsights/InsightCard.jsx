import React from 'react';
import { Lightbulb, Activity, Users, DollarSign, Settings } from 'lucide-react';

export default function InsightCard({ insight, index }) {
  const getPriorityColor = () => {
    switch (insight.priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = () => {
    switch (insight.category.toLowerCase()) {
      case 'clinical': return <Activity size={14} className="text-rose-500" />;
      case 'staffing': return <Users size={14} className="text-blue-500" />;
      case 'financial': return <DollarSign size={14} className="text-emerald-500" />;
      case 'operational': return <Settings size={14} className="text-slate-500" />;
      default: return <Lightbulb size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between animate-fade-in stagger-${(index % 6) + 1}`}>
      <div>
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
            {getCategoryIcon()}
            {insight.category.toUpperCase()}
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getPriorityColor()}`}>
            {insight.priority}
          </div>
        </div>

        <h3 className="text-slate-800 font-medium mb-4 leading-snug">
          {insight.insight}
        </h3>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Recommended Action</p>
        <div className="bg-purple-50 text-purple-900 text-sm p-3 rounded-lg border border-purple-100 leading-relaxed shadow-sm">
          {insight.recommended_action}
        </div>
      </div>
      
      <div className="mt-4 text-xs font-semibold text-slate-400 text-right">
        📍 {insight.department}
      </div>
    </div>
  );
}
