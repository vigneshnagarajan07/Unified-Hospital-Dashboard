import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ShieldAlert, LogOut, BedDouble } from 'lucide-react';

export default function FloorSupervisorView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getRoleView('supervisor').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="text-center py-8 animate-pulse text-slate-400">Loading Floor Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">FS</div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Floor Supervisor</h3>
          <p className="text-slate-500 text-sm">Real-time Ward Operations</p>
        </div>
      </div>

      {data.urgent_alerts.map((alert, i) => (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">Action Required: {alert.ward}</h4>
            <p className="text-sm text-amber-700 mt-1">{alert.alert}</p>
          </div>
        </div>
      ))}

      <div>
        <h4 className="font-bold text-slate-700 mb-4">Live Ward Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.ward_status.map((ward, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h5 className="font-bold text-slate-800 mb-1">{ward.ward}</h5>
                <div className="text-xs text-slate-500 mb-4">{ward.staff_on_duty}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><BedDouble size={14}/> Available Beds</span>
                  <span className={`font-bold ${ward.available_beds < 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {ward.available_beds}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><LogOut size={14}/> Pending Discharges</span>
                  <span className="font-bold text-slate-700">{ward.pending_discharges}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Critical Pts</span>
                  <span className={ward.critical_patients > 0 ? "font-bold text-rose-600" : "font-bold text-slate-400"}>
                    {ward.critical_patients}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
