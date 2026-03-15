import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import RecommendationItem from './RecommendationItem';
import { Lightbulb, Filter } from 'lucide-react';

export default function M5_Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('All');
  const [dismissedRows, setDismissedRows] = useState(new Set());

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await api.getRecommendations();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading actions...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load recommendations.</div>;

  const handleDismiss = (id) => {
    setDismissedRows(prev => new Set([...prev, id]));
  };

  const departments = ['All', ...new Set(data.recommendations.map(r => r.department))];
  
  const activeRecs = data.recommendations.filter(r => 
    !dismissedRows.has(r.id) && 
    (filterDept === 'All' || r.department === filterDept)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Lightbulb className="text-amber-500" />
            Recommended Actions
          </h2>
          <p className="text-slate-500 text-sm mt-1">AI-generated tasks to mitigate active anomalies</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 shadow-sm">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 p-2 outline-none cursor-pointer"
          >
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeRecs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <h3 className="text-lg font-bold text-slate-700 mb-1">You're all caught up!</h3>
            <p>No pending actions required.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeRecs.map((rec, idx) => (
              <RecommendationItem key={rec.id} rec={rec} index={idx} onDismiss={() => handleDismiss(rec.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
