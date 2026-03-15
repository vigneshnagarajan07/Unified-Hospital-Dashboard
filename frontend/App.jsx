// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// App.jsx — Root router
// UPDATED: Added nurse and pharmacy routes
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import AuthLoginPage            from './pages/AuthLoginPage'
import AdminDashboard           from './pages/AdminDashboard'
import PatientPortal            from './pages/PatientPortal'
import DepartmentHeadDashboard  from './pages/DepartmentHeadDashboard'
import DoctorDashboard          from './pages/DoctorDashboard'
import FloorSupervisorDashboard from './pages/FloorSupervisorDashboard'
import NurseDashboard           from './pages/NurseDashboard'
import PharmacyDashboard        from './pages/PharmacyDashboard'

export default function App() {
  const [activeRole, setActiveRole] = useState(null)

  if (!activeRole) {
    return <AuthLoginPage onAuthenticated={setActiveRole} />
  }

  const handleLogout = () => setActiveRole(null)

  if (activeRole === 'admin')            return <AdminDashboard           onLogout={handleLogout} />
  if (activeRole === 'patient')          return <PatientPortal            onLogout={handleLogout} />
  if (activeRole === 'department_head')  return <DepartmentHeadDashboard  onLogout={handleLogout} />
  if (activeRole === 'doctor')           return <DoctorDashboard          onLogout={handleLogout} />
  if (activeRole === 'floor_supervisor') return <FloorSupervisorDashboard onLogout={handleLogout} />
  if (activeRole === 'nurse')            return <NurseDashboard           onLogout={handleLogout} />
  if (activeRole === 'pharmacy')         return <PharmacyDashboard        onLogout={handleLogout} />

  return null
}
