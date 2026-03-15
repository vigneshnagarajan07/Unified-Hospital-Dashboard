import React from 'react';
import { Bed, Clock, Users, Activity, AlertCircle } from 'lucide-react';

export default function DepartmentCard({ dept, index }) {
  const occRate = (dept.beds.occupied / dept.beds.total) * 100;
  const isAnomalousWait = dept.opd.wait_time > dept.opd.baseline_wait_time * 1.3;
  const isAnomalousOcc = occRate > 90;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-fade-in stagger-${(index % 6) + 1}`}>
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-lg text-slate-800">{dept.name}</h3>
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-xs font-semibold text-slate-600 shadow-sm">
          ⭐ {dept.satisfaction}
        </div>
      </div>
      
      {(isAnomalousWait || isAnomalousOcc) && (
        <div className="bg-red-50 border-b border-red-100 p-3 flex flex-col gap-2">
          {isAnomalousWait && (
            <div className="flex items-start gap-2 text-red-700 text-sm font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Wait time critical: {dept.opd.wait_time}m (Baseline {dept.opd.baseline_wait_time}m)</span>
            </div>
          )}
          {isAnomalousOcc && (
            <div className="flex items-start gap-2 text-red-700 text-sm font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Occupancy critical: {Math.round(occRate)}%</span>
            </div>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-500 flex items-center gap-1.5"><Bed size={14}/> Bed Occupancy</span>
            <span className="font-medium text-slate-700">{dept.beds.occupied} / {dept.beds.total}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${occRate > 90 ? 'bg-red-500' : occRate > 80 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(occRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5"><Clock size={14}/> Wait Time</div>
            <div className={`text-xl font-bold ${isAnomalousWait ? 'text-red-600' : 'text-slate-700'}`}>
              {dept.opd.wait_time}<span className="text-sm font-medium text-slate-400 ml-1">min</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">OPD: {dept.opd.patients_today} pts</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5"><Users size={14}/> Staff</div>
            <div className="text-xl font-bold text-slate-700">
              {dept.staff.doctors + dept.staff.nurses}
            </div>
            <div className="text-xs text-slate-400 mt-1">{dept.staff.doctors} Docs, {dept.staff.nurses} RNs</div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Activity size={14} className="text-amber-500" />
            Critical Pts: <strong className="text-slate-700">{dept.critical_patients}</strong>
          </span>
          <span className="text-slate-500">
            Surgeries: <strong className="text-slate-700">{dept.surgeries.completed}/{dept.surgeries.scheduled}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
