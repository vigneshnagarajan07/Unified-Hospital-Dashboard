// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// NurseDashboard.jsx — Nurse role dashboard
// FIXED: No longer blocks on backend error — shows UI immediately
//        with graceful empty state when backend is offline.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Heart, User, BedDouble,
  Bell, CheckCircle, AlertTriangle, RefreshCw, LogOut,
  ClipboardList, Pill, Clock, Users, X,
  Save, Stethoscope, Thermometer, Wind
} from 'lucide-react'
import { workflowApi } from '../api/client'

const DEMO_NURSE_ID = 1

// ── Vitals Modal ──────────────────────────────────────────────
function VitalsModal({ patient, onSaved, onClose }) {
  const [form, setForm] = useState({
    blood_pressure: '', pulse_bpm: '', temperature_f: '',
    spo2_pct: '', weight_kg: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const handleSubmit = async () => {
    if (!form.blood_pressure || !form.pulse_bpm || !form.spo2_pct) {
      setError('BP, Pulse and SpO₂ are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await workflowApi.recordVitals(patient.patient_id, {
        patient_id:     patient.patient_id,
        blood_pressure: form.blood_pressure,
        pulse_bpm:      parseInt(form.pulse_bpm),
        temperature_f:  parseFloat(form.temperature_f) || 98.6,
        spo2_pct:       parseInt(form.spo2_pct),
        weight_kg:      form.weight_kg ? parseFloat(form.weight_kg) : null,
        notes:          form.notes,
        recorded_by:    'Nurse',
        nurse_id:       DEMO_NURSE_ID,
      })
      setResult(res.data)
      onSaved(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record vitals — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800">Record Vitals</h3>
            <p className="text-xs text-slate-400 mt-0.5">{patient.name} · {patient.patient_id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X size={15} className="text-slate-400" /></button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 border ${result.has_critical ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`font-bold text-sm ${result.has_critical ? 'text-red-700' : 'text-emerald-700'}`}>
                {result.has_critical ? '⚠ Critical vitals — Doctor alerted!' : '✓ Vitals recorded successfully'}
              </p>
              {result.alerts?.map((a, i) => (
                <p key={i} className={`text-xs mt-1 ${a.type === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{a.message}</p>
              ))}
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: 'blood_pressure', label: 'Blood Pressure *', placeholder: '120/80' },
                { field: 'pulse_bpm',      label: 'Pulse (bpm) *',    placeholder: '72'     },
                { field: 'temperature_f',  label: 'Temperature (°F)', placeholder: '98.6'   },
                { field: 'spo2_pct',       label: 'SpO₂ (%) *',       placeholder: '99'     },
                { field: 'weight_kg',      label: 'Weight (kg)',       placeholder: '70'     },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
                  placeholder="Observations"
                  value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {loading ? 'Saving...' : 'Record Vitals'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Patient Card ──────────────────────────────────────────────
function PatientCard({ patient, onRecordVitals }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${patient.is_critical ? 'border-l-4 border-l-red-500 border-red-100' : 'border-slate-200'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${patient.is_critical ? 'bg-red-100' : 'bg-violet-100'}`}>
          <User size={20} className={patient.is_critical ? 'text-red-500' : 'text-violet-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-800">{patient.name}</h3>
            <span className="text-xs text-slate-400">{patient.age}y · {patient.gender}</span>
            {patient.is_critical && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ Critical</span>}
          </div>
          <p className="text-sm text-sky-700 font-semibold">{patient.diagnosis || patient.chief_complaint || 'Awaiting diagnosis'}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><BedDouble size={10} /> {patient.ward || 'Ward TBD'}</span>
            <span className="flex items-center gap-1"><Stethoscope size={10} /> {patient.assigned_doctor}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> Admitted: {patient.admission_date}</span>
          </div>
        </div>
        <button onClick={() => onRecordVitals(patient)}
          className="shrink-0 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-all flex items-center gap-1.5">
          <Activity size={12} /> Record Vitals
        </button>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function NurseDashboard({ onLogout }) {
  const [patients,      setPatients]      = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [backendOnline, setBackendOnline] = useState(true)
  const [lastRefresh,   setLastRefresh]   = useState(new Date())
  const [vitalsModal,   setVitalsModal]   = useState(null)
  const [activeTab,     setActiveTab]     = useState('patients')
  const [showNotifs,    setShowNotifs]    = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [patientsRes, notifsRes] = await Promise.all([
        workflowApi.getNursePatients(DEMO_NURSE_ID),
        workflowApi.getNotifications('nurse'),
      ])
      setPatients(patientsRes.data?.patients || [])
      setNotifications(notifsRes.data?.notifications || [])
      setBackendOnline(true)
      setLastRefresh(new Date())
    } catch {
      setBackendOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 20000)
    return () => clearInterval(t)
  }, [loadData])

  const unreadCount = notifications.filter(n => !n.read).length
  const critical    = patients.filter(p => p.is_critical)

  // Show spinner only for the first 1.5s, then render UI regardless
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">PrimeCare</span>
              <span className="text-slate-400 text-sm"> · Nurse Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Backend status */}
            {!backendOnline && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Backend offline
              </span>
            )}
            {critical.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                {critical.length} Critical
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'} inline-block`} />
              {lastRefresh.toLocaleTimeString()}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(o => !o)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all">
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">Notifications</p>
                    <button onClick={() => setShowNotifs(false)}><X size={13} className="text-slate-400" /></button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-6">No notifications yet</p>
                      : notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 text-xs ${n.urgency === 'critical' ? 'bg-red-50' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.urgency === 'critical' ? 'bg-red-500' : 'bg-violet-400'}`} />
                              <div>
                                <p className="text-slate-700 leading-relaxed">{n.message}</p>
                                <p className="text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>

            <button onClick={loadData} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all">
              <RefreshCw size={14} />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Activity size={14} className="text-violet-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">Ms. Geetha Lakshmi</p>
                <p className="text-xs text-slate-400">Nurse · Cardiology</p>
              </div>
              <button onClick={onLogout} className="ml-2 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">

        {/* Backend offline banner */}
        {!backendOnline && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Backend not connected</p>
              <p className="text-xs text-amber-600 mt-0.5">Start the backend with <code className="bg-amber-100 px-1 rounded">uvicorn main:app --reload --port 8000</code> to load patient data.</p>
            </div>
            <button onClick={loadData} className="ml-auto px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 border border-amber-300">
              Retry
            </button>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'My Patients',   value: patients.length, color: 'violet', Icon: Users   },
            { label: 'Critical',      value: critical.length, color: 'red',    Icon: Heart   },
            { label: 'Shift',         value: 'Morning',       color: 'emerald',Icon: Clock   },
            { label: 'Notifications', value: unreadCount,     color: 'amber',  Icon: Bell    },
          ].map(tile => (
            <div key={tile.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tile.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${tile.color}-100`}>
                  <tile.Icon size={14} className={`text-${tile.color}-600`} />
                </div>
              </div>
              <p className={`text-2xl font-black text-${tile.color}-600 tabular-nums`}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'patients', label: 'My Patients',  Icon: Users         },
            { id: 'tasks',    label: 'Tasks',         Icon: ClipboardList },
            { id: 'orders',   label: 'Doctor Orders', Icon: Pill          },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              <tab.Icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* My Patients */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {patients.length === 0 ? (
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-10 text-center">
                <Users size={28} className="text-violet-400 mx-auto mb-3" />
                <p className="font-semibold text-violet-700">No patients assigned yet</p>
                <p className="text-xs text-violet-500 mt-1">
                  {backendOnline
                    ? 'The floor supervisor will assign patients to you via the Nurse Management panel.'
                    : 'Start the backend to load your assigned patients.'}
                </p>
              </div>
            ) : patients.map(p => (
              <PatientCard key={p.patient_id} patient={p} onRecordVitals={setVitalsModal} />
            ))}
          </div>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <p className="text-sm font-bold text-slate-700 mb-4">Today's Task List</p>
            <div className="space-y-2">
              {[
                { task: 'Morning vitals round — all assigned patients', done: true  },
                { task: 'Administer 08:00 medications',                 done: true  },
                { task: 'Update patient charts after doctor rounds',     done: false },
                { task: 'Afternoon vitals round',                        done: false },
                { task: 'Administer 14:00 medications',                 done: false },
                { task: 'Prepare discharge documents for ICU patient',  done: false },
                { task: 'Evening handover to night shift nurse',         done: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${item.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <CheckCircle size={16} className={item.done ? 'text-emerald-500' : 'text-slate-300'} />
                  <span className={`text-sm ${item.done ? 'text-emerald-700 line-through' : 'text-slate-600'}`}>{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <p className="text-sm font-bold text-slate-700 mb-4">Pending Doctor Orders</p>
            {patients.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {backendOnline ? 'No active orders' : 'Connect backend to view orders'}
              </p>
            ) : patients.map(p => p.diagnosis && (
              <div key={p.patient_id} className="border border-slate-100 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                  <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">{p.diagnosis}</span>
                </div>
                <p className="text-xs text-slate-500">Monitor vitals every 4 hours. Report any SpO₂ below 95% immediately.</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Vitals Modal */}
      {vitalsModal && (
        <VitalsModal
          patient={vitalsModal}
          onSaved={() => { loadData(); setTimeout(() => setVitalsModal(null), 2000) }}
          onClose={() => setVitalsModal(null)}
        />
      )}
    </div>
  )
}
