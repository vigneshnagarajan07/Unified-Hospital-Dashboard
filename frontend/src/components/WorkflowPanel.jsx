// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// components/WorkflowPanel.jsx — End-to-End Patient Journey UI
//
// This component renders the full clinical workflow pipeline:
//   Admit → Vitals → Diagnose → Pharmacy → Billing → Discharge
//
// Used in: AdminDashboard, DoctorDashboard, FloorSupervisorDashboard,
//          PatientPortal, DepartmentHeadDashboard
//
// Props:
//   role: 'admin' | 'doctor' | 'floor_supervisor' | 'patient' | 'department_head'
//   patientId: string (optional — if set, shows specific patient view)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, Activity, Stethoscope, Pill, CreditCard, LogOut,
  Bell, CheckCircle, AlertTriangle, RefreshCw, X, ChevronRight,
  Clock, Package, DollarSign, Users, Heart, FlaskConical,
  Send, BedDouble, Clipboard
} from 'lucide-react'
import { workflowApi } from '../api/client'

// ── Pipeline step definitions ─────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'admit',    label: 'Admit',    Icon: UserPlus,     color: 'sky'     },
  { id: 'vitals',   label: 'Vitals',   Icon: Activity,     color: 'violet'  },
  { id: 'diagnose', label: 'Diagnose', Icon: Stethoscope,  color: 'blue'    },
  { id: 'pharmacy', label: 'Pharmacy', Icon: Pill,         color: 'emerald' },
  { id: 'billing',  label: 'Billing',  Icon: CreditCard,   color: 'amber'   },
  { id: 'discharge',label: 'Discharge',Icon: LogOut,       color: 'red'     },
]

const COLOR_MAP = {
  sky:     { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-300',     btn: 'bg-sky-500 hover:bg-sky-600'       },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-300',  btn: 'bg-violet-500 hover:bg-violet-600' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',    btn: 'bg-blue-500 hover:bg-blue-600'     },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', btn: 'bg-emerald-500 hover:bg-emerald-600'},
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',   btn: 'bg-amber-500 hover:bg-amber-600'   },
  red:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300',     btn: 'bg-red-500 hover:bg-red-600'       },
}

const DEPARTMENTS = [
  { id: 'cardiology',       name: 'Cardiology',                doctor: 'Dr. Ramesh Iyer',         doctorId: 'DOC001' },
  { id: 'general_medicine', name: 'General Medicine',          doctor: 'Dr. Priya Subramaniam',   doctorId: 'DOC002' },
  { id: 'orthopedics',      name: 'Orthopedics',               doctor: 'Dr. Karthik Menon',       doctorId: 'DOC003' },
  { id: 'pediatrics',       name: 'Pediatrics',                doctor: 'Dr. Anitha Krishnan',     doctorId: 'DOC004' },
  { id: 'emergency',        name: 'Emergency',                 doctor: 'Dr. Vijay Nair',          doctorId: 'DOC005' },
  { id: 'obstetrics',       name: 'Obstetrics & Gynaecology',  doctor: 'Dr. Meena Rajagopalan',   doctorId: 'DOC006' },
]

const COMMON_MEDICATIONS = [
  { name: 'Paracetamol', dose: '500mg',  frequency: 'Every 6 hrs', duration: '5 days',  instructions: 'After food' },
  { name: 'Amoxicillin', dose: '500mg',  frequency: 'Thrice daily',duration: '7 days',  instructions: 'After food' },
  { name: 'Pantoprazole',dose: '40mg',   frequency: 'Once daily',  duration: '7 days',  instructions: 'Before food'},
  { name: 'Metformin',   dose: '500mg',  frequency: 'Twice daily', duration: '30 days', instructions: 'After food' },
  { name: 'Amlodipine',  dose: '5mg',    frequency: 'Once daily',  duration: '30 days', instructions: 'Morning'    },
  { name: 'Aspirin',     dose: '75mg',   frequency: 'Once daily',  duration: '30 days', instructions: 'After food' },
]


// ── Toast micro-component ─────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    error:   'bg-red-50 border-red-300 text-red-800',
    info:    'bg-sky-50 border-sky-300 text-sky-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg max-w-sm animate-slide-up ${styles[type]}`}>
      {type === 'success' && <CheckCircle size={16} />}
      {type === 'error'   && <AlertTriangle size={16} />}
      {type === 'info'    && <Bell size={16} />}
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}


// ── Admit Patient Form ────────────────────────────────────────
function AdmitForm({ onAdmitted, onClose }) {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', blood_group: 'O+',
    phone: '', address: '', department_id: 'cardiology',
    chief_complaint: '', insurance_provider: 'None',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const selectedDept = DEPARTMENTS.find(d => d.id === form.department_id)

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.age) {
      setError('Name and age are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await workflowApi.admitPatient({
        ...form,
        age:               parseInt(form.age),
        assigned_doctor:   selectedDept?.doctor || '',
        assigned_doctor_id:selectedDept?.doctorId || '',
        ward:              `Ward — ${selectedDept?.name || ''}`,
      })
      onAdmitted(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to admit patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="field-label">Patient Name *</label>
          <input className="field-input" placeholder="Full name" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Age *</label>
          <input className="field-input" type="number" placeholder="Years" value={form.age}
            onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Gender</label>
          <select className="field-input" value={form.gender}
            onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="field-label">Blood Group</label>
          <select className="field-input" value={form.blood_group}
            onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))}>
            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg}>{bg}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="field-input" placeholder="+91 9XXXXXXXXX" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="field-label">Department *</label>
          <select className="field-input" value={form.department_id}
            onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {selectedDept && (
            <p className="text-xs text-slate-400 mt-1">
              Assigned doctor: <span className="font-semibold text-slate-600">{selectedDept.doctor}</span>
            </p>
          )}
        </div>
        <div className="col-span-2">
          <label className="field-label">Chief Complaint</label>
          <textarea className="field-input resize-none" rows={2}
            placeholder="What brought the patient in today?"
            value={form.chief_complaint}
            onChange={e => setForm(p => ({ ...p, chief_complaint: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="field-label">Insurance Provider</label>
          <input className="field-input" placeholder="e.g. Star Health, HDFC Ergo" value={form.insurance_provider}
            onChange={e => setForm(p => ({ ...p, insurance_provider: e.target.value }))} />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
          {loading ? 'Admitting...' : 'Admit Patient'}
        </button>
      </div>
    </div>
  )
}


// ── Record Vitals Form ────────────────────────────────────────
function VitalsForm({ patientId, patientName, onRecorded, onClose }) {
  const [form, setForm] = useState({
    blood_pressure: '', pulse_bpm: '', temperature_f: '',
    spo2_pct: '', weight_kg: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSubmit = async () => {
    if (!form.blood_pressure || !form.pulse_bpm || !form.spo2_pct) {
      setError('BP, Pulse, and SpO₂ are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await workflowApi.recordVitals(patientId, {
        patient_id:     patientId,
        blood_pressure: form.blood_pressure,
        pulse_bpm:      parseInt(form.pulse_bpm),
        temperature_f:  parseFloat(form.temperature_f) || 98.6,
        spo2_pct:       parseInt(form.spo2_pct),
        weight_kg:      form.weight_kg ? parseFloat(form.weight_kg) : null,
        notes:          form.notes,
      })
      onRecorded(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record vitals')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-violet-50 rounded-xl px-4 py-2.5 text-sm text-violet-700 font-medium border border-violet-200">
        Recording vitals for: <span className="font-bold">{patientName}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { field: 'blood_pressure', label: 'Blood Pressure *', placeholder: 'e.g. 120/80' },
          { field: 'pulse_bpm',      label: 'Pulse (bpm) *',    placeholder: 'e.g. 72'     },
          { field: 'temperature_f',  label: 'Temperature (°F)', placeholder: 'e.g. 98.6'   },
          { field: 'spo2_pct',       label: 'SpO₂ (%) *',       placeholder: 'e.g. 99'     },
          { field: 'weight_kg',      label: 'Weight (kg)',       placeholder: 'e.g. 70'     },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="field-label">{label}</label>
            <input className="field-input" placeholder={placeholder}
              value={form[field]}
              onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
          </div>
        ))}
        <div>
          <label className="field-label">Notes</label>
          <input className="field-input" placeholder="Any observations"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
          {loading ? 'Recording...' : 'Record Vitals'}
        </button>
      </div>
    </div>
  )
}


// ── Diagnose Form ─────────────────────────────────────────────
function DiagnoseForm({ patientId, patientName, onDiagnosed, onClose }) {
  const [diagnosis, setDiagnosis]   = useState('')
  const [severity, setSeverity]     = useState('moderate')
  const [notes, setNotes]           = useState('')
  const [medications, setMeds]      = useState([])
  const [labTests, setLabTests]     = useState([])
  const [customMed, setCustomMed]   = useState({ name: '', dose: '', frequency: 'Once daily', duration: '7 days', instructions: '' })
  const [customLab, setCustomLab]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const addMed = (med) => {
    if (!medications.find(m => m.name === med.name)) {
      setMeds(prev => [...prev, med])
    }
  }

  const addCustomMed = () => {
    if (!customMed.name.trim()) return
    setMeds(prev => [...prev, { ...customMed }])
    setCustomMed({ name: '', dose: '', frequency: 'Once daily', duration: '7 days', instructions: '' })
  }

  const addLab = () => {
    if (customLab.trim() && !labTests.includes(customLab.trim())) {
      setLabTests(prev => [...prev, customLab.trim()])
      setCustomLab('')
    }
  }

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { setError('Diagnosis is required.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await workflowApi.diagnosePatient(patientId, {
        patient_id: patientId,
        diagnosis,
        severity,
        notes,
        medications,
        lab_tests: labTests,
      })
      onDiagnosed(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record diagnosis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium border border-blue-200">
        Diagnosing: <span className="font-bold">{patientName}</span>
      </div>

      {/* Diagnosis */}
      <div>
        <label className="field-label">Diagnosis *</label>
        <textarea className="field-input resize-none" rows={2} placeholder="Primary diagnosis"
          value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
      </div>

      {/* Severity */}
      <div>
        <label className="field-label">Severity</label>
        <div className="grid grid-cols-3 gap-2">
          {['mild', 'moderate', 'critical'].map(s => (
            <button key={s} onClick={() => setSeverity(s)}
              className={`py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                severity === s
                  ? s === 'mild'     ? 'bg-emerald-500 text-white border-emerald-500'
                  : s === 'moderate' ? 'bg-amber-400 text-white border-amber-400'
                                     : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Quick medications */}
      <div>
        <label className="field-label">Quick Add Medications</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_MEDICATIONS.map(med => (
            <button key={med.name} onClick={() => addMed(med)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                medications.find(m => m.name === med.name)
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}>
              {medications.find(m => m.name === med.name) ? '✓ ' : '+ '}{med.name}
            </button>
          ))}
        </div>

        {/* Custom medication */}
        <div className="grid grid-cols-4 gap-1.5">
          <input className="field-input col-span-2 text-xs" placeholder="Drug name"
            value={customMed.name} onChange={e => setCustomMed(p => ({ ...p, name: e.target.value }))} />
          <input className="field-input text-xs" placeholder="Dose"
            value={customMed.dose} onChange={e => setCustomMed(p => ({ ...p, dose: e.target.value }))} />
          <button onClick={addCustomMed} className="py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">Add</button>
        </div>
      </div>

      {/* Prescribed medications list */}
      {medications.length > 0 && (
        <div className="space-y-1">
          {medications.map((med, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 text-xs">
              <Pill size={10} className="text-blue-500 shrink-0" />
              <span className="font-semibold text-slate-700">{med.name} {med.dose}</span>
              <span className="text-slate-400">{med.frequency} · {med.duration}</span>
              <button onClick={() => setMeds(prev => prev.filter((_, j) => j !== i))}
                className="ml-auto text-red-400 hover:text-red-600"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Lab tests */}
      <div>
        <label className="field-label">Order Lab Tests</label>
        <div className="flex gap-2">
          <input className="field-input flex-1 text-xs" placeholder="e.g. CBC, HbA1c, ECG"
            value={customLab}
            onChange={e => setCustomLab(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLab()} />
          <button onClick={addLab} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {labTests.map((t, i) => (
            <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              <FlaskConical size={9} /> {t}
              <button onClick={() => setLabTests(prev => prev.filter((_, j) => j !== i))} className="ml-1"><X size={9} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="field-label">Clinical Notes</label>
        <textarea className="field-input resize-none text-xs" rows={2} placeholder="Diet, precautions, follow-up notes"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Stethoscope size={13} />}
          {loading ? 'Saving...' : 'Confirm Diagnosis'}
        </button>
      </div>
    </div>
  )
}


// ── Pharmacy Queue Panel ──────────────────────────────────────
function PharmacyQueue({ onToast }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    try {
      const res = await workflowApi.getPharmacyQueue()
      setOrders(res.data.orders || [])
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const dispense = async (orderId, medName) => {
    try {
      await workflowApi.dispenseMedication(orderId, { dispensed_by: 'Pharmacist' })
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'dispensed' } : o))
      onToast(`${medName} dispensed successfully`, 'success')
    } catch (e) {
      onToast('Failed to dispense', 'error')
    }
  }

  useEffect(() => { loadOrders() }, [])

  if (loading) return <div className="text-center py-8"><RefreshCw size={18} className="animate-spin text-slate-400 mx-auto" /></div>

  const pending   = orders.filter(o => o.status === 'pending')
  const dispensed = orders.filter(o => o.status === 'dispensed')

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-amber-600">{pending.length}</p>
          <p className="text-xs text-amber-700 font-medium">Pending</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-emerald-600">{dispensed.length}</p>
          <p className="text-xs text-emerald-700 font-medium">Dispensed</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
          <Package size={24} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No pharmacy orders yet</p>
          <p className="text-xs text-slate-400 mt-1">Orders appear after a doctor diagnoses a patient</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {orders.map(order => (
            <div key={order.order_id}
              className={`rounded-xl border p-3 flex items-center gap-3 ${
                order.status === 'pending'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50 opacity-70'
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                order.status === 'pending' ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                <Pill size={14} className={order.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{order.medication} <span className="font-normal text-slate-500">{order.dose}</span></p>
                <p className="text-xs text-slate-500">{order.patient_name} · {order.department}</p>
                <p className="text-xs text-slate-400">{order.frequency} · {order.duration}</p>
              </div>
              {order.status === 'pending' ? (
                <button onClick={() => dispense(order.order_id, order.medication)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors">
                  Dispense
                </button>
              ) : (
                <span className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold">
                  ✓ Done
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Billing Summary Panel ─────────────────────────────────────
function BillingSummary({ onToast }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    workflowApi.getBillingSummary()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8"><RefreshCw size={18} className="animate-spin text-slate-400 mx-auto" /></div>

  const wb = data?.workflow_billing || {}
  const hf = data?.hospital_finance || {}

  const formatINR = (val) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0'

  return (
    <div className="space-y-4">
      {/* Workflow billing summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Active Patients',   value: wb.active_patients || 0,     color: 'sky'     },
          { label: 'Discharged',        value: wb.discharged_patients || 0, color: 'emerald' },
          { label: 'Total Billed',      value: formatINR(wb.total_billed_inr),   color: 'violet' },
          { label: 'Pending Dues',      value: formatINR(wb.total_pending_dues_inr), color: 'amber' },
        ].map(tile => (
          <div key={tile.label} className={`rounded-xl border p-3 text-center bg-${tile.color}-50 border-${tile.color}-200`}>
            <p className={`text-xl font-black text-${tile.color}-600`}>{tile.value}</p>
            <p className={`text-xs text-${tile.color}-700 font-medium`}>{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      {wb.revenue_by_category && Object.keys(wb.revenue_by_category).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Revenue by Category</p>
          <div className="space-y-2">
            {Object.entries(wb.revenue_by_category).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 capitalize">{cat}</span>
                <span className="text-xs font-bold text-slate-800">{formatINR(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital finance overview */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Hospital Finance (Today)</p>
        <div className="space-y-1.5">
          {[
            { label: 'Revenue Today',         value: `₹${hf.revenue_today_lakh} L` },
            { label: 'MTD Revenue',           value: `₹${hf.revenue_mtd_lakh} L / ₹${hf.revenue_target_lakh} L target` },
            { label: 'Collection Rate',       value: `${hf.collection_rate_pct}%` },
            { label: 'Pending Bills',         value: `₹${hf.pending_bills_lakh} L` },
            { label: 'Insurance Claims',      value: `${hf.insurance_claims_pct}%` },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{row.label}</span>
              <span className="font-semibold text-slate-700">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      {wb.recent_transactions?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Recent Transactions</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {wb.recent_transactions.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-700">{t.description}</p>
                  <p className="text-slate-400">{t.patient_name}</p>
                </div>
                <span className="font-bold text-emerald-700">+{formatINR(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Notifications Bell ────────────────────────────────────────
export function NotificationsBell({ role }) {
  const [notifs, setNotifs]   = useState([])
  const [open, setOpen]       = useState(false)

  useEffect(() => {
    const load = () => workflowApi.getNotifications(role)
      .then(res => setNotifs(res.data.notifications || []))
      .catch(() => {})
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [role])

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all">
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-bold text-slate-800 text-sm">Notifications</p>
            <button onClick={() => setOpen(false)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No notifications</p>
            ) : notifs.map(n => (
              <div key={n.id}
                className={`px-4 py-3 text-xs ${n.read ? 'opacity-60' : ''} ${
                  n.urgency === 'critical' ? 'bg-red-50' : ''
                }`}>
                <div className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    n.urgency === 'critical' ? 'bg-red-500' : 'bg-sky-400'
                  }`} />
                  <div>
                    <p className="text-slate-700 leading-relaxed">{n.message}</p>
                    <p className="text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Main WorkflowPanel Component ──────────────────────────────
export default function WorkflowPanel({ role = 'admin', patientId = null }) {
  const [activeStep, setActiveStep]     = useState(null)
  const [selectedPatient, setSelected]  = useState(patientId ? { patient_id: patientId } : null)
  const [toast, setToast]               = useState(null)
  const [workflowPatients, setWfPts]    = useState([])
  const [summaryPatient, setSummaryPatient] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  // Load workflow patients for patient selector
  useEffect(() => {
    workflowApi.getWorkflowPatients()
      .then(res => setWfPts(res.data.patients || []))
      .catch(() => {})
  }, [activeStep])

  // Role-based step visibility
  const visibleSteps = PIPELINE_STEPS.filter(step => {
    if (role === 'patient')          return ['pharmacy', 'billing'].includes(step.id)
    if (role === 'floor_supervisor') return ['admit', 'vitals', 'discharge'].includes(step.id)
    if (role === 'doctor')           return ['vitals', 'diagnose', 'discharge'].includes(step.id)
    if (role === 'department_head')  return ['vitals', 'diagnose', 'billing'].includes(step.id)
    return true // admin sees all
  })

  const handleAdmitted = (data) => {
    setSelected({ patient_id: data.patient_id, name: data.patient?.name })
    showToast(`${data.patient?.name} admitted! ID: ${data.patient_id}`)
    setActiveStep(null)
    workflowApi.getWorkflowPatients().then(res => setWfPts(res.data.patients || [])).catch(() => {})
  }

  const handleVitalsRecorded = (data) => {
    showToast(
      data.has_critical
        ? `⚠ Critical vitals! Doctor alerted for ${data.patient_name}`
        : `Vitals recorded for ${data.patient_name}`,
      data.has_critical ? 'warning' : 'success'
    )
    setActiveStep(null)
  }

  const handleDiagnosed = (data) => {
    showToast(`Diagnosis saved. ${data.medications_prescribed} Rx sent to pharmacy.`)
    setActiveStep(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800">Patient Workflow</h2>
          <p className="text-xs text-slate-400 mt-0.5">End-to-end clinical pipeline</p>
        </div>
        {workflowPatients.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
            {workflowPatients.length} active
          </span>
        )}
      </div>

      {/* Pipeline steps */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex gap-2 flex-wrap">
          {visibleSteps.map((step, i) => {
            const clr = COLOR_MAP[step.color]
            return (
              <button key={step.id} onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                  activeStep === step.id
                    ? `${clr.bg} ${clr.text} ${clr.border}`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                <step.Icon size={13} />
                {step.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Patient selector (for vitals/diagnose/discharge) */}
      {activeStep && activeStep !== 'admit' && activeStep !== 'billing' && activeStep !== 'pharmacy' && (
        <div className="px-5 pt-4">
          <label className="field-label">Select Patient</label>
          <select className="field-input"
            value={selectedPatient?.patient_id || ''}
            onChange={e => {
              const pt = workflowPatients.find(p => p.patient_id === e.target.value)
              setSelected(pt || { patient_id: e.target.value, name: e.target.value })
            }}>
            <option value="">-- Pick a patient --</option>
            {/* Workflow patients */}
            {workflowPatients.map(p => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.name} ({p.patient_id}) · {p.department_name}
              </option>
            ))}
            {/* Well-known demo patients */}
            {[
              { id: 'APL-2024-0847', name: 'Senthil Kumar (Cardiology)' },
              { id: 'APL-2024-0901', name: 'Lakshmi Devi (Obstetrics)' },
              { id: 'APL-2024-0923', name: 'Arjun Sharma (Orthopedics)' },
              { id: 'APL-2024-0931', name: 'Murugan Pillai (Gen Medicine)' },
              { id: 'APL-2024-0958', name: 'Rajiv Menon (Emergency)' },
            ].map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Active step form */}
      {activeStep && (
        <div className="px-5 py-4">
          {activeStep === 'admit' && (
            <AdmitForm
              onAdmitted={handleAdmitted}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'vitals' && selectedPatient?.patient_id && (
            <VitalsForm
              patientId={selectedPatient.patient_id}
              patientName={selectedPatient.name || selectedPatient.patient_id}
              onRecorded={handleVitalsRecorded}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'diagnose' && selectedPatient?.patient_id && (
            <DiagnoseForm
              patientId={selectedPatient.patient_id}
              patientName={selectedPatient.name || selectedPatient.patient_id}
              onDiagnosed={handleDiagnosed}
              onClose={() => setActiveStep(null)}
            />
          )}

          {activeStep === 'pharmacy' && (
            <PharmacyQueue onToast={showToast} />
          )}

          {activeStep === 'billing' && (
            <BillingSummary onToast={showToast} />
          )}

          {activeStep === 'discharge' && selectedPatient?.patient_id && (
            <DischargeForm
              patientId={selectedPatient.patient_id}
              patientName={selectedPatient.name || selectedPatient.patient_id}
              onDischarged={(data) => {
                showToast(`${data.patient_name} discharged. Bill: ₹${data.final_bill?.toLocaleString()}`)
                setActiveStep(null)
                setSelected(null)
              }}
              onClose={() => setActiveStep(null)}
            />
          )}

          {/* Show "select a patient" prompt if patient needed but not selected */}
          {['vitals', 'diagnose', 'discharge'].includes(activeStep) && !selectedPatient?.patient_id && (
            <div className="text-center py-6 text-slate-400 text-sm">
              Select a patient above to continue
            </div>
          )}
        </div>
      )}

      {/* Patient Summary View — Phase D */}
      {summaryPatient && (
        <div className="px-5 py-4">
          <PatientSummaryCard
            patientId={summaryPatient}
            onClose={() => setSummaryPatient(null)}
          />
        </div>
      )}

      {/* Workflow patients list */}
      {!activeStep && !summaryPatient && workflowPatients.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Recently Admitted via Workflow
          </p>
          <div className="space-y-2">
            {workflowPatients.slice(0, 5).map(p => (
              <div key={p.patient_id}
                onClick={() => setSummaryPatient(p.patient_id)}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <Users size={13} className="text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.patient_id} · {p.department_name}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'discharged'
                    ? 'bg-slate-100 text-slate-500'
                    : p.is_critical
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {p.status === 'discharged' ? 'Discharged' : p.is_critical ? '⚠ Critical' : 'Admitted'}
                </span>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activeStep && !summaryPatient && workflowPatients.length === 0 && (
        <div className="px-5 py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3">
            <Clipboard size={20} className="text-sky-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Workflow pipeline ready</p>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'floor_supervisor' || role === 'admin'
              ? 'Click "Admit" to start the patient journey'
              : 'Patient journey starts when Floor Supervisor admits a patient'}
          </p>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}


// ── Patient Summary Card (Phase D — Unified Patient View) ────
function PatientSummaryCard({ patientId, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('timeline')

  useEffect(() => {
    setLoading(true)
    workflowApi.getPatientSummary(patientId)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return (
    <div className="text-center py-10">
      <RefreshCw size={20} className="animate-spin text-slate-400 mx-auto" />
      <p className="text-xs text-slate-400 mt-2">Loading patient summary…</p>
    </div>
  )

  if (!data) return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-500">Patient not found</p>
      <button onClick={onClose} className="mt-2 text-xs text-sky-500 hover:underline">← Back</button>
    </div>
  )

  const pt  = data.patient || {}
  const formatINR = (val) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0'

  const TABS = [
    { id: 'timeline',  label: 'Timeline',  Icon: Clock      },
    { id: 'vitals',    label: 'Vitals',     Icon: Heart      },
    { id: 'diagnoses', label: 'Diagnoses',  Icon: Stethoscope},
    { id: 'pharmacy',  label: 'Pharmacy',   Icon: Pill       },
    { id: 'billing',   label: 'Billing',    Icon: DollarSign },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onClose} className="text-xs text-sky-500 hover:underline mb-1 flex items-center gap-1">
            <ChevronRight size={10} className="rotate-180" /> Back to list
          </button>
          <h3 className="text-lg font-black text-slate-800">{pt.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {pt.patient_id} · {pt.age}y {pt.gender} · {pt.department_name}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          data.status === 'discharged' ? 'bg-slate-100 text-slate-500'
            : pt.is_critical ? 'bg-red-100 text-red-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {data.status === 'discharged' ? 'Discharged' : pt.is_critical ? '⚠ Critical' : 'Admitted'}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Vitals',    value: data.vitals_count || 0,              color: 'violet' },
          { label: 'Diagnoses', value: data.diagnosis_history?.length || 0, color: 'blue'   },
          { label: 'Rx Orders', value: data.pharmacy_orders?.total || 0,    color: 'emerald'},
          { label: 'Billed',    value: formatINR(data.billing?.total_billed), color: 'amber' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-2.5 text-center bg-${s.color}-50 border-${s.color}-200`}>
            <p className={`text-base font-black text-${s.color}-600`}>{s.value}</p>
            <p className={`text-[10px] text-${s.color}-700 font-medium`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-slate-100 pb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.id ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}>
            <t.Icon size={11} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-80 overflow-y-auto pr-1">

        {/* Timeline */}
        {tab === 'timeline' && (
          <div className="space-y-2">
            {(data.timeline || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No events yet</p>
            ) : data.timeline.map((ev, i) => {
              const colors = {
                admission: 'bg-sky-100 text-sky-600',
                vitals: 'bg-violet-100 text-violet-600',
                diagnosis: 'bg-blue-100 text-blue-600',
                pharmacy: 'bg-emerald-100 text-emerald-600',
                nurse_assignment: 'bg-amber-100 text-amber-600',
                discharge: 'bg-red-100 text-red-600',
              }
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colors[ev.type] || 'bg-slate-100 text-slate-500'}`}>
                    <Clock size={10} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">{ev.title}</p>
                    <p className="text-[10px] text-slate-400">{ev.detail}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                    </p>
                  </div>
                  {ev.has_alert && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">⚠</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Vitals */}
        {tab === 'vitals' && (
          <div className="space-y-2">
            {(data.vitals_history || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No vitals recorded</p>
            ) : data.vitals_history.map((v, i) => (
              <div key={i} className={`rounded-xl border p-3 ${v.has_alerts ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'BP',    value: v.blood_pressure },
                    { label: 'Pulse', value: `${v.pulse_bpm} bpm` },
                    { label: 'SpO₂',  value: `${v.spo2_pct}%` },
                    { label: 'Temp',  value: `${v.temperature_f}°F` },
                  ].map(m => (
                    <div key={m.label}>
                      <p className="text-[10px] text-slate-400">{m.label}</p>
                      <p className="text-xs font-bold text-slate-700">{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {v.recorded_by} · {v.recorded_at ? new Date(v.recorded_at).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Diagnoses */}
        {tab === 'diagnoses' && (
          <div className="space-y-2">
            {(data.diagnosis_history || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No diagnoses yet</p>
            ) : data.diagnosis_history.map((d, i) => (
              <div key={i} className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope size={12} className="text-blue-600" />
                  <p className="text-sm font-bold text-blue-800">{d.diagnosis}</p>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    d.severity === 'critical' ? 'bg-red-100 text-red-700'
                      : d.severity === 'moderate' ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>{d.severity}</span>
                </div>
                {d.notes && <p className="text-xs text-slate-600 mb-1">{d.notes}</p>}
                {d.medications?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.medications.map((m, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700">
                        💊 {m.name} {m.dose}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5">
                  By {d.diagnosed_by} · {d.diagnosed_at ? new Date(d.diagnosed_at).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pharmacy */}
        {tab === 'pharmacy' && (
          <div className="space-y-2">
            {(data.pharmacy_orders?.all || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No pharmacy orders</p>
            ) : data.pharmacy_orders.all.map((o, i) => (
              <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${
                o.status === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
              }`}>
                <Pill size={14} className={o.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700">{o.medication} {o.dose}</p>
                  <p className="text-[10px] text-slate-400">{o.frequency} · {o.duration}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{o.status === 'pending' ? 'Pending' : '✓ Dispensed'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Billing */}
        {tab === 'billing' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Billed',      value: formatINR(data.billing?.total_billed),      color: 'violet' },
                { label: 'Insurance Covered',  value: formatINR(data.billing?.insurance_covered), color: 'emerald'},
                { label: 'Patient Due',        value: formatINR(data.billing?.patient_due),       color: 'red'    },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-2.5 text-center bg-${s.color}-50 border-${s.color}-200`}>
                  <p className={`text-sm font-black text-${s.color}-600`}>{s.value}</p>
                  <p className={`text-[10px] text-${s.color}-700 font-medium`}>{s.label}</p>
                </div>
              ))}
            </div>
            {data.billing?.by_category && Object.keys(data.billing.by_category).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">By Category</p>
                {Object.entries(data.billing.by_category).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-xs py-1">
                    <span className="text-slate-500 capitalize">{cat}</span>
                    <span className="font-bold text-slate-700">{formatINR(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


// ── Discharge Form (defined after main component) ─────────────
function DischargeForm({ patientId, patientName, onDischarged, onClose }) {
  const [summary, setSummary]     = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [followup, setFollowup]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const handleSubmit = async () => {
    if (!summary.trim()) { setError('Discharge summary is required.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await workflowApi.dischargePatient(patientId, {
        patient_id:        patientId,
        discharge_summary: summary,
        final_diagnosis:   diagnosis,
        followup_date:     followup,
        discharged_by:     'Doctor',
      })
      onDischarged(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to discharge patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 rounded-xl px-4 py-2.5 text-sm text-red-700 font-medium border border-red-200">
        Discharging: <span className="font-bold">{patientName}</span>
      </div>
      <div>
        <label className="field-label">Final Diagnosis</label>
        <input className="field-input" placeholder="Confirmed final diagnosis" value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Discharge Summary *</label>
        <textarea className="field-input resize-none" rows={3}
          placeholder="Summary of treatment, patient condition at discharge"
          value={summary} onChange={e => setSummary(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Follow-up Date</label>
        <input className="field-input" type="date" value={followup}
          onChange={e => setFollowup(e.target.value)} />
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-200">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
          {loading ? 'Processing...' : 'Confirm Discharge'}
        </button>
      </div>
    </div>
  )
}
