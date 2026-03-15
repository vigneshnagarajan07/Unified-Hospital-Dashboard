import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { HeartPulse, Clock, AlertCircle, Activity } from 'lucide-react';

export default function CardiologyView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getRoleView('cardiology').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="text-center py-8 animate-pulse text-slate-400">Loading Dept Data...</div>;

  const { department_data: dept, surgeons_schedule } = data;
  const isWaitAnomaly = dept.opd.wait_time > dept.opd.baseline_wait_time * 1.3;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
          <HeartPulse size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Dr. Heart (HOD)</h3>
          <p className="text-slate-500 text-sm">{dept.name} Department</p>
        </div>
      </div>

      {isWaitAnomaly && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800">Critical OPD Wait Time</h4>
            <p className="text-sm text-red-700 mt-1">Current wait is {dept.opd.wait_time}m (Baseline {dept.opd.baseline_wait_time}m). {dept.opd.patients_today} patients waiting. Deploy standby staff.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-slate-700">Live Status</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Total Admissions</div>
              <div className="text-2xl font-black text-slate-800">{dept.beds.occupied}/{dept.beds.total}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">ICU Capacity</div>
              <div className="text-2xl font-black text-slate-800">{dept.icu.occupied}/{dept.icu.total}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-500 flex items-center gap-1"><Activity size={14}/> Critical Patients</div>
                <div className="text-2xl font-black text-rose-600 mt-1">{dept.critical_patients}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Satisfaction</div>
                <div className="text-xl font-bold mt-1">⭐ {dept.satisfaction}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Clock size={18}/> Surgeon Schedule</h4>
          <div className="space-y-3">
            {surgeons_schedule.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                <div>
                  <div className="font-bold text-slate-800">{s.doc}</div>
                  <div className="text-xs text-slate-500">{s.time}</div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${s.status === 'In Surgery' ? 'bg-red-100 text-red-700' : s.status === 'OPD' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
