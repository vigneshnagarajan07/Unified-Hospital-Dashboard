// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// App.jsx — Root router
// FIX: Added FloorSupervisorDashboard import and route
//      (was falling through to ComingSoon placeholder)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import AuthLoginPage           from './pages/AuthLoginPage'
import AdminDashboard          from './pages/AdminDashboard'
import PatientPortal           from './pages/PatientPortal'
import DepartmentHeadDashboard from './pages/DepartmentHeadDashboard'
import DoctorDashboard         from './pages/DoctorDashboard'
import FloorSupervisorDashboard from './pages/FloorSupervisorDashboard'
import NurseDashboard          from './pages/NurseDashboard'
import PharmacyDashboard       from './pages/PharmacyDashboard'

function ComingSoon({ roleName, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏗️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">{roleName} Dashboard</h2>
        <p className="text-slate-400 text-sm mb-6">Coming next!</p>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [activeRole, setActiveRole] = useState(null)

  if (!activeRole) {
    return <AuthLoginPage onAuthenticated={setActiveRole} />
  }

  const handleLogout = () => setActiveRole(null)

  if (activeRole === 'admin' || activeRole === 'receptionist') return <AdminDashboard onLogout={handleLogout} />
  if (activeRole === 'patient')          return <PatientPortal            onLogout={handleLogout} />
  if (activeRole === 'department_head')  return <DepartmentHeadDashboard  onLogout={handleLogout} />
  if (activeRole === 'doctor')           return <DoctorDashboard          onLogout={handleLogout} />
  if (activeRole === 'floor_supervisor') return <FloorSupervisorDashboard onLogout={handleLogout} />
  if (activeRole === 'nurse')            return <NurseDashboard           onLogout={handleLogout} />
  if (activeRole === 'pharmacy')         return <PharmacyDashboard        onLogout={handleLogout} />

  const roleLabels = {
    floor_supervisor: 'Floor Supervisor',
  }

  return <ComingSoon roleName={roleLabels[activeRole] || activeRole} onLogout={handleLogout} />
}
