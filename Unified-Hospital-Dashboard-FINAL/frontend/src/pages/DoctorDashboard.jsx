// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// DoctorDashboard.jsx — My Patients, OPD Stats,
//   Critical Alerts, Today's Schedule
// Demo: Dr. Ramesh Iyer · Cardiology (DOC001)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
    Stethoscope, Heart, Activity, Clock,
    AlertTriangle, RefreshCw, LogOut, CheckCircle,
    Users, ChevronRight, Pill, FlaskConical,
    BedDouble, Calendar, Phone, User,
    TrendingUp, TrendingDown, Minus, Zap,
    Brain, Sparkles, X, FileText, ShieldAlert, Target, BarChart3
} from 'lucide-react'
import { staffApi, analyticsApi, insightsApi, patientApi } from '../api/client'
import WorkflowPanel from '../components/WorkflowPanel'
import { NotificationsBell } from '../components/WorkflowPanel'

// ─── Demo doctor ──────────────────────────────────────────────
const DEMO_DOCTOR_ID   = 'DOC001'
const DEMO_DOCTOR_NAME = 'Dr. Ramesh Iyer'
const DEMO_DEPT_ID     = 'cardiology'

// ─── Sidebar sections ─────────────────────────────────────────
const SIDEBAR_SECTIONS = [
    { sectionId: 'patients',    label: 'My Patients',     Icon: Users         },
    { sectionId: 'ai-insights', label: 'AI Insights',     Icon: Brain         },
    { sectionId: 'opd',         label: 'OPD Stats',       Icon: Activity      },
    { sectionId: 'alerts',      label: 'Critical Alerts', Icon: AlertTriangle },
    { sectionId: 'schedule',    label: 'My Schedule',     Icon: Calendar      },
    { sectionId: 'workflow',    label: 'Workflow',        Icon: Stethoscope   },
]

// ─── Today's schedule (simulated) ────────────────────────────
const TODAY_SCHEDULE = [
    { time: '08:00 AM', event: 'Morning Ward Rounds',         type: 'round',   done: true  },
    { time: '09:30 AM', event: 'OPD Consultation (24 slots)', type: 'opd',     done: true  },
    { time: '11:30 AM', event: 'Cath Lab — Angioplasty',      type: 'surgery', done: true  },
    { time: '01:00 PM', event: 'Lunch Break',                 type: 'break',   done: true  },
    { time: '02:00 PM', event: 'ICU Review — 7 patients',    type: 'review',  done: false },
    { time: '03:30 PM', event: 'Case Discussion (Cardiology)',type: 'meeting', done: false },
    { time: '05:00 PM', event: 'Evening Ward Rounds',         type: 'round',   done: false },
]


// ─── Helper : Section wrapper ─────────────────────────────────

function DoctorSection({ sectionId, title, subtitle, badge, children }) {
    return (
        <section id={sectionId} className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {badge}
            </div>
            {children}
        </section>
    )
}


// ─── Helper : Patient Card ────────────────────────────────────

function PatientCard({ patient, cardIndex, onAiReport }) {
    const [expanded, setExpanded] = useState(false)

    const latestVital = patient.vitals?.[0] || {}
    const isCritical  = patient.is_critical

    const statusStyle = isCritical
        ? 'border-l-red-500 bg-red-50/30'
        : 'border-l-sky-400 bg-white'

    return (
        <div
            className={`rounded-2xl border border-slate-200 border-l-4 ${statusStyle} shadow-sm hover:shadow-md transition-all animate-slide-up overflow-hidden`}
            style={{ animationDelay: `${cardIndex * 0.08}s` }}
        >
            {/* Main info row */}
            <div className="p-5">
                <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-100' : 'bg-sky-100'}`}>
                        <User size={22} className={isCritical ? 'text-red-500' : 'text-sky-500'} />
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-800">{patient.name}</h3>
                            <span className="text-xs text-slate-400">
                                {patient.age} yrs · {patient.gender} · {patient.blood_group}
                            </span>
                            {isCritical && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                    ⚠ Critical
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-sky-700">{patient.diagnosis}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><BedDouble size={11}/> {patient.bed_number} · {patient.ward}</span>
                            <span className="flex items-center gap-1"><Calendar size={11}/> Admitted: {patient.admission_date}</span>
                            <span className="flex items-center gap-1"><Calendar size={11}/> Discharge: {patient.expected_discharge}</span>
                        </div>
                    </div>

                    {/* Latest vitals strip */}
                    {latestVital.blood_pressure && (
                        <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-1 text-right shrink-0">
                            <MiniVital label="BP"    value={latestVital.blood_pressure} />
                            <MiniVital label="Pulse" value={`${latestVital.pulse_bpm} bpm`} />
                            <MiniVital label="SpO₂"  value={`${latestVital.spo2_pct}%`} />
                            <MiniVital label="Temp"  value={`${latestVital.temperature_f}°F`} />
                        </div>
                    )}

                    {/* AI Report button */}
                    {onAiReport && (
                        <button
                            onClick={() => onAiReport(patient.patient_id)}
                            className="shrink-0 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                            <Sparkles size={12} /> AI Report
                        </button>
                    )}

                    {/* Expand */}
                    <button
                        onClick={() => setExpanded(prev => !prev)}
                        className="shrink-0 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"
                    >
                        <ChevronRight size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Expanded: prescriptions summary */}
            {expanded && patient.prescriptions?.[0] && (
                <div className="border-t border-slate-100 bg-sky-50/40 px-5 py-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Active Prescriptions · {patient.prescriptions[0].doctor_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {patient.prescriptions[0].medications.map((med, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-sky-200 text-sky-700 font-semibold"
                            >
                                <Pill size={10} /> {med.name} {med.dose}
                            </span>
                        ))}
                    </div>
                    {patient.prescriptions[0].notes && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                            📝 {patient.prescriptions[0].notes}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}


// ─── Helper : Mini vital (used inside patient card) ───────────

function MiniVital({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xs font-black text-slate-700 tabular-nums">{value}</p>
        </div>
    )
}


// ─── Helper : OPD Gauge ───────────────────────────────────────

function OpdGauge({ current, baseline }) {
    const pct   = Math.min(Math.round((current / 60) * 100), 100)
    const color = current > 30 ? '#EF4444' : current > 20 ? '#F59E0B' : '#0EA5E9'
    const track = current > 30 ? '#FEE2E2' : current > 20 ? '#FEF3C7' : '#E0F2FE'
    const label = current > 30 ? 'High' : current > 20 ? 'Moderate' : 'Normal'

    const radius = 44
    const cx = 56, cy = 56
    const startDeg = -210, endDeg = 30
    const arc = endDeg - startDeg
    const filled = (pct / 100) * arc
    const toRad  = d => (d * Math.PI) / 180
    const pt = (deg, r) => ({ x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) })
    const arcD = (s, e, r) => {
        const sp = pt(s, r), ep = pt(e, r)
        return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`
    }

    return (
        <div className="flex flex-col items-center">
            <svg width="112" height="80" viewBox="0 0 112 80">
                <path d={arcD(startDeg, endDeg, radius)} fill="none" stroke={track} strokeWidth="9" strokeLinecap="round" />
                <path d={arcD(startDeg, startDeg + filled, radius)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
                <text x="56" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill={color} fontFamily="DM Sans">{current}</text>
                <text x="56" y="70" textAnchor="middle" fontSize="9"  fill="#94A3B8" fontFamily="DM Sans">min</text>
            </svg>
            <span className="text-xs font-bold mt-1" style={{ color }}>{label}</span>
            <span className="text-xs text-slate-400 mt-0.5">Baseline: {baseline} min</span>
        </div>
    )
}


// ─── Helper : Schedule Item ───────────────────────────────────

function ScheduleItem({ item, itemIndex }) {
    const typeStyle = {
        round:   { dot: 'bg-sky-400',    badge: 'bg-sky-100 text-sky-700 border-sky-200'       },
        opd:     { dot: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
        surgery: { dot: 'bg-red-400',   badge: 'bg-red-100 text-red-700 border-red-200'        },
        review:  { dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200'  },
        meeting: { dot: 'bg-emerald-400',badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'},
        break:   { dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500 border-slate-200'  },
    }

    const style = typeStyle[item.type] || typeStyle.break

    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all animate-slide-up ${
                item.done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:shadow-sm'
            }`}
            style={{ animationDelay: `${itemIndex * 0.05}s` }}
        >
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-3 h-3 rounded-full ${item.done ? 'bg-slate-300' : style.dot}`} />
            </div>

            {/* Time */}
            <p className={`text-sm font-black tabular-nums w-20 shrink-0 ${item.done ? 'text-slate-400' : 'text-slate-700'}`}>
                {item.time}
            </p>

            {/* Event */}
            <p className={`flex-1 text-sm font-medium ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {item.event}
            </p>

            {/* Type badge */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize shrink-0 ${
                item.done ? 'bg-slate-100 text-slate-400 border-slate-200' : style.badge
            }`}>
                {item.done ? 'Done' : item.type}
            </span>
        </div>
    )
}


// ─── Main Doctor Dashboard ─────────────────────────────────────

export default function DoctorDashboard({ onLogout }) {

    // ── State ──────────────────────────────────────────────────
    const [doctorData,  setDoctorData]  = useState(null)
    const [patientList, setPatientList] = useState([])
    const [deptData,    setDeptData]    = useState(null)
    const [anomalyList, setAnomalyList] = useState([])
    const [isLoading,   setIsLoading]   = useState(true)
    const [fetchError,  setFetchError]  = useState(null)
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [activeSection, setActiveSection] = useState('patients')

    // AI Agent state
    const [aiAnalysis,    setAiAnalysis]    = useState(null)
    const [aiReportData,  setAiReportData]  = useState(null)
    const [aiReportOpen,  setAiReportOpen]  = useState(false)
    const [aiReportLoading, setAiReportLoading] = useState(false)


    // ── Data fetching ──────────────────────────────────────────
    const loadData = async () => {
        try {
            setFetchError(null)

            const [doctorRes, deptRes, anomaliesRes, allPatientsRes, aiRes] = await Promise.all([
                staffApi.getById(DEMO_DOCTOR_ID),
                analyticsApi.getDepartment(DEMO_DEPT_ID),
                insightsApi.getAnomalies(),
                patientApi.getAll(),
                (insightsApi.getAIAgentAnalysis ? insightsApi.getAIAgentAnalysis() : Promise.resolve(null)).catch(() => null),

            ])

            const doctor = doctorRes.data
            setDoctorData(doctor)
            setDeptData(deptRes.data)

            // Filter anomalies for this department
            const deptAnomalies = (anomaliesRes.data.anomalies || [])
                .filter(a => a.department_id === DEMO_DEPT_ID)
            setAnomalyList(deptAnomalies)

            // Get patients assigned to this doctor
            const assignedIds  = doctor.patients_assigned || []
            const allPatients  = allPatientsRes.data.patients || []
            const myPatients   = allPatients.filter(p => assignedIds.includes(p.patient_id))
            setPatientList(myPatients)

            // AI Analysis
            if (aiRes?.data?.analysis) setAiAnalysis(aiRes.data.analysis)

            setLastRefresh(new Date())

        } catch (err) {
            setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
        } finally {
            setIsLoading(false)
        }
    }

    const openAiReport = async (patientId) => {
        setAiReportLoading(true)
        setAiReportOpen(true)
        try {
            const res = await patientApi.getAIReport(patientId)
            setAiReportData(res.data?.report || res.data)
        } catch { setAiReportData(null) }
        finally { setAiReportLoading(false) }
    }

    useEffect(() => {
        loadData()
        const timer = setInterval(loadData, 30000)
        return () => clearInterval(timer)
    }, [])


    // ── Scroll spy ─────────────────────────────────────────────
    useEffect(() => {
        if (!doctorData) return

        const NAVBAR_HEIGHT = 56
        const OFFSET = 80

        const handleScroll = () => {
            let active = SIDEBAR_SECTIONS[0].sectionId
            for (const { sectionId } of SIDEBAR_SECTIONS) {
                const el = document.getElementById(sectionId)
                if (!el) continue
                const top = el.getBoundingClientRect().top
                if (top <= NAVBAR_HEIGHT + OFFSET) active = sectionId
            }
            setActiveSection(active)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [doctorData])

    // ── Scroll to section on sidebar click ─────────────────────
    const scrollTo = (id) => {
        const el = document.getElementById(id)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top, behavior: 'smooth' })
        setActiveSection(id)
    }


    // ── Loading ────────────────────────────────────────────────
    // ── Derived values ─────────────────────────────────────────
    const dept          = deptData || {}
    const criticalPts   = patientList.filter(p => p.is_critical)
    const tasksDone     = TODAY_SCHEDULE.filter(t => t.done).length
    const tasksTotal    = TODAY_SCHEDULE.length
    const nextTask      = TODAY_SCHEDULE.find(t => !t.done)
    const deptAnomalies = anomalyList  // already dept-filtered


    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* ── Navbar ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                            <Stethoscope size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm">PrimeCare Hospital</span>
                            <span className="text-slate-400 text-sm"> · Doctor Dashboard</span>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">

                        {/* Critical patient badge */}
                        {criticalPts.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                {criticalPts.length} Critical
                            </span>
                        )}

                        {/* Next task hint */}
                        {nextTask && (
                            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
                                <Zap size={11} /> Next: {nextTask.time} — {nextTask.event.split('(')[0].trim()}
                            </span>
                        )}

                        {/* Live indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            {lastRefresh.toLocaleTimeString()}
                        </div>

                        {/* Notifications */}
                        <NotificationsBell role="doctor" />

                        {/* Refresh */}
                        <button onClick={loadData} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all">
                            <RefreshCw size={14} />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                <Stethoscope size={14} className="text-sky-600" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-slate-700">{DEMO_DOCTOR_NAME}</p>
                                <p className="text-xs text-slate-400">Cardiology · {doctorData?.shift} shift</p>
                            </div>
                            <button onClick={onLogout} className="ml-2 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <LogOut size={14} />
                            </button>
                        </div>

                    </div>
                </div>
            </header>


            {/* ── Body ── */}
            <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

                {/* ── Sidebar ── */}
                <aside className="w-52 shrink-0 bg-white border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 hidden lg:block">
                    <nav className="px-3 space-y-1">
                        {SIDEBAR_SECTIONS.map(({ sectionId, label, Icon }) => (
                            <button
                                key={sectionId}
                                onClick={() => scrollTo(sectionId)}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                                    ${activeSection === sectionId
                                        ? 'bg-sky-50 text-sky-600 border border-sky-100'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Quick stats in sidebar */}
                    <div className="mx-3 mt-6 space-y-2">
                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                            <p className="text-xs font-bold text-sky-700 mb-0.5">My Patients</p>
                            <p className="text-2xl font-black text-sky-600">{patientList.length}</p>
                            <p className="text-xs text-sky-500">{dept.department_name || 'Cardiology'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-600 mb-0.5">Today's Tasks</p>
                            <p className="text-2xl font-black text-slate-700">{tasksDone}<span className="text-sm font-normal text-slate-400">/{tasksTotal}</span></p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </aside>


                {/* ── Main content ── */}
                <main className="flex-1 px-6 py-6">

                    {/* Status banners */}
                    {isLoading && (
                        <div className="mb-6 flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3">
                            <RefreshCw size={14} className="text-sky-500 animate-spin shrink-0" />
                            <p className="text-sm font-semibold text-sky-700">Loading patient data...</p>
                        </div>
                    )}
                    {fetchError && !isLoading && (
                        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Backend offline</p>
                                <p className="text-xs text-amber-600 mt-0.5">Run: <code className="bg-amber-100 px-1 rounded">uvicorn main:app --reload --port 8000</code></p>
                            </div>
                            <button onClick={loadData} className="ml-auto px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 border border-amber-300 shrink-0">Retry</button>
                        </div>
                    )}

                    {/* ── Section 1 : My Patients ── */}
                    <DoctorSection
                        sectionId="patients"
                        title="My Patients"
                        subtitle="Assigned patients requiring your care today"
                        badge={
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200">
                                <Users size={12} /> {patientList.length} assigned
                            </span>
                        }
                    >
                        {patientList.length === 0 ? (
                            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-8 text-center">
                                <CheckCircle size={28} className="text-sky-400 mx-auto mb-2" />
                                <p className="font-semibold text-sky-700">No patients assigned</p>
                                <p className="text-xs text-sky-500 mt-1">You have no active inpatients at this time</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {patientList.map((patient, idx) => (
                                    <PatientCard key={patient.patient_id} patient={patient} cardIndex={idx} onAiReport={openAiReport} />
                                ))}
                            </div>
                        )}
                    </DoctorSection>

                    {/* ── Workflow Panel ── */}
                    <DoctorSection
                        sectionId="workflow"
                        title="Patient Workflow"
                        subtitle="Record vitals, diagnose, prescribe medications"
                    >
                        <WorkflowPanel role="doctor" />
                    </DoctorSection>


                    {/* ── Section: AI Insights ── */}
                    <DoctorSection
                        sectionId="ai-insights"
                        title="AI Agent Insights"
                        subtitle="Real-time anomaly detection, KPI analysis & predictions"
                        badge={
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
                                <Brain size={12} /> AI-Powered
                            </span>
                        }
                    >
                        {aiAnalysis ? (
                            <div className="space-y-4">
                                {/* AI Summary */}
                                <div className="bg-gradient-to-br from-violet-50 to-sky-50 rounded-2xl border border-violet-200 p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                            <Sparkles size={16} className="text-violet-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">AI Analysis Summary</p>
                                            <p className="text-xs text-slate-400">Generated by GKM_8 Intelligence Agent</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{aiAnalysis.ai_summary}</p>
                                </div>

                                {/* KPI + Health Score row */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <AiKpiTile label="Health Score" value={`${aiAnalysis.health_score?.score}/100`} sub={aiAnalysis.health_score?.label} color={aiAnalysis.health_score?.score >= 70 ? 'emerald' : 'red'} icon={<Target size={18} />} />
                                    <AiKpiTile label="Bed Occupancy" value={`${aiAnalysis.kpi_summary?.bed_occupancy_pct}%`} sub={`${aiAnalysis.kpi_summary?.occupied_beds}/${aiAnalysis.kpi_summary?.total_beds}`} color="sky" icon={<BedDouble size={18} />} />
                                    <AiKpiTile label="Anomalies" value={aiAnalysis.anomaly_count} sub={`${aiAnalysis.critical_anomalies} critical`} color={aiAnalysis.critical_anomalies > 0 ? 'red' : 'emerald'} icon={<ShieldAlert size={18} />} />
                                    <AiKpiTile label="Predictions" value={aiAnalysis.prediction_count} sub="breach warnings" color={aiAnalysis.prediction_count > 0 ? 'amber' : 'emerald'} icon={<BarChart3 size={18} />} />
                                </div>

                                {/* Anomalies list */}
                                {aiAnalysis.anomalies?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Detected Anomalies</p>
                                        <div className="space-y-2">
                                            {aiAnalysis.anomalies.slice(0, 4).map((a, i) => (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${a.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                                                    <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-700">{a.kpi_name?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                                                        <p className="text-xs text-slate-500 truncate">{a.insight}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.severity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Predictions */}
                                {aiAnalysis.predictions?.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Breach Predictions (next 48h)</p>
                                        <div className="space-y-2">
                                            {aiAnalysis.predictions.slice(0, 3).map((p, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50">
                                                    <BarChart3 size={14} className="text-sky-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-700">{p.alert_message?.substring(2, 80)}...</p>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">~{Math.round(p.hours_to_breach)}h</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-8 text-center">
                                <Brain size={28} className="text-violet-400 mx-auto mb-2" />
                                <p className="font-semibold text-violet-700">Loading AI analysis...</p>
                            </div>
                        )}
                    </DoctorSection>


                    {/* ── Section 2 : OPD Stats ── */}
                    <DoctorSection
                        sectionId="opd"
                        title="OPD Stats"
                        subtitle={`${dept.name || 'Cardiology'} department — live metrics`}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* OPD wait gauge */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">OPD Wait Time</p>
                                <OpdGauge
                                    current={dept.opd_wait_time_min || 0}
                                    baseline={dept.opd_baseline_wait_min || 0}
                                />
                            </div>

                            {/* OPD stat tiles */}
                            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                                <OpdTile icon={<Users size={20} className="text-sky-500" />}     bg="bg-sky-100"    label="OPD Patients Today" value={dept.opd_patients_today}    unit="patients"    />
                                <OpdTile icon={<BedDouble size={20} className="text-violet-500" />} bg="bg-violet-100" label="Bed Occupancy"       value={`${dept.bed_occupancy_pct || Math.round((dept.occupied_beds / dept.total_beds) * 100)}%`} unit={`${dept.occupied_beds}/${dept.total_beds} beds`} />
                                <OpdTile icon={<Heart size={20} className="text-red-500" />}      bg="bg-red-100"    label="Critical Patients"   value={dept.critical_patients}   unit="monitoring"  />
                                <OpdTile icon={<Activity size={20} className="text-emerald-500" />} bg="bg-emerald-100" label="Avg Stay"           value={dept.avg_length_of_stay} unit="days avg"    />
                            </div>

                        </div>
                    </DoctorSection>


                    {/* ── Section 3 : Critical Alerts ── */}
                    <DoctorSection
                        sectionId="alerts"
                        title="Critical Alerts"
                        subtitle="Department anomalies and patients requiring attention"
                        badge={
                            (deptAnomalies.length > 0 || criticalPts.length > 0)
                                ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                    {deptAnomalies.length + criticalPts.length} active
                                  </span>
                                : null
                        }
                    >
                        {deptAnomalies.length === 0 && criticalPts.length === 0 ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                                <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-emerald-700">No active alerts</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Dept anomaly alerts */}
                                {deptAnomalies.map((anomaly, idx) => (
                                    <div
                                        key={anomaly.anomaly_id}
                                        className={`rounded-2xl border p-4 animate-slide-up ${
                                            anomaly.severity === 'critical'
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-amber-200 bg-amber-50'
                                        }`}
                                        style={{ animationDelay: `${idx * 0.06}s` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${anomaly.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                                <AlertTriangle size={16} className={anomaly.severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-800 text-sm">{anomaly.metric}</p>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${anomaly.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {anomaly.severity}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">{anomaly.message}</p>
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <ChevronRight size={11} className="text-sky-400" />
                                                    {anomaly.suggested_action}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-slate-400">Current</p>
                                                <p className="text-lg font-black text-slate-700">{anomaly.current_value}</p>
                                                <p className="text-xs text-rose-500 font-semibold">+{anomaly.deviation_pct}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Critical patients */}
                                {criticalPts.map((pt, idx) => (
                                    <div
                                        key={pt.patient_id}
                                        className="rounded-2xl border border-red-200 bg-red-50 p-4 animate-slide-up"
                                        style={{ animationDelay: `${(deptAnomalies.length + idx) * 0.06}s` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                                <Heart size={16} className="text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-sm">{pt.name} <span className="text-xs text-slate-400 font-normal">· {pt.patient_id}</span></p>
                                                <p className="text-sm text-slate-600">{pt.diagnosis}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{pt.bed_number} · {pt.ward}</p>
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0">
                                                ⚠ Critical
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DoctorSection>


                    {/* ── Section 4 : Schedule ── */}
                    <DoctorSection
                        sectionId="schedule"
                        title="Today's Schedule"
                        subtitle={`${tasksDone} of ${tasksTotal} tasks completed`}
                        badge={
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                tasksDone === tasksTotal
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-sky-100 text-sky-700 border-sky-200'
                            }`}>
                                {Math.round((tasksDone / tasksTotal) * 100)}% done
                            </span>
                        }
                    >
                        {/* Timeline progress bar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Day Progress</span>
                                <span className="font-black text-slate-700">{tasksDone}/{tasksTotal}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-sky-400 rounded-full transition-all duration-700"
                                    style={{ width: `${(tasksDone / tasksTotal) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {TODAY_SCHEDULE.map((item, idx) => (
                                <ScheduleItem key={idx} item={item} itemIndex={idx} />
                            ))}
                        </div>
                    </DoctorSection>


                </main>
            </div>

            {/* ── AI Report Modal ── */}
            {aiReportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAiReportOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center"><FileText size={16} className="text-violet-500" /></div>
                                <div>
                                    <p className="font-bold text-slate-800">AI Patient Report</p>
                                    <p className="text-xs text-slate-400">{aiReportData?.patient_name || 'Loading...'}</p>
                                </div>
                            </div>
                            <button onClick={() => setAiReportOpen(false)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={16} /></button>
                        </div>

                        {aiReportLoading ? (
                            <div className="p-12 text-center"><RefreshCw size={24} className="text-violet-400 animate-spin mx-auto mb-3" /><p className="text-sm text-slate-500">Generating AI report...</p></div>
                        ) : aiReportData ? (
                            <div className="p-6 space-y-5">
                                {/* AI Summary */}
                                <div className="bg-gradient-to-br from-violet-50 to-sky-50 rounded-xl border border-violet-200 p-4">
                                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">AI Clinical Summary</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{aiReportData.ai_summary}</p>
                                </div>

                                {/* Risk Score */}
                                <div className="bg-white rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Risk Assessment</p>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black ${
                                            aiReportData.risk_score?.level === 'critical' ? 'bg-red-100 text-red-600' :
                                            aiReportData.risk_score?.level === 'elevated' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>{aiReportData.risk_score?.score}</div>
                                        <div>
                                            <p className="font-bold text-slate-800">{aiReportData.risk_score?.label}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Score {aiReportData.risk_score?.score}/100</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-xs text-slate-400">Prognosis</p>
                                            <p className="text-sm font-bold text-slate-700 capitalize">{aiReportData.predictions?.prognosis}</p>
                                        </div>
                                    </div>
                                    {aiReportData.risk_score?.factors?.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {aiReportData.risk_score.factors.slice(0, 4).map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${f.impact === 'critical' || f.impact === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                                    {f.factor}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Vitals Analysis */}
                                <div className="bg-white rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Vitals Analysis</p>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {['blood_pressure', 'pulse_bpm', 'spo2_pct', 'temperature_f'].map(k => (
                                            <div key={k} className="p-2 bg-slate-50 rounded-lg">
                                                <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</p>
                                                <p className="text-sm font-black text-slate-700">{aiReportData.vitals_analysis?.latest?.[k] ?? 'N/A'}{k === 'spo2_pct' ? '%' : k === 'temperature_f' ? '°F' : k === 'pulse_bpm' ? ' bpm' : ''}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">Trend: <span className="font-bold capitalize">{aiReportData.vitals_analysis?.trend}</span></p>
                                    {aiReportData.vitals_analysis?.flags?.map((f, i) => (
                                        <div key={i} className={`mt-2 text-xs p-2 rounded-lg border ${f.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                            ⚠ {f.message}
                                        </div>
                                    ))}
                                </div>

                                {/* Lab Anomalies */}
                                {aiReportData.lab_anomalies?.length > 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Lab Anomalies ({aiReportData.lab_anomaly_count})</p>
                                        <div className="space-y-2">
                                            {aiReportData.lab_anomalies.map((a, i) => (
                                                <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${a.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{a.parameter}</p>
                                                        <p className="text-xs text-slate-500">{a.test_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-slate-700">{a.value} {a.unit}</p>
                                                        <p className="text-xs text-slate-400">Ref: {a.reference}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Predictions */}
                                <div className="bg-white rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Recovery Prediction</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">Progress</p><p className="text-lg font-black text-sky-600">{aiReportData.predictions?.progress_pct}%</p></div>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">Days Left</p><p className="text-lg font-black text-slate-700">{aiReportData.predictions?.days_remaining_adjusted}</p></div>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">Trajectory</p><p className="text-sm font-bold text-slate-700 capitalize">{aiReportData.predictions?.recovery_trajectory}</p></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Predicted discharge: <span className="font-bold">{aiReportData.predictions?.predicted_discharge}</span> (confidence: {aiReportData.predictions?.discharge_confidence})</p>
                                </div>

                                <p className="text-xs text-slate-400 text-center">Generated by {aiReportData.agent} at {new Date(aiReportData.generated_at).toLocaleString()}</p>
                            </div>
                        ) : (
                            <div className="p-12 text-center"><AlertTriangle size={24} className="text-red-400 mx-auto mb-3" /><p className="text-sm text-red-500">Failed to generate report</p></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}


// ─── Micro-helpers ─────────────────────────────────────────────

function OpdTile({ icon, bg, label, value, unit }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-xl font-black text-slate-800 tabular-nums">{value}</p>
                {unit && <p className="text-xs text-slate-400">{unit}</p>}
            </div>
        </div>
    )
}

function AiKpiTile({ label, value, sub, color, icon }) {
    const colorMap = {
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        red:     'bg-red-50 border-red-200 text-red-600',
        sky:     'bg-sky-50 border-sky-200 text-sky-600',
        amber:   'bg-amber-50 border-amber-200 text-amber-600',
        violet:  'bg-violet-50 border-violet-200 text-violet-600',
    }
    const cls = colorMap[color] || colorMap.sky
    return (
        <div className={`rounded-2xl border p-4 ${cls}`}>
            <div className="flex items-center gap-2 mb-1 opacity-70">{icon}<span className="text-xs font-bold uppercase tracking-wide">{label}</span></div>
            <p className="text-2xl font-black tabular-nums">{value}</p>
            {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
    )
}
