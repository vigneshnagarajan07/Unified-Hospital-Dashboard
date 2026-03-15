import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import KPICard from './KPICard';

export default function M2_KPIEngine() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.getKPIs();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
    const intv = setInterval(fetchKPIs, 30000);
    return () => clearInterval(intv);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Computing KPIs...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load KPIs. API might be down.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hospital KPIs & Trends</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time metrics vs 7-day baselines</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Score</div>
            <div className="text-2xl font-black text-slate-800">{data.health_score}<span className="text-lg text-slate-400">/100</span></div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative shadow-inner">
            <svg viewBox="0 0 36 36" className="absolute top-0 left-0 w-full h-full -rotate-90">
              <path
                className={`${data.health_score > 80 ? 'text-emerald-500' : data.health_score > 60 ? 'text-amber-500' : 'text-red-500'}`}
                strokeDasharray={`${data.health_score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.kpis.map((kpi, idx) => (
          <KPICard key={kpi.id} kpi={kpi} index={idx} />
        ))}
      </div>
    </div>
  );
}
