import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Banknote, Target } from 'lucide-react';

export default function CEOView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getRoleView('ceo').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="text-center py-8 animate-pulse text-slate-400">Loading Executive Summary...</div>;

  const chartData = data.trends.revenue.map((val, i) => ({ day: `Day ${i + 1}`, revenue: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">CH</div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Dr. Chief Executive</h3>
          <p className="text-slate-500 text-sm">PrimeCare Hospital Network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 shadow-sm">
          <div className="text-emerald-700 font-semibold mb-1 flex items-center gap-2"><Banknote size={16} /> Revenue (Today)</div>
          <div className="text-3xl font-black text-emerald-800 tracking-tight">{data.revenue.today}</div>
          <div className="text-emerald-600 text-sm mt-1">MTD: {data.revenue.mtd}</div>
        </div>
        <div className="bg-sky-50 rounded-xl border border-sky-100 p-5 shadow-sm">
          <div className="text-sky-700 font-semibold mb-1 flex items-center gap-2"><TrendingUp size={16} /> Cost Per Patient</div>
          <div className="text-3xl font-black text-sky-800 tracking-tight">{data.revenue.cost_per_patient}</div>
          <div className="text-sky-600 text-sm mt-1">Trending below target</div>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 shadow-sm">
          <div className="text-indigo-700 font-semibold mb-1 flex items-center gap-2"><Target size={16} /> Strategic Alignment</div>
          <div className="text-3xl font-black text-indigo-800 tracking-tight">On Track</div>
          <div className="text-indigo-600 text-sm mt-1">NABH Audit readiness 100%</div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-bold text-slate-700 mb-4">7-Day Revenue Trend (₹ Lakhs)</h4>
        <div className="h-64 w-full bg-slate-50 rounded-xl border border-slate-100 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
