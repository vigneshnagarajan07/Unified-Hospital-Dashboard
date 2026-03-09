// ─────────────────────────────────────────────────────────────
// Apollo Hospital | GKM_8 Intelligence Platform
// App.jsx — Root router handles role selection + dashboard routing
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'

// ── Placeholder for dashboards not built yet ─────────────────
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
    return <LoginPage onRoleSelected={setActiveRole} />
  }

  const handleLogout = () => setActiveRole(null)

  if (activeRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />
  }

  const roleLabels = {
    doctor: 'Doctor / Nurse',
    department_head: 'Department Head',
    floor_supervisor: 'Floor Supervisor',
    patient: 'Patient Portal',
  }

  return <ComingSoon roleName={roleLabels[activeRole] || activeRole} onLogout={handleLogout} />
}