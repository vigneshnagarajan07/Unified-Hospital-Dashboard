import React, { useState } from 'react';
import CEOView from './CEOView';
import CardiologyView from './CardiologyView';
import FloorSupervisorView from './FloorSupervisorView';
import { Users } from 'lucide-react';

export default function M6_RoleViews() {
  const [role, setRole] = useState('ceo');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-500" />
            Persona Views
          </h2>
          <p className="text-slate-500 text-sm mt-1">Customized data streams based on organizational role</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-200">
          <button 
            onClick={() => setRole('ceo')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === 'ceo' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            CEO
          </button>
          <button 
            onClick={() => setRole('cardiology')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === 'cardiology' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dept Head
          </button>
          <button 
            onClick={() => setRole('supervisor')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === 'supervisor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Supervisor
          </button>
        </div>
      </div>

      <div className="animate-fade-in bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {role === 'ceo' && <CEOView />}
        {role === 'cardiology' && <CardiologyView />}
        {role === 'supervisor' && <FloorSupervisorView />}
      </div>
    </div>
  );
}
