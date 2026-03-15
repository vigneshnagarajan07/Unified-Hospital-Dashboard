import React from 'react';
import { AlertOctagon, AlertTriangle, Info, Clock } from 'lucide-react';

export default function AnomalyAlert({ anomaly, index }) {
  const isCritical = anomaly.severity === 'critical';
  const isWarning = anomaly.severity === 'warning';
  
  const Icon = isCritical ? AlertOctagon : isWarning ? AlertTriangle : Info;
  
  const iconColor = isCritical ? 'text-red-500 bg-red-50' : isWarning ? 'text-amber-500 bg-amber-50' : 'text-sky-500 bg-sky-50';
  const timeStr = new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`p-5 flex flex-col sm:flex-row gap-4 hover:bg-slate-50 transition-colors animate-fade-in stagger-${(index % 6) + 1}`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${iconColor}`}>
        <Icon size={24} />
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">{anomaly.department}</span>
            <span className="text-slate-400 text-sm flex items-center gap-1"><Clock size={12}/> {timeStr}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${isCritical ? 'bg-red-100 text-red-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
            {anomaly.severity}
          </span>
        </div>
        
        <h4 className="text-lg font-bold text-slate-900 mb-1">{anomaly.metric} Anomaly</h4>
        <p className="text-slate-600 mb-3">{anomaly.description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm bg-white border border-slate-100 rounded-lg p-3 w-max shadow-sm">
          <div>
            <span className="text-slate-400">Current: </span>
            <strong className={isCritical ? 'text-red-600' : 'text-slate-700'}>{anomaly.current_value}</strong>
          </div>
          <div className="w-px bg-slate-200"></div>
          <div>
            <span className="text-slate-400">Baseline: </span>
            <strong className="text-slate-700">{anomaly.baseline}</strong>
          </div>
          <div className="w-px bg-slate-200"></div>
          <div>
            <span className="text-slate-400">Deviation: </span>
            <strong className={anomaly.deviation_percent > 0 ? (isCritical ? 'text-red-600' : 'text-amber-600') : 'text-emerald-600'}>
              +{anomaly.deviation_percent}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
