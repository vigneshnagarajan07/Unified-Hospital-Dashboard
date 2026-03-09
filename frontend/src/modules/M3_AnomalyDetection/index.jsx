import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import AnomalyAlert from './AnomalyAlert';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export default function M3_AnomalyDetection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await api.getAnomalies();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
    const intv = setInterval(fetchAnomalies, 30000);
    return () => clearInterval(intv);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Scanning for anomalies...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load anomalies. API might be down.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Anomaly Detection</h2>
          <p className="text-slate-500 text-sm mt-1">Rule-based deviations from hospital baselines</p>
        </div>
        
        <div className="flex gap-3">
          <Badge icon={AlertTriangle} count={data.summary.critical} label="Critical" color="red" />
          <Badge icon={AlertCircle} count={data.summary.warning} label="Warning" color="amber" />
          <Badge icon={Info} count={data.summary.info} label="Info" color="sky" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {data.anomalies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700">All Systems Normal</h3>
            <p>No operational anomalies detected at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.anomalies.map((anom, idx) => (
              <AnomalyAlert key={anom.id} anomaly={anom} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, count, label, color }) {
  const colorMap = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-sm ${colorMap[color]}`}>
      <Icon size={16} />
      <span className="font-bold">{count}</span>
      <span className="text-xs uppercase tracking-wider font-semibold opacity-80 hidden sm:inline">{label}</span>
    </div>
  );
}
