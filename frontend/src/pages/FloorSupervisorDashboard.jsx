// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// FloorSupervisorDashboard.jsx — NEW PAGE
// Features: Live bed map, click-to-edit bed status, ward stats,
//           anomaly alerts, staff on duty, real-time refresh
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import {
  BedDouble, AlertTriangle, CheckCircle, RefreshCw,
  LogOut, Activity, Users, Wrench, ChevronDown,
  ChevronUp, Edit3, X, Save, Clock
} from 'lucide-react'
import { staffApi, insightsApi } from '../api/client'
import WorkflowPanel from '../components/WorkflowPanel'
import NurseManagementPanel from '../components/NurseManagementPanel'
import axios from 'axios'

const API = axios.create({ baseURL: '/api', timeout: 10000 })

// ── Status colours ────────────────────────────────────────────
const STATUS_STYLES = {
  occupied:    { bg: 'bg-sky-500',     text: 'text-white',      label: 'Occupied',    dot: 'bg-sky-500'    },
  available:   { bg: 'bg-emerald-400', text: 'text-white',      label: 'Available',   dot: 'bg-emerald-400'},
  maintenance: { bg: 'bg-amber-400',   text: 'text-white',      label: 'Maintenance', dot: 'bg-amber-400'  },
}

const DEPT_COLORS = {
  cardiology      : '#0EA5E9',
  general_medicine: '#10B981',
  orthopedics     : '#F59E0B',
  pediatrics      : '#8B5CF6',
  emergency       : '#EF4444',
  obstetrics      : '#EC4899',
}

// ── Bed Edit Modal ────────────────────────────────────────────
function BedEditModal({ bed, departmentId, onSave, onClose }) {
  const [newStatus, setNewStatus]         = useState(bed.status)
  const [patientId, setPatientId]         = useState(bed.patient_id || '')
  const [patientName, setPatientName]     = useState(bed.patient_name || '')
  const [reason, setReason]               = useState('')
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await API.patch(`/staff/beds/${departmentId}`, {
        bed_id      : bed.bed_id,
        new_status  : newStatus,
        patient_id  : patientId || null,
        patient_name: patientName || null,
        reason      : reason || null,
      })
      onSave({ ...bed, status: newStatus, patient_id: patientId || null, patient_name: patientName || null })
    } catch (err) {
      setSaveError('Failed to save — check backend connection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Edit Bed — {bed.bed_id}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update status and assignment</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Current info */}
        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-slate-400 mb-1">Current</p>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[bed.status]?.dot}`} />
            <span className="font-semibold text-slate-700 text-sm capitalize">{bed.status}</span>
            {bed.patient_name && <span className="text-xs text-slate-500 ml-1">· {bed.patient_name}</span>}
          </div>
        </div>

        {/* New status selector */}
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          New Status
        </label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {['available', 'occupied', 'maintenance'].map(s => (
            <button
              key={s}
              onClick={() => setNewStatus(s)}
              className={`py-2.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                newStatus === s
                  ? s === 'available'   ? 'bg-emerald-500 text-white border-emerald-500'
                  : s === 'occupied'    ? 'bg-sky-500 text-white border-sky-500'
                                        : 'bg-amber-400 text-white border-amber-400'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Conditional fields */}
        {newStatus === 'occupied' && (
          <>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Patient ID (optional)
            </label>
            <input
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              placeholder="e.g. APL-2024-0847"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-sky-400"
            />
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Patient Name
            </label>
            <input
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. Senthil Kumar"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-sky-400"
            />
          </>
        )}

        {newStatus === 'maintenance' && (
          <>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Reason
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Equipment repair, Deep cleaning"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-sky-400"
            />
          </>
        )}

        {newStatus === 'available' && (
          <div className="bg-emerald-50 rounded-xl px-4 py-3 mb-3 text-xs text-emerald-700">
            Marking as available — any current patient assignment will be cleared.
          </div>
        )}

        {saveError && (
          <p className="text-xs text-red-500 mb-3">{saveError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || newStatus === bed.status}
            className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving...' : 'Save Change'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Single Bed Cell ───────────────────────────────────────────
function BedCell({ bed, departmentId, onBedUpdated }) {
  const [showModal, setShowModal] = useState(false)
  const style = STATUS_STYLES[bed.status] || STATUS_STYLES.available

  const handleSave = (updatedBed) => {
    setShowModal(false)
    onBedUpdated(updatedBed)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={`${bed.bed_id} · ${bed.status}${bed.patient_name ? ' · ' + bed.patient_name : ''}`}
        className={`
          w-full aspect-square rounded-lg ${style.bg} ${style.text}
          flex flex-col items-center justify-center
          hover:opacity-80 active:scale-95 transition-all text-center
          group relative overflow-hidden shadow-sm
        `}
      >
        <span className="text-[9px] font-bold leading-none">{bed.bed_id.split('-').slice(-1)[0]}</span>
        {bed.patient_name && (
          <span className="text-[7px] leading-none mt-0.5 opacity-80 truncate px-0.5 w-full text-center">
            {bed.patient_name.split(' ')[0]}
          </span>
        )}
        {bed.status === 'maintenance' && (
          <Wrench size={8} className="mt-0.5 opacity-80" />
        )}
        {/* Edit hint on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <Edit3 size={10} className="text-white" />
        </div>
      </button>

      {showModal && (
        <BedEditModal
          bed={bed}
          departmentId={departmentId}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// ── Ward Section ──────────────────────────────────────────────
function WardSection({ ward, departmentId, onBedUpdated }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors mb-2"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 text-sm">{ward.ward_label}</span>
          <span className="text-xs text-slate-400">{ward.total_beds} beds</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-sky-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              {ward.occupied} occupied
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              {ward.available} free
            </span>
            {ward.maintenance > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {ward.maintenance} maint.
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
          {ward.beds.map(bed => (
            <BedCell
              key={bed.bed_id}
              bed={bed}
              departmentId={departmentId}
              onBedUpdated={onBedUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Department Card ───────────────────────────────────────────
function DepartmentCard({ dept, onBedUpdated }) {
  const [expanded, setExpanded] = useState(false)
  const color = DEPT_COLORS[dept.department_id] || '#64748b'
  const occupancyPct = dept.total_beds > 0
    ? Math.round((dept.occupied_beds / dept.total_beds) * 100)
    : 0
  const totalAvailable = dept.wards?.reduce((acc, w) => acc + w.available, 0) ?? 0
  const totalMaint     = dept.wards?.reduce((acc, w) => acc + w.maintenance, 0) ?? 0

  const barColor = occupancyPct >= 90
    ? 'bg-red-500'
    : occupancyPct >= 80
      ? 'bg-amber-400'
      : 'bg-sky-400'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full" style={{ background: color }} />
            <div>
              <h3 className="font-bold text-slate-800">{dept.department_name}</h3>
              <p className="text-xs text-slate-400">{dept.floor}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <BedDouble size={12} />
            {expanded ? 'Hide Map' : 'Edit Beds'}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center bg-sky-50 rounded-xl py-2">
            <p className="text-lg font-black text-sky-600 tabular-nums">{dept.occupied_beds}</p>
            <p className="text-[10px] text-slate-400">Occupied</p>
          </div>
          <div className="text-center bg-emerald-50 rounded-xl py-2">
            <p className="text-lg font-black text-emerald-600 tabular-nums">{totalAvailable}</p>
            <p className="text-[10px] text-slate-400">Available</p>
          </div>
          <div className="text-center bg-amber-50 rounded-xl py-2">
            <p className="text-lg font-black text-amber-600 tabular-nums">{totalMaint}</p>
            <p className="text-[10px] text-slate-400">Maintenance</p>
          </div>
        </div>

        {/* Occupancy bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Occupancy</span>
            <span className={`font-bold ${occupancyPct >= 90 ? 'text-red-600' : occupancyPct >= 80 ? 'text-amber-600' : 'text-slate-600'}`}>
              {occupancyPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable bed map */}
      {expanded && (
        <div className="px-5 py-4">
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs">
            {Object.entries(STATUS_STYLES).map(([status, style]) => (
              <span key={status} className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className={`w-3 h-3 rounded ${style.bg}`} />
                {style.label}
              </span>
            ))}
            <span className="text-slate-400 ml-auto">Click any bed to edit</span>
          </div>

          {dept.wards?.map(ward => (
            <WardSection
              key={ward.ward_id}
              ward={ward}
              departmentId={dept.department_id}
              onBedUpdated={onBedUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}


// ── Main Floor Supervisor Dashboard ──────────────────────────
export default function FloorSupervisorDashboard({ onLogout }) {

  const [bedData, setBedData]         = useState(null)
  const [anomalies, setAnomalies]     = useState([])
  const [staffOnDuty, setStaffOnDuty] = useState([])
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadData = useCallback(async () => {
    try {
      setFetchError(null)
      const [bedsRes, anomaliesRes, staffRes] = await Promise.all([
        API.get('/staff/beds/all'),
        insightsApi.getAnomalies(),
        staffApi.getOnDuty(),
      ])
      setBedData(bedsRes.data)
      setAnomalies(anomaliesRes.data.anomalies || [])
      setStaffOnDuty(staffRes.data.staff || [])
      setLastRefresh(new Date())
    } catch (err) {
      setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 30000)
    return () => clearInterval(timer)
  }, [loadData])

  // Optimistic update — update local state after bed edit
  const handleBedUpdated = useCallback((updatedBed, departmentId) => {
    setBedData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        departments: prev.departments.map(dept => {
          if (dept.department_id !== departmentId) return dept
          return {
            ...dept,
            wards: dept.wards.map(ward => ({
              ...ward,
              beds: ward.beds.map(bed =>
                bed.bed_id === updatedBed.bed_id ? updatedBed : bed
              ),
              occupied:    ward.beds.filter(b => b.bed_id === updatedBed.bed_id ? updatedBed.status === 'occupied'    : b.status === 'occupied').length,
              available:   ward.beds.filter(b => b.bed_id === updatedBed.bed_id ? updatedBed.status === 'available'   : b.status === 'available').length,
              maintenance: ward.beds.filter(b => b.bed_id === updatedBed.bed_id ? updatedBed.status === 'maintenance' : b.status === 'maintenance').length,
            }))
          }
        })
      }
    })
    // Refresh full data after a moment to keep counts accurate
    setTimeout(loadData, 1000)
  }, [loadData])

  // ── Derived totals ────────────────────────────────────────
  const totalBeds      = bedData?.departments?.reduce((a, d) => a + d.total_beds, 0) ?? 0
  const totalOccupied  = bedData?.departments?.reduce((a, d) => a + d.occupied_beds, 0) ?? 0
  const totalAvailable = totalBeds - totalOccupied
  const overallPct     = totalBeds > 0 ? Math.round(totalOccupied / totalBeds * 100) : 0
  const criticalAlerts = anomalies.filter(a => a.severity === 'critical')

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <BedDouble size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">PrimeCare</span>
              <span className="text-slate-400 text-sm"> · Floor Supervisor</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {criticalAlerts.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={11} />
              {lastRefresh.toLocaleTimeString()}
            </div>
            <button onClick={loadData} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-slate-50 transition-all">
              <RefreshCw size={14} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <Users size={14} className="text-teal-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">Ms. Kavitha Rajan</p>
                <p className="text-xs text-slate-400">Floor Supervisor</p>
              </div>
              <button onClick={onLogout} className="ml-2 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">

        {/* Offline banner */}
        {fetchError && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Backend offline</p>
              <p className="text-xs text-amber-600 mt-0.5">Run: <code className="bg-amber-100 px-1 rounded">uvicorn main:app --reload --port 8000</code></p>
            </div>
            <button onClick={loadData} className="ml-auto px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 border border-amber-300 shrink-0">Retry</button>
          </div>
        )}

        {/* ── Hospital-wide summary ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Beds',    value: totalBeds,      color: 'text-slate-800', bg: 'bg-white' },
            { label: 'Occupied',      value: totalOccupied,  color: 'text-sky-600',   bg: 'bg-sky-50' },
            { label: 'Available',     value: totalAvailable, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Occupancy',     value: `${overallPct}%`, color: overallPct >= 90 ? 'text-red-600' : overallPct >= 80 ? 'text-amber-600' : 'text-slate-700', bg: 'bg-white' },
          ].map(tile => (
            <div key={tile.label} className={`${tile.bg} rounded-2xl border border-slate-200 shadow-sm px-5 py-4`}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{tile.label}</p>
              <p className={`text-3xl font-black tabular-nums ${tile.color}`}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* ── Active Alerts ── */}
        {anomalies.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              Active Alerts
            </h2>
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((a, i) => (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                    a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.department_name}</p>
                    <p className="text-xs text-slate-600">{a.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.suggested_action}</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{a.severity}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Department Bed Maps ── */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <BedDouble size={14} className="text-sky-500" />
            Department Bed Maps
            <span className="text-xs text-slate-400 font-normal ml-1">— Click any bed to edit status</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bedData?.departments?.map(dept => (
              <DepartmentCard
                key={dept.department_id}
                dept={dept}
                onBedUpdated={(bed) => handleBedUpdated(bed, dept.department_id)}
              />
            ))}
          </div>
        </section>

        {/* ── Staff on Duty ── */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Users size={14} className="text-violet-500" />
            Staff On Duty ({staffOnDuty.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {staffOnDuty.map((s, i) => (
                <div key={s.staff_id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    s.role === 'doctor' ? 'bg-sky-100 text-sky-700'
                    : s.role === 'nurse' ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.designation} · {s.department}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500 font-medium">{s.shift_time}</p>
                    <span className="text-xs font-bold text-emerald-600">● On Duty</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Nurse Management ── */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Users size={14} className="text-violet-500" />
            Nurse Management
          </h2>
          <NurseManagementPanel />
        </section>

        {/* ── Patient Workflow ── */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Users size={14} className="text-sky-500" />
            Patient Workflow
          </h2>
          <WorkflowPanel role="floor_supervisor" />
        </section>

      </main>
    </div>
  )
}
