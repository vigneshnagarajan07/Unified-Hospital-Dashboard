import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import TrendChart from './TrendChart';

export default function KPICard({ kpi, index }) {
  const getStatusColors = () => {
    switch(kpi.status) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-700';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'good': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      default: return 'border-slate-200 bg-white text-slate-700';
    }
  };

  const statusColors = getStatusColors();

  return (
    <div className={`rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden bg-white animate-fade-in stagger-${(index % 6) + 1} ${kpi.status === 'critical' ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-slate-600">{kpi.name}</h3>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColors} uppercase tracking-wider`}>
            {kpi.status}
          </span>
        </div>
        
        <div className="flex items-end gap-3 mb-1">
          <div className="text-4xl font-black text-slate-800 tracking-tight">
            {kpi.value}<span className="text-xl text-slate-400 font-medium ml-1">{kpi.unit}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Baseline: {kpi.baseline}</span>
          <span className="text-slate-300">|</span>
          <span className={`font-semibold flex items-center ${kpi.delta > 0 && kpi.status === 'critical' ? 'text-red-600' : kpi.delta < 0 && kpi.status === 'critical' ? 'text-red-600' : 'text-slate-600'}`}>
            {kpi.trend_direction === 'up' ? <ArrowUpRight size={16} /> : kpi.trend_direction === 'down' ? <ArrowDownRight size={16} /> : <Minus size={16} />}
            {Math.abs(kpi.delta)}% {kpi.delta > 0 ? 'vs base' : 'vs base'}
          </span>
        </div>
      </div>
      
      <div className="h-20 w-full mt-2">
        <TrendChart data={kpi.sparkline} color={kpi.status === 'critical' ? '#ef4444' : kpi.status === 'warning' ? '#f59e0b' : '#10b981'} />
      </div>
    </div>
  );
}
