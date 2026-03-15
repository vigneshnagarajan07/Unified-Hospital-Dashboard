import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import ForecastChart from './ForecastChart';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function M7_Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await api.getForecast();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Running Simulation...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load forecast data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-teal-500" />
            48-Hour Predictive Forecast
          </h2>
          <p className="text-slate-500 text-sm mt-1">Rule-based simulation of expected hospital load</p>
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-red-800 font-bold">
            <AlertTriangle size={18} />
            Predicted Critical Threshold Breaches
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside ml-2">
            {data.alerts.map((time, idx) => (
              <li key={idx}>Capacity/Wait Time breach expected at <strong>{time}</strong></li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Predicted Hospital Occupancy vs Wait Times</h3>
        <div className="h-96 w-full">
          <ForecastChart data={data.forecast} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.forecast.slice(0, 3).map((f, idx) => (
          <div key={idx} className={`p-5 rounded-xl border shadow-sm ${f.threshold_breach ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="text-sm font-bold text-slate-500 mb-3">{f.interval} (+{(idx+1)*6}hrs)</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Occupancy</span>
                <strong className={f.predicted_occupancy > 90 ? 'text-red-600' : 'text-slate-800'}>{f.predicted_occupancy}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Wait</span>
                <strong className={f.predicted_wait > 40 ? 'text-red-600' : 'text-slate-800'}>{f.predicted_wait}m</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">New OPD Volume</span>
                <strong className="text-slate-800">~{f.predicted_volume}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
