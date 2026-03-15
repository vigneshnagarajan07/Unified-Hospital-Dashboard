import React from 'react';

export default function DataTable({ departments }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Occupancy</th>
              <th className="px-6 py-4">Wait Time</th>
              <th className="px-6 py-4">OPD Pts</th>
              <th className="px-6 py-4">Surgeries</th>
              <th className="px-6 py-4">Staff</th>
              <th className="px-6 py-4">Critical</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((dept) => {
              const occRate = (dept.beds.occupied / dept.beds.total) * 100;
              const waitAnomaly = dept.opd.wait_time > dept.opd.baseline_wait_time * 1.3;
              const occAnomaly = occRate > 90;

              return (
                <tr key={dept.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{dept.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md font-medium text-xs inline-block ${occAnomaly ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {dept.beds.occupied}/{dept.beds.total} ({Math.round(occRate)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md font-medium text-xs inline-flex items-center gap-1 ${waitAnomaly ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {dept.opd.wait_time}m
                      {waitAnomaly && <span title={`Baseline: ${dept.opd.baseline_wait_time}m`}>⚠️</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">{dept.opd.patients_today}</td>
                  <td className="px-6 py-4">{dept.surgeries.completed}/{dept.surgeries.scheduled}</td>
                  <td className="px-6 py-4">{dept.staff.doctors} D, {dept.staff.nurses} N</td>
                  <td className="px-6 py-4">
                    <span className={dept.critical_patients > 5 ? 'text-amber-600 font-bold' : ''}>
                      {dept.critical_patients}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
