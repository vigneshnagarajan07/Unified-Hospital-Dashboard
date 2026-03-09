// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// DepartmentHeadDashboard.jsx — Dept KPIs, Staff Roster,
//   Anomalies, Surgery Schedule (scoped to one department)
// Demo: General Medicine — Dr. Priya Subramaniam
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
    Building2, BedDouble, Clock, Star,
    Scissors, Users, AlertTriangle, RefreshCw,
    LogOut, CheckCircle, Circle, Activity,
    Phone, ChevronRight, UserCheck, UserX,
    Stethoscope, Heart
} from 'lucide-react'
import { analyticsApi, insightsApi, staffApi } from '../api/client'

// ─── Demo department ──────────────────────────────────────────
const DEMO_DEPT_ID   = 'general_medicine'
const DEMO_DEPT_HEAD = 'Dr. Priya Subramaniam'

// ─── Sidebar sections ─────────────────────────────────────────
const SIDEBAR_SECTIONS = [
    { sectionId: 'overview',  label: 'Overview',    Icon: Building2    },
    { sectionId: 'kpis',      label: 'Dept KPIs',   Icon: Activity     },
    { sectionId: 'staff',     label: 'Staff Roster', Icon: Users        },
    { sectionId: 'anomalies', label: 'Anomalies',    Icon: AlertTriangle },
    { sectionId: 'surgery',   label: 'Surgery',      Icon: Scissors     },
]


// ─── Helper : Section wrapper ─────────────────────────────────

function DeptSection({ sectionId, title, subtitle, badge, children }) {
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


// ─── Helper : KPI Tile ────────────────────────────────────────

function KpiTile({ Icon, iconBg, iconColor, label, value, unit, subtext, statusColor, tileIndex }) {
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all animate-slide-up`}
            style={{ animationDelay: `${tileIndex * 0.07}s` }}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={22} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black tabular-nums ${statusColor}`}>{value}</span>
                    {unit && <span className="text-xs text-slate-400">{unit}</span>}
                </div>
                {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
            </div>
        </div>
    )
}


// ─── Helper : Staff Row ───────────────────────────────────────

function StaffRow({ staff, rowIndex }) {
    const isDoctor  = staff.role === 'doctor'
    const roleStyle = isDoctor
        ? { dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 border-violet-200', icon: 'text-violet-500' }
        : { dot: 'bg-sky-400',    badge: 'bg-sky-100 text-sky-700 border-sky-200',          icon: 'text-sky-500' }

    return (
        <tr
            className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors animate-slide-up"
            style={{ animationDelay: `${rowIndex * 0.04}s` }}
        >
            <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDoctor ? 'bg-violet-100' : 'bg-sky-100'}`}>
                        <Stethoscope size={13} className={roleStyle.icon} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">{staff.name}</p>
                        <p className="text-xs text-slate-400">{staff.designation}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 pr-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${roleStyle.badge}`}>
                    {staff.role}
                </span>
            </td>
            <td className="py-3 pr-4 text-sm text-slate-600">
                <p>{staff.shift} shift</p>
                <p className="text-xs text-slate-400">{staff.shift_time}</p>
            </td>
            <td className="py-3 pr-4 text-sm text-slate-500">
                {staff.specialization}
            </td>
            <td className="py-3 pr-4">
                {staff.on_duty_today
                    ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><UserCheck size={11} /> On Duty</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"><UserX size={11} /> Off</span>
                }
            </td>
            <td className="py-3 text-xs text-slate-400">
                {staff.patients_assigned?.length > 0
                    ? <span className="font-semibold text-violet-600">{staff.patients_assigned.length} patient{staff.patients_assigned.length > 1 ? 's' : ''}</span>
                    : <span>—</span>
                }
            </td>
        </tr>
    )
}


// ─── Helper : Anomaly Card ────────────────────────────────────

function AnomalyCard({ anomaly, cardIndex }) {
    const isCritical = anomaly.severity === 'critical'
    const styleMap = isCritical
        ? { card: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700 border-red-200', icon: 'text-red-500', iconBg: 'bg-red-100' }
        : { card: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'text-amber-500', iconBg: 'bg-amber-100' }

    return (
        <div
            className={`rounded-2xl border ${styleMap.card} p-4 animate-slide-up`}
            style={{ animationDelay: `${cardIndex * 0.07}s` }}
        >
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styleMap.iconBg}`}>
                    <AlertTriangle size={16} className={styleMap.icon} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">{anomaly.metric}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${styleMap.badge}`}>
                            {anomaly.severity}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1.5">{anomaly.message}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ChevronRight size={11} className="text-sky-400" />
                        <span>{anomaly.suggested_action}</span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Current</p>
                    <p className="text-lg font-black text-slate-700 tabular-nums">{anomaly.current_value}</p>
                    <p className="text-xs text-rose-500 font-semibold">+{anomaly.deviation_pct}% above baseline</p>
                </div>
            </div>
        </div>
    )
}


// ─── Helper : Surgery Row ─────────────────────────────────────

function SurgeryRow({ surgery, rowIndex }) {
    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all animate-slide-up ${
                surgery.completed
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-white border-slate-200 hover:shadow-sm'
            }`}
            style={{ animationDelay: `${rowIndex * 0.06}s` }}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${surgery.completed ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                {surgery.completed
                    ? <CheckCircle size={18} className="text-emerald-500" />
                    : <Circle size={18} className="text-violet-400" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{surgery.procedure}</p>
                <p className="text-xs text-slate-400">{surgery.surgeon} · {surgery.time}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                surgery.completed
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-violet-100 text-violet-700 border-violet-200'
            }`}>
                {surgery.completed ? 'Done' : 'Scheduled'}
            </span>
        </div>
    )
}


// ─── Main Dashboard ───────────────────────────────────────────

export default function DepartmentHeadDashboard({ onLogout }) {

    // ── State ──────────────────────────────────────────────────
    const [deptData,    setDeptData]    = useState(null)
    const [staffList,   setStaffList]   = useState([])
    const [anomalyList, setAnomalyList] = useState([])
    const [isLoading,   setIsLoading]   = useState(true)
    const [fetchError,  setFetchError]  = useState(null)
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [activeSection, setActiveSection] = useState('overview')


    // ── Data fetching ──────────────────────────────────────────
    const loadData = async () => {
        try {
            setFetchError(null)

            const [deptRes, anomaliesRes, staffRes] = await Promise.all([
                analyticsApi.getDepartment(DEMO_DEPT_ID),
                insightsApi.getAnomalies(),
                staffApi.getByDepartment(DEMO_DEPT_ID),
            ])

            setDeptData(deptRes.data)

            // Filter anomalies for this department only
            const deptAnomalies = (anomaliesRes.data.anomalies || [])
                .filter(a => a.department_id === DEMO_DEPT_ID)
            setAnomalyList(deptAnomalies)

            setStaffList(staffRes.data.staff || [])
            setLastRefresh(new Date())

        } catch (err) {
            setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        const timer = setInterval(loadData, 30000)
        return () => clearInterval(timer)
    }, [])


    // ── Sidebar scroll ─────────────────────────────────────────
    const scrollTo = (id) => {
        setActiveSection(id)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }


    // ── Build simulated surgery list from dept data ────────────
    const buildSurgeries = (dept) => {
        if (!dept) return []
        const surgeries = []
        const procedures = [
            { proc: 'Appendectomy',          surgeon: 'Dr. Priya Subramaniam', time: '08:30 AM' },
            { proc: 'Laparoscopic Biopsy',   surgeon: 'Dr. Suresh Babu',       time: '10:15 AM' },
            { proc: 'Minor Procedure OPD',   surgeon: 'Dr. Priya Subramaniam', time: '12:00 PM' },
            { proc: 'Wound Debridement',     surgeon: 'Dr. Suresh Babu',       time: '02:30 PM' },
        ]
        const total     = Math.min(dept.surgeries_scheduled || 0, procedures.length)
        const completed = dept.surgeries_completed || 0
        for (let i = 0; i < total; i++) {
            surgeries.push({ ...procedures[i], procedure: procedures[i].proc, completed: i < completed })
        }
        return surgeries
    }


    // ── Loading ────────────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw size={24} className="text-violet-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">Loading department data...</p>
            </div>
        </div>
    )


    // ── Error ──────────────────────────────────────────────────
    if (fetchError) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
                <p className="font-bold text-red-700 mb-2">Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">{fetchError}</p>
                <button onClick={loadData} className="px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors">
                    Retry
                </button>
            </div>
        </div>
    )


    // ── Derived values ─────────────────────────────────────────
    const dept        = deptData || {}
    const bedPct      = dept.bed_occupancy_pct ?? Math.round((dept.occupied_beds / dept.total_beds) * 100)
    const bedColor    = bedPct >= 95 ? 'text-red-600' : bedPct >= 85 ? 'text-amber-600' : 'text-emerald-600'
    const waitColor   = (dept.opd_wait_time_min || 0) > 30 ? 'text-red-600' : (dept.opd_wait_time_min || 0) > 20 ? 'text-amber-600' : 'text-emerald-600'
    const satColor    = (dept.patient_satisfaction || 0) >= 4.3 ? 'text-emerald-600' : (dept.patient_satisfaction || 0) >= 3.8 ? 'text-amber-600' : 'text-red-600'
    const surgTotal   = dept.surgeries_scheduled || 0
    const surgDone    = dept.surgeries_completed || 0
    const surgPct     = surgTotal > 0 ? Math.round((surgDone / surgTotal) * 100) : 100
    const surgeries   = buildSurgeries(dept)
    const doctors     = staffList.filter(s => s.role === 'doctor')
    const nurses      = staffList.filter(s => s.role === 'nurse')
    const onDutyCount = staffList.filter(s => s.on_duty_today).length


    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* ── Navbar ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                            <Building2 size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm">PrimeCare Hospital</span>
                            <span className="text-slate-400 text-sm"> · Department Head</span>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">

                        {/* Anomaly badge */}
                        {anomalyList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                {anomalyList.length} Alert{anomalyList.length > 1 ? 's' : ''}
                            </span>
                        )}

                        {/* Live indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            {lastRefresh.toLocaleTimeString()}
                        </div>

                        {/* Refresh */}
                        <button onClick={loadData} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all">
                            <RefreshCw size={14} />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                <Building2 size={14} className="text-violet-600" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-slate-700">{DEMO_DEPT_HEAD}</p>
                                <p className="text-xs text-slate-400">General Medicine</p>
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
                                        ? 'bg-violet-50 text-violet-600 border border-violet-100'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Staff on-duty count in sidebar */}
                    <div className="mx-3 mt-6 p-3 bg-violet-50 rounded-xl border border-violet-100">
                        <p className="text-xs font-bold text-violet-700 mb-1">Staff On Duty</p>
                        <p className="text-2xl font-black text-violet-600">{onDutyCount}</p>
                        <p className="text-xs text-violet-500 mt-0.5">{doctors.length} doctors · {nurses.length} nurses</p>
                    </div>
                </aside>


                {/* ── Main content ── */}
                <main className="flex-1 px-6 py-6 overflow-y-auto">


                    {/* ── Section 1 : Overview ── */}
                    <DeptSection
                        sectionId="overview"
                        title={dept.name || 'General Medicine'}
                        subtitle={`${dept.floor || 'Floor 2, Block B'} · Head: ${DEMO_DEPT_HEAD}`}
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <OverviewStat label="Total Beds"       value={dept.total_beds}        sub={`${dept.occupied_beds} occupied`} />
                                <OverviewStat label="OPD Patients"     value={dept.opd_patients_today} sub="today"                           />
                                <OverviewStat label="Critical Patients" value={dept.critical_patients} sub="requiring monitoring"             color="text-red-600" />
                                <OverviewStat label="Revenue Today"    value={`₹${dept.revenue_today_lakh}L`} sub="today's billing"          color="text-emerald-600" />
                            </div>

                            {/* Bed occupancy bar */}
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-semibold">Bed Occupancy</span>
                                    <span className={`font-black text-sm ${bedColor}`}>{bedPct}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${bedPct >= 95 ? 'bg-red-500' : bedPct >= 85 ? 'bg-amber-400' : 'bg-violet-400'}`}
                                        style={{ width: `${bedPct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">
                                    {dept.occupied_beds} of {dept.total_beds} beds occupied · Avg stay {dept.avg_length_of_stay} days
                                    {dept.icu_beds_total > 0 && ` · ICU: ${dept.icu_beds_occupied}/${dept.icu_beds_total}`}
                                </p>
                            </div>
                        </div>
                    </DeptSection>


                    {/* ── Section 2 : KPIs ── */}
                    <DeptSection
                        sectionId="kpis"
                        title="Department KPIs"
                        subtitle="Live metrics for your department"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiTile
                                Icon={BedDouble} iconBg="bg-violet-100" iconColor="text-violet-600"
                                label="Bed Occupancy" value={`${bedPct}`} unit="%" subtext={`${dept.occupied_beds}/${dept.total_beds} beds`}
                                statusColor={bedColor} tileIndex={0}
                            />
                            <KpiTile
                                Icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600"
                                label="OPD Wait" value={dept.opd_wait_time_min} unit=" min" subtext={`Baseline: ${dept.opd_baseline_wait_min} min`}
                                statusColor={waitColor} tileIndex={1}
                            />
                            <KpiTile
                                Icon={Star} iconBg="bg-emerald-100" iconColor="text-emerald-600"
                                label="Patient Satisfaction" value={`★ ${dept.patient_satisfaction}`} unit="" subtext="Out of 5.0"
                                statusColor={satColor} tileIndex={2}
                            />
                            <KpiTile
                                Icon={Scissors} iconBg="bg-sky-100" iconColor="text-sky-600"
                                label="Surgeries" value={`${surgDone}/${surgTotal}`} unit="" subtext={`${surgPct}% completion rate`}
                                statusColor={surgPct === 100 ? 'text-emerald-600' : 'text-sky-600'} tileIndex={3}
                            />
                        </div>
                    </DeptSection>


                    {/* ── Section 3 : Staff Roster ── */}
                    <DeptSection
                        sectionId="staff"
                        title="Staff Roster"
                        subtitle={`${onDutyCount} staff members on duty today`}
                        badge={
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
                                <Users size={12} /> {staffList.length} total
                            </span>
                        }
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                            <table className="w-full min-w-[640px]">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-5 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Name</th>
                                        <th className="px-4 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Role</th>
                                        <th className="px-4 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Shift</th>
                                        <th className="px-4 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Specialization</th>
                                        <th className="px-4 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-3 text-left text-xs text-slate-400 font-semibold uppercase tracking-wide">Patients</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 px-5">
                                    {staffList.map((member, idx) => (
                                        <tr key={member.staff_id} className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.role === 'doctor' ? 'bg-violet-100' : 'bg-sky-100'}`}>
                                                        <Stethoscope size={13} className={member.role === 'doctor' ? 'text-violet-500' : 'text-sky-500'} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{member.name}</p>
                                                        <p className="text-xs text-slate-400">{member.designation}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${member.role === 'doctor' ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <p>{member.shift}</p>
                                                <p className="text-xs text-slate-400">{member.shift_time}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{member.specialization}</td>
                                            <td className="px-4 py-3">
                                                {member.on_duty_today
                                                    ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><UserCheck size={11} /> On Duty</span>
                                                    : <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"><UserX size={11} /> Off</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400">
                                                {member.patients_assigned?.length > 0
                                                    ? <span className="font-semibold text-violet-600">{member.patients_assigned.length} patient{member.patients_assigned.length > 1 ? 's' : ''}</span>
                                                    : <span>—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DeptSection>


                    {/* ── Section 4 : Anomalies ── */}
                    <DeptSection
                        sectionId="anomalies"
                        title="Department Anomalies"
                        subtitle="Active alerts for this department only"
                        badge={anomalyList.length > 0
                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                {anomalyList.length} active
                              </span>
                            : null
                        }
                    >
                        {anomalyList.length === 0 ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                                <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-emerald-700">All metrics within normal range</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {anomalyList.map((anomaly, idx) => (
                                    <AnomalyCard key={anomaly.anomaly_id} anomaly={anomaly} cardIndex={idx} />
                                ))}
                            </div>
                        )}
                    </DeptSection>


                    {/* ── Section 5 : Surgery Schedule ── */}
                    <DeptSection
                        sectionId="surgery"
                        title="Surgery Schedule"
                        subtitle={`Today · ${surgDone} of ${surgTotal} completed`}
                        badge={
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${surgPct === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                                {surgPct}% done
                            </span>
                        }
                    >
                        {/* Progress bar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Completion</span>
                                <span className="font-black text-slate-700">{surgDone}/{surgTotal}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${surgPct === 100 ? 'bg-emerald-400' : 'bg-violet-400'}`}
                                    style={{ width: `${surgPct}%` }}
                                />
                            </div>
                        </div>

                        {surgeries.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                                <p className="text-slate-400 text-sm">No surgeries scheduled for today</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {surgeries.map((s, idx) => (
                                    <SurgeryRow key={idx} surgery={s} rowIndex={idx} />
                                ))}
                            </div>
                        )}
                    </DeptSection>


                </main>
            </div>
        </div>
    )
}


// ─── Micro-helper ─────────────────────────────────────────────

function OverviewStat({ label, value, sub, color = 'text-slate-800' }) {
    return (
        <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
    )
}
