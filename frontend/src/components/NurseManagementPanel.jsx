// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// components/NurseManagementPanel.jsx
// Floor Supervisor tool: view all nurses, assign to patients
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { Users, Activity, CheckCircle, RefreshCw, X, UserPlus } from 'lucide-react'
import { workflowApi } from '../api/client'

export default function NurseManagementPanel() {
  const [nurses,   setNurses]   = useState([])
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [assigning,setAssigning]= useState(null)
  const [toast,    setToast]    = useState(null)

  const loadData = async () => {
    try {
      const [nursesRes, patientsRes] = await Promise.all([
        workflowApi.getNurses(),
        workflowApi.getWorkflowPatients('admitted'),
      ])
      setNurses(nursesRes.data.nurses || [])
      setPatients(patientsRes.data.patients || [])
    } catch (e) { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleAssign = async (nurseId, patientId) => {
    setAssigning(`${nurseId}-${patientId}`)
    try {
      await workflowApi.assignNurse({ nurse_id: nurseId, patient_id: patientId, assigned_by: 'Floor Supervisor' })
      setToast(`Nurse assigned to patient successfully`)
      await loadData()
    } catch (e) {
      setToast('Assignment failed — try again')
    } finally {
      setAssigning(null)
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) return <div className="text-center py-8"><RefreshCw size={18} className="animate-spin text-slate-400 mx-auto" /></div>

  return (
    <div className="space-y-4">

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg bg-emerald-50 border-emerald-300 text-emerald-800 text-sm font-semibold">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Nurse roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Nurse Roster</h3>
          <p className="text-xs text-slate-400 mt-0.5">{nurses.filter(n => n.on_duty).length} on duty · {nurses.length} total</p>
        </div>
        <div className="divide-y divide-slate-50">
          {nurses.map(nurse => {
            const assignedPatients = patients.filter(p => p.assigned_nurse_id === nurse.id)
            return (
              <div key={nurse.id} className="px-5 py-3 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  nurse.on_duty ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {nurse.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{nurse.name}</p>
                  <p className="text-xs text-slate-400">{nurse.department_name} · {nurse.shift} · {nurse.shift_time}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {assignedPatients.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {assignedPatients.length} patient{assignedPatients.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    nurse.on_duty ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {nurse.on_duty ? '● On Duty' : '○ Off'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assign nurse to patient */}
      {patients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Assign Nurse to Patient</h3>
            <p className="text-xs text-slate-400 mt-0.5">{patients.length} admitted patients need nursing care</p>
          </div>
          <div className="p-5 space-y-3">
            {patients.map(patient => {
              const assignedNurse = nurses.find(n => n.id === patient.assigned_nurse_id)
              const availableNurses = nurses.filter(n => n.on_duty && n.department_id === patient.department_id)

              return (
                <div key={patient.patient_id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{patient.name}</p>
                      <p className="text-xs text-slate-400">{patient.patient_id} · {patient.department_name}</p>
                    </div>
                    {assignedNurse && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ✓ {assignedNurse.name}
                      </span>
                    )}
                  </div>

                  {availableNurses.length === 0 ? (
                    <p className="text-xs text-slate-400">No nurses on duty in {patient.department_name}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableNurses.map(nurse => (
                        <button
                          key={nurse.id}
                          onClick={() => handleAssign(nurse.id, patient.patient_id)}
                          disabled={assigning === `${nurse.id}-${patient.patient_id}` || nurse.id === patient.assigned_nurse_id}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            nurse.id === patient.assigned_nurse_id
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'
                          } disabled:opacity-50`}
                        >
                          {assigning === `${nurse.id}-${patient.patient_id}`
                            ? <RefreshCw size={10} className="animate-spin" />
                            : nurse.id === patient.assigned_nurse_id
                              ? <CheckCircle size={10} />
                              : <UserPlus size={10} />
                          }
                          {nurse.name.split(' ')[1] || nurse.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {patients.length === 0 && (
        <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
          <Users size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No admitted patients yet</p>
          <p className="text-xs text-slate-400 mt-1">Admit patients first to assign nurses</p>
        </div>
      )}
    </div>
  )
}
