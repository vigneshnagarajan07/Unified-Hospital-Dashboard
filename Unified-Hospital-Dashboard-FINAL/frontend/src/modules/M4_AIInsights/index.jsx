import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import InsightCard from './InsightCard';
import { Brain, RefreshCw } from 'lucide-react';

export default function M4_AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getInsights();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="text-purple-500" />
            Groq AI Insights
          </h2>
          <p className="text-slate-500 text-sm mt-1">Real-time LLM-driven synthesis of hospital operations</p>
        </div>
        
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-purple-500' : ''} />
          {loading ? 'Thinking...' : 'Regenerate Insights'}
        </button>
      </div>

      {data?.source && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full w-max mt-2">
          <div className={`w-2 h-2 rounded-full ${data.source === 'groq' ? 'bg-purple-500 animate-pulse' : 'bg-amber-500'}`}></div>
          Powered by {data.source === 'groq' ? 'Groq Llama 3' : 'Mock Data Fallback'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-16 bg-slate-100 rounded-full"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-slate-100 rounded"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                <div className="h-4 w-4/6 bg-slate-100 rounded"></div>
              </div>
              <div className="h-10 w-full bg-slate-50 rounded-lg"></div>
            </div>
          ))
        ) : !data ? (
          <div className="col-span-full p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
            Failed to connect to AI Insight Engine.
          </div>
        ) : (
          data.insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}
