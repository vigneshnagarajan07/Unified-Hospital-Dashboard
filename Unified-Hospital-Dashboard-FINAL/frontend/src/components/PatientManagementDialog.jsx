// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// PatientManagementDialog.jsx — Admin patient CRUD panel
// Features: table, add patient, edit, view vitals, update vitals
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
  X, Plus, Edit2, Eye, Activity, User, Search,
  ChevronRight, Save, Loader2, Trash2, RefreshCw,
  HeartPulse, Thermometer, Wind, Droplets,
  CheckCircle, AlertCircle, Users, Stethoscope
} from 'lucide-react'
import apiClient from '../api/client'

const DEPARTMENTS = [
  'Cardiology', 'General Medicine', 'Orthopedics',
  'Pediatrics', 'Emergency', 'Obstetrics', 'Neurology'
]
const DOCTORS = [
  'Dr. Ramesh Iyer', 'Dr. Priya Subramaniam', 'Dr. Karthik Menon',
  'Dr. Anitha Krishnan', 'Dr. Vijay Nair', 'Dr. Meena Rajagopalan'
]
const STATUS_OPTIONS = ['admitted', 'icu', 'discharged', 'observation']

const STATUS_STYLES = {
  admitted:    { bg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-500'     },
  icu:         { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  discharged:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  observation: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
}

// ── Sub-component: Status badge ────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.admitted
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

// ── Sub-component: Vitals form ─────────────────────────────────
function VitalsForm({ patientId, patientName, existing, onSave, onClose, addToast }) {
  const [form, setForm] = useState({
    patient_id:        patientId,
    heart_rate:        existing?.heart_rate        || '',
    blood_pressure:    existing?.blood_pressure    || '',
    temperature:       existing?.temperature       || '',
    oxygen_saturation: existing?.oxygen_saturation || '',
    respiration_rate:  existing?.respiration_rate  || '',
    notes:             existing?.notes             || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.put('/patients-mgmt/vitals/update', {
        ...form,
        heart_rate:        form.heart_rate        ? +form.heart_rate        : null,
        oxygen_saturation: form.oxygen_saturation ? +form.oxygen_saturation : null,
        respiration_rate:  form.respiration_rate  ? +form.respiration_rate  : null,
        temperature:       form.temperature       ? +form.temperature       : null,
      })
      addToast?.(`Vitals updated for ${patientName}`, 'success')
      onSave?.()
      onClose()
    } catch {
      addToast?.('Failed to update vitals', 'error')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'heart_rate',        label: 'Heart Rate',        icon: HeartPulse,   unit: 'bpm',   type: 'number', placeholder: '72' },
    { key: 'blood_pressure',    label: 'Blood Pressure',    icon: Activity,     unit: 'mmHg',  type: 'text',   placeholder: '120/80' },
    { key: 'temperature',       label: 'Temperature',       icon: Thermometer,  unit: '°C',    type: 'number', placeholder: '37.0' },
    { key: 'oxygen_saturation', label: 'SpO₂',              icon: Droplets,     unit: '%',     type: 'number', placeholder: '98' },
    { key: 'respiration_rate',  label: 'Respiration Rate',  icon: Wind,         unit: '/min',  type: 'number', placeholder: '16' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <Activity size={16} className="text-sky-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Update Vitals</h3>
          <p className="text-xs text-slate-400">{patientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {fields.map(({ key, label, icon: Icon, unit, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
            <div className="relative">
              <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="input-field w-full pl-8 pr-12 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-500 mb-1">Clinical Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Enter clinical observations..."
          className="input-field w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Vitals'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Sub-component: Patient edit form ───────────────────────────
function PatientForm({ patient, onSave, onClose, addToast }) {
  const isEdit = !!patient?.id
  const [form, setForm] = useState({
    name:             patient?.name             || '',
    age:              patient?.age              || '',
    gender:           patient?.gender           || 'Male',
    department:       patient?.department       || DEPARTMENTS[0],
    assigned_doctor:  patient?.assigned_doctor  || DOCTORS[0],
    diagnosis:        patient?.diagnosis        || '',
    contact:          patient?.contact          || '',
    admission_status: patient?.admission_status || 'admitted',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 130)) e.age = 'Invalid age'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const payload = { ...form, age: form.age ? +form.age : null }
      if (isEdit) {
        await apiClient.put(`/patients-mgmt/${patient.id}`, payload)
        addToast?.('Patient record updated', 'success')
      } else {
        await apiClient.post('/patients-mgmt/', payload)
        addToast?.('Patient added successfully', 'success')
      }
      onSave?.()
      onClose()
    } catch {
      addToast?.('Failed to save patient', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <User size={16} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{isEdit ? 'Edit Patient' : 'Add New Patient'}</h3>
          <p className="text-xs text-slate-400">{isEdit ? `ID #${patient.id}` : 'Fill in patient details'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Patient full name"
            className={`input-field w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-50 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={e => set('age', e.target.value)}
            placeholder="Age"
            className={`input-field w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-50 ${errors.age ? 'border-red-300' : 'border-slate-200'}`}
          />
          {errors.age && <p className="text-[10px] text-red-500 mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={e => set('gender', e.target.value)}
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          >
            {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
          <select
            value={form.department}
            onChange={e => set('department', e.target.value)}
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          >
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned Doctor</label>
          <select
            value={form.assigned_doctor}
            onChange={e => set('assigned_doctor', e.target.value)}
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          >
            {DOCTORS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Diagnosis</label>
          <input
            type="text"
            value={form.diagnosis}
            onChange={e => set('diagnosis', e.target.value)}
            placeholder="Primary diagnosis"
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Contact</label>
          <input
            type="text"
            value={form.contact}
            onChange={e => set('contact', e.target.value)}
            placeholder="+91 XXXXXXXXXX"
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Admission Status</label>
          <select
            value={form.admission_status}
            onChange={e => set('admission_status', e.target.value)}
            className="input-field w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : (isEdit ? 'Update Patient' : 'Add Patient')}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main: Patient Management Dialog ───────────────────────────
export default function PatientManagementDialog({ onClose, addToast }) {
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [searchQ, setSearchQ]     = useState('')
  const [panel, setPanel]         = useState(null) // null | {type: 'edit'|'vitals'|'view', patient}
  const [deleting, setDeleting]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/patients-mgmt/')
      setPatients(res.data.patients || [])
    } catch {
      addToast?.('Could not load patients', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete patient "${p.name}"?`)) return
    setDeleting(p.id)
    try {
      await apiClient.delete(`/patients-mgmt/${p.id}`)
      addToast?.(`${p.name} removed`, 'success')
      load()
    } catch {
      addToast?.('Failed to delete', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = patients.filter(p =>
    !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.assigned_doctor?.toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 dialog-backdrop flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col animate-scale-in"
        style={{ maxWidth: 900, maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <Users size={16} className="text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Patient Management</h2>
              <p className="text-xs text-slate-400">{patients.length} patients · Admin view</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanel({ type: 'edit', patient: null })}
              className="btn-primary flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold"
            >
              <Plus size={13} /> Add Patient
            </button>
            <button
              onClick={load}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Main split view ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Table panel ── */}
          <div className={`flex flex-col ${panel ? 'w-1/2 border-r border-slate-100' : 'w-full'} overflow-hidden`}>
            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search patients, department, doctor..."
                  className="input-field w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-sky-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Users size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Patient</th>
                      <th className="text-left">Dept</th>
                      <th className="text-left hidden md:table-cell">Doctor</th>
                      <th className="text-left">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <tr key={p.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                              <User size={12} className="text-sky-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.age ? `${p.age}y` : '—'} · {p.gender || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600">{p.department || '—'}</span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-xs text-slate-500">{p.assigned_doctor?.replace('Dr. ', '') || '—'}</span>
                        </td>
                        <td>
                          <StatusBadge status={p.admission_status} />
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setPanel({ type: 'view', patient: p })}
                              title="View Details"
                              className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => setPanel({ type: 'edit', patient: p })}
                              title="Edit"
                              className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setPanel({ type: 'vitals', patient: p })}
                              title="Update Vitals"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <Activity size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={deleting === p.id}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                              {deleting === p.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Trash2 size={13} />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Side panel ── */}
          {panel && (
            <div className="w-1/2 overflow-y-auto bg-slate-50/60 animate-slide-in-right">
              {panel.type === 'edit' && (
                <PatientForm
                  patient={panel.patient}
                  onSave={load}
                  onClose={() => setPanel(null)}
                  addToast={addToast}
                />
              )}
              {panel.type === 'vitals' && (
                <VitalsForm
                  patientId={panel.patient.id}
                  patientName={panel.patient.name}
                  existing={panel.patient.vitals}
                  onSave={load}
                  onClose={() => setPanel(null)}
                  addToast={addToast}
                />
              )}
              {panel.type === 'view' && (
                <PatientDetailView
                  patient={panel.patient}
                  onClose={() => setPanel(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: Patient detail view ─────────────────────────
function PatientDetailView({ patient, onClose }) {
  const v = patient.vitals

  const infoRows = [
    { label: 'Age / Gender',        value: `${patient.age || '—'} yrs · ${patient.gender || '—'}` },
    { label: 'Department',          value: patient.department || patient.department_name || '—' },
    { label: 'Assigned Doctor',     value: patient.assigned_doctor || '—' },
    { label: 'Diagnosis',           value: patient.diagnosis || '—' },
    { label: 'Blood Group',         value: patient.blood_group || '—' },
    { label: 'Ward',                value: patient.ward || '—' },
    { label: 'Bed Number',          value: patient.bed_number || '—' },
    { label: 'Contact / Phone',     value: patient.contact || patient.phone || '—' },
    { label: 'Address',             value: patient.address || '—' },
    { label: 'Admission Date',      value: patient.admission_date || (patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-IN') : '—') },
    { label: 'Exp. Discharge',      value: patient.expected_discharge || '—' },
    { label: 'Admission Status',    value: patient.admission_status || patient.status },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
            <User size={18} className="text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{patient.name}</h3>
            <p className="text-xs text-slate-400">Patient #{patient.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Info rows */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
        {infoRows.map(({ label, value }, i) => (
          <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i < infoRows.length - 1 ? 'border-b border-slate-100' : ''}`}>
            <span className="text-xs text-slate-400 font-medium">{label}</span>
            {label === 'Admission Status'
              ? <StatusBadge status={value} />
              : <span className="text-xs font-semibold text-slate-700 text-right max-w-[180px]">{value}</span>
            }
          </div>
        ))}
      </div>

      {/* Vitals */}
      {v && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Latest Vitals</p>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Heart Rate',   value: v.heart_rate,        unit: 'bpm',  color: 'text-red-500' },
              { label: 'Blood Press.', value: v.blood_pressure,    unit: 'mmHg', color: 'text-sky-600' },
              { label: 'Temp.',        value: v.temperature,       unit: '°C',   color: 'text-amber-600' },
              { label: 'SpO₂',         value: v.oxygen_saturation, unit: '%',    color: 'text-emerald-600' },
              { label: 'Resp. Rate',   value: v.respiration_rate,  unit: '/min', color: 'text-violet-600' },
            ].map(({ label, value, unit, color }) => value ? (
              <div key={label} className="text-center p-2 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">{label}</p>
                <p className={`text-base font-black tabular-nums ${color}`}>
                  {value}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
                </p>
              </div>
            ) : null)}
          </div>
          {v.notes && (
            <div className="mt-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
              <p className="text-[10px] font-bold text-sky-600 mb-1">Notes</p>
              <p className="text-xs text-slate-600">{v.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
