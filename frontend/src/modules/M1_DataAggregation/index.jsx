import React, { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { api } from '../../api/client';
import DepartmentCard from './DepartmentCard';
import DataTable from './DataTable';

export default function M1_DataAggregation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getAggregation();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const intv = setInterval(fetchData, 30000);
    return () => clearInterval(intv);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Hospital Data...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data. API might be down.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Overview</h2>
          <p className="text-slate-500 text-sm mt-1">{data.hospital_info.name} • {data.hospital_info.location}</p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-sky-50 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-sky-50 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryTile label="Total Beds" value={data.summary.total_beds} />
        <SummaryTile label="Occupancy %" value={`${data.summary.occupancy_rate}%`} highlight={data.summary.occupancy_rate > 85 ? 'red' : 'green'} />
        <SummaryTile label="OPD Patients" value={data.summary.total_opd_patients} />
        <SummaryTile label="Avg Wait" value={`${data.summary.avg_opd_wait}m`} highlight={data.summary.avg_opd_wait > 30 ? 'red' : 'normal'} />
        <SummaryTile label="Departments" value={data.summary.total_departments} />
        <SummaryTile label="Total Staff" value={data.summary.total_staff} />
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.departments.map((dept, idx) => (
            <DepartmentCard key={dept.id} dept={dept} index={idx} />
          ))}
        </div>
      ) : (
        <DataTable departments={data.departments} />
      )}
    </div>
  );
}

function SummaryTile({ label, value, highlight }) {
  const getColors = () => {
    switch(highlight) {
      case 'red': return 'text-red-600 bg-red-50 border-red-100';
      case 'green': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-900 bg-white border-slate-200';
    }
  };
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1 ${getColors()}`}>
      <span className={`text-2xl font-bold ${highlight === 'normal' || !highlight ? 'text-slate-800' : ''}`}>{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1 text-center">{label}</span>
    </div>
  );
}
