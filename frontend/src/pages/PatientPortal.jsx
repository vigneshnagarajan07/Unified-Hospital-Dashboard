// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// PatientPortal.jsx — Personal health journey dashboard
// Sections: Profile, Vitals, Prescriptions, Lab Reports,
//           Billing, Discharge Checklist
// Demo patient: APL-2024-0847 (Senthil Kumar)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
    Heart, Thermometer, Activity, Wind,
    Pill, FlaskConical, Receipt, ClipboardList,
    UserCircle, LogOut, RefreshCw, AlertCircle,
    CheckCircle2, Circle, ChevronDown, ChevronUp,
    ArrowUp, ArrowDown, Minus, BedDouble, Calendar,
    Phone, MapPin, Droplets, Stethoscope
} from 'lucide-react'
import { patientApi } from '../api/client'

// ─── Demo Patient ID ──────────────────────────────────────────
const DEMO_PATIENT_ID = 'APL-2024-0847'

// ─── Sidebar nav sections ─────────────────────────────────────
const PORTAL_SECTIONS = [
    { sectionId: 'profile',   label: 'My Profile',    Icon: UserCircle    },
    { sectionId: 'vitals',    label: 'Vitals',         Icon: Activity      },
    { sectionId: 'rx',        label: 'Prescriptions',  Icon: Pill          },
    { sectionId: 'labs',      label: 'Lab Reports',    Icon: FlaskConical  },
    { sectionId: 'billing',   label: 'Billing',        Icon: Receipt       },
    { sectionId: 'discharge', label: 'Discharge',      Icon: ClipboardList },
]


// ─── Helper : Section wrapper ─────────────────────────────────

function PatientSection({ sectionId, title, subtitle, badge, children }) {
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


// ─── Helper : Vital Tile ──────────────────────────────────────

function VitalTile({ Icon, iconColor, bgColor, label, value, unit, prevValue, tileIndex }) {
    const numCurrent = parseFloat(String(value).replace(/[^0-9.]/g, ''))
    const numPrev    = parseFloat(String(prevValue).replace(/[^0-9.]/g, ''))
    const hasDelta   = !isNaN(numCurrent) && !isNaN(numPrev) && numCurrent !== numPrev
    const isUp       = numCurrent > numPrev

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all animate-slide-up"
            style={{ animationDelay: `${tileIndex * 0.07}s` }}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}`}>
                <Icon size={22} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 tabular-nums">{value}</span>
                    {unit && <span className="text-xs text-slate-400">{unit}</span>}
                </div>
                {hasDelta && (
                    <div className={`flex items-center gap-1 text-xs font-semibold mt-0.5 ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        <span>vs last reading ({prevValue}{unit})</span>
                    </div>
                )}
                {!hasDelta && prevValue && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Minus size={11} /> <span>No change from last reading</span>
                    </div>
                )}
            </div>
        </div>
    )
}


// ─── Helper : Medication Row ──────────────────────────────────

function MedicationRow({ med, rowIndex }) {
    const flagColor = med.instructions?.includes('Before') ? 'bg-sky-50 text-sky-700 border-sky-100'
        : med.instructions?.includes('After') ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-slate-50 text-slate-600 border-slate-100'

    return (
        <tr
            className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors animate-slide-up"
            style={{ animationDelay: `${rowIndex * 0.04}s` }}
        >
            <td className="py-3 pr-4">
                <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                <p className="text-xs text-slate-400">{med.duration}</p>
            </td>
            <td className="py-3 pr-4">
                <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200">
                    {med.dose}
                </span>
            </td>
            <td className="py-3 pr-4 text-sm text-slate-600">{med.frequency}</td>
            <td className="py-3">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${flagColor}`}>
                    {med.instructions}
                </span>
            </td>
        </tr>
    )
}


// ─── Helper : Lab Result Row ──────────────────────────────────

function LabResultRow({ result, rowIndex }) {
    const flagStyle = result.flag === 'high'   ? { badge: 'bg-red-100 text-red-700 border-red-200',     row: 'bg-red-50/40'     }
        : result.flag === 'low'    ? { badge: 'bg-amber-100 text-amber-700 border-amber-200', row: 'bg-amber-50/40'  }
        : { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', row: '' }

    return (
        <tr className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${flagStyle.row}`}>
            <td className="py-3 pr-4 text-sm font-medium text-slate-700">{result.parameter}</td>
            <td className="py-3 pr-4">
                <span className="font-black text-slate-800 tabular-nums text-sm">{result.value}</span>
                <span className="text-xs text-slate-400 ml-1">{result.unit}</span>
            </td>
            <td className="py-3 pr-4 text-xs text-slate-400">{result.reference}</td>
            <td className="py-3">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${flagStyle.badge}`}>
                    {result.flag}
                </span>
            </td>
        </tr>
    )
}


// ─── Helper : Lab Report Accordion Card ──────────────────────

function LabReportCard({ report, cardIndex }) {
    const [isOpen, setIsOpen] = useState(cardIndex === 0)

    const statusStyle = report.status === 'completed'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : 'bg-amber-100 text-amber-700 border-amber-200'

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up"
            style={{ animationDelay: `${cardIndex * 0.08}s` }}
        >
            {/* Header — always visible, click to toggle */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <FlaskConical size={16} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">{report.test_name}</p>
                        <p className="text-xs text-slate-400">
                            Ordered by {report.ordered_by} · {report.ordered_date}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusStyle}`}>
                        {report.status}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {/* Results table — visible when open */}
            {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-4">
                    {report.results.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">Results pending — not yet available</p>
                    ) : (
                        <table className="w-full mt-3">
                            <thead>
                                <tr className="text-left">
                                    <th className="pb-2 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Parameter</th>
                                    <th className="pb-2 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Value</th>
                                    <th className="pb-2 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Reference</th>
                                    <th className="pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wide">Flag</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.results.map((result, resultIdx) => (
                                    <LabResultRow key={resultIdx} result={result} rowIndex={resultIdx} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}


// ─── Helper : Billing Bar ─────────────────────────────────────

function BillingBar({ bill }) {
    const segments = [
        { label: 'Room',      value: bill.room_charges_lakh,      color: 'bg-rose-400' },
        { label: 'Doctor',    value: bill.doctor_fees_lakh,        color: 'bg-violet-400' },
        { label: 'Pharmacy',  value: bill.pharmacy_lakh,           color: 'bg-sky-400' },
        { label: 'Lab',       value: bill.lab_charges_lakh,        color: 'bg-amber-400' },
        { label: 'Procedure', value: bill.procedure_charges_lakh,  color: 'bg-emerald-400' },
    ]

    const total = segments.reduce((sum, s) => sum + s.value, 0)

    return (
        <div>
            {/* Stacked bar */}
            <div className="h-5 rounded-full overflow-hidden flex gap-0.5 mb-3">
                {segments.map(seg => (
                    <div
                        key={seg.label}
                        className={`${seg.color} h-full transition-all duration-700`}
                        style={{ width: `${(seg.value / total) * 100}%` }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                {segments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.color}`} />
                        <span className="text-xs text-slate-500">{seg.label}</span>
                        <span className="text-xs font-bold text-slate-700">₹{seg.value.toFixed(2)}L</span>
                    </div>
                ))}
            </div>
        </div>
    )
}


// ─── Helper : Checklist Item ──────────────────────────────────

function ChecklistItem({ task, isCompleted, itemIndex }) {
    return (
        <div
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all animate-slide-up ${
                isCompleted ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
            }`}
            style={{ animationDelay: `${itemIndex * 0.06}s` }}
        >
            {isCompleted
                ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                : <Circle size={18} className="text-slate-300 shrink-0" />
            }
            <span className={`text-sm font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-600'}`}>
                {task}
            </span>
        </div>
    )
}


// ─── Main Patient Portal ──────────────────────────────────────

export default function PatientPortal({ onLogout }) {

    // ── State ──────────────────────────────────────────────────
    const [patientData,   setPatientData]   = useState(null)
    const [vitalsData,    setVitalsData]    = useState([])
    const [rxData,        setRxData]        = useState([])
    const [labData,       setLabData]       = useState([])
    const [billData,      setBillData]      = useState(null)
    const [dischargeData, setDischargeData] = useState(null)
    const [isLoading,     setIsLoading]     = useState(true)
    const [fetchError,    setFetchError]    = useState(null)
    const [lastRefresh,   setLastRefresh]   = useState(new Date())
    const [activeSection, setActiveSection] = useState('profile')


    // ── Data fetching ──────────────────────────────────────────
    const loadPortalData = async () => {
        try {
            setFetchError(null)

            const [
                patientRes,
                vitalsRes,
                rxRes,
                labRes,
                billRes,
                dischargeRes,
            ] = await Promise.all([
                patientApi.getById(DEMO_PATIENT_ID),
                patientApi.getVitals(DEMO_PATIENT_ID),
                patientApi.getPrescriptions(DEMO_PATIENT_ID),
                patientApi.getLabReports(DEMO_PATIENT_ID),
                patientApi.getBill(DEMO_PATIENT_ID),
                patientApi.getDischargeList(DEMO_PATIENT_ID),
            ])

            setPatientData(patientRes.data)
            setVitalsData(vitalsRes.data.vitals       || [])
            setRxData(rxRes.data.prescriptions        || [])
            setLabData(labRes.data.lab_reports         || [])
            setBillData(billRes.data.bill_estimate)
            setDischargeData(dischargeRes.data)
            setLastRefresh(new Date())

        } catch (err) {
            setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPortalData()
        const timer = setInterval(loadPortalData, 30000)
        return () => clearInterval(timer)
    }, [])


    // ── Sidebar scroll ─────────────────────────────────────────
    const scrollTo = (sectionId) => {
        setActiveSection(sectionId)
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }


    // ── Loading ────────────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw size={24} className="text-rose-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">Loading your health record...</p>
            </div>
        </div>
    )


    // ── Error ──────────────────────────────────────────────────
    if (fetchError) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
                <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
                <p className="font-bold text-red-700 mb-2">Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">{fetchError}</p>
                <button
                    onClick={loadPortalData}
                    className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    )


    // ── Derived values ─────────────────────────────────────────
    const latestVital  = vitalsData[0]  || {}
    const prevVital    = vitalsData[1]  || {}
    const checklist    = dischargeData?.checklist || []
    const doneTasks    = dischargeData?.tasks_completed || 0
    const totalTasks   = dischargeData?.tasks_total     || 1
    const dischargePct = dischargeData?.completion_percent || 0


    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* ── Navbar ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
                            <Heart size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm">PrimeCare Hospital</span>
                            <span className="text-slate-400 text-sm"> · Patient Portal</span>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Live indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            {lastRefresh.toLocaleTimeString()}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadPortalData}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                            <RefreshCw size={14} />
                        </button>

                        {/* User + logout */}
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                <UserCircle size={16} className="text-rose-600" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-slate-700">{patientData?.name}</p>
                                <p className="text-xs text-slate-400">{patientData?.patient_id}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="ml-2 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
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
                        {PORTAL_SECTIONS.map(({ sectionId, label, Icon }) => (
                            <button
                                key={sectionId}
                                onClick={() => scrollTo(sectionId)}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                                    ${activeSection === sectionId
                                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Quick discharge badge in sidebar */}
                    <div className="mx-3 mt-6 p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-xs font-bold text-rose-700 mb-1.5">Discharge Progress</p>
                        <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                                style={{ width: `${dischargePct}%` }}
                            />
                        </div>
                        <p className="text-xs text-rose-600 mt-1.5">
                            {doneTasks}/{totalTasks} tasks done
                        </p>
                    </div>
                </aside>


                {/* ── Main content ── */}
                <main className="flex-1 px-6 py-6 overflow-y-auto">


                    {/* ── Section 1 : Profile ── */}
                    <PatientSection
                        sectionId="profile"
                        title="My Profile"
                        subtitle="Personal details and admission information"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-start gap-6 flex-wrap">

                                {/* Avatar + name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                                        <UserCircle size={36} className="text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{patientData?.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            {patientData?.age} yrs · {patientData?.gender}
                                        </p>
                                        <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                            {patientData?.diagnosis}
                                        </span>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InfoChip Icon={Droplets}    label="Blood Group"   value={patientData?.blood_group} />
                                    <InfoChip Icon={BedDouble}   label="Bed"           value={`${patientData?.bed_number} · ${patientData?.ward}`} />
                                    <InfoChip Icon={Stethoscope} label="Doctor"        value={patientData?.assigned_doctor} />
                                    <InfoChip Icon={Calendar}    label="Admitted"      value={patientData?.admission_date} />
                                    <InfoChip Icon={Calendar}    label="Exp. Discharge" value={patientData?.expected_discharge} />
                                    <InfoChip Icon={Phone}       label="Phone"         value={patientData?.phone} />
                                </div>

                            </div>
                        </div>
                    </PatientSection>


                    {/* ── Section 2 : Vitals ── */}
                    <PatientSection
                        sectionId="vitals"
                        title="Latest Vitals"
                        subtitle={`Recorded at ${latestVital?.recorded_at || '—'}`}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <VitalTile
                                Icon={Heart}       iconColor="text-rose-500"   bgColor="bg-rose-100"
                                label="Blood Pressure" value={latestVital?.blood_pressure}
                                prevValue={prevVital?.blood_pressure} unit="" tileIndex={0}
                            />
                            <VitalTile
                                Icon={Activity}    iconColor="text-violet-500" bgColor="bg-violet-100"
                                label="Pulse" value={latestVital?.pulse_bpm}
                                prevValue={prevVital?.pulse_bpm} unit=" bpm" tileIndex={1}
                            />
                            <VitalTile
                                Icon={Wind}        iconColor="text-sky-500"    bgColor="bg-sky-100"
                                label="SpO₂" value={latestVital?.spo2_pct}
                                prevValue={prevVital?.spo2_pct} unit="%" tileIndex={2}
                            />
                            <VitalTile
                                Icon={Thermometer} iconColor="text-amber-500"  bgColor="bg-amber-100"
                                label="Temperature" value={latestVital?.temperature_f}
                                prevValue={prevVital?.temperature_f} unit="°F" tileIndex={3}
                            />
                        </div>
                    </PatientSection>


                    {/* ── Section 3 : Prescriptions ── */}
                    <PatientSection
                        sectionId="rx"
                        title="Prescriptions"
                        subtitle="Medications prescribed for your treatment"
                    >
                        <div className="space-y-4">
                            {rxData.map((rx, rxIndex) => (
                                <div
                                    key={rxIndex}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up"
                                    style={{ animationDelay: `${rxIndex * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
                                >
                                    {/* Rx header */}
                                    <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-rose-700 text-sm">
                                                Prescribed by {rx.doctor_name}
                                            </p>
                                            <p className="text-xs text-rose-500">{rx.prescribed_date}</p>
                                        </div>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                            {rx.medications.length} medications
                                        </span>
                                    </div>

                                    {/* Medication table */}
                                    <div className="px-5 pb-2 overflow-x-auto">
                                        <table className="w-full min-w-[540px]">
                                            <thead>
                                                <tr className="text-left border-b border-slate-100">
                                                    <th className="py-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Medication</th>
                                                    <th className="py-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Dose</th>
                                                    <th className="py-3 pr-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">Frequency</th>
                                                    <th className="py-3      text-xs text-slate-400 font-semibold uppercase tracking-wide">Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rx.medications.map((med, medIdx) => (
                                                    <MedicationRow key={medIdx} med={med} rowIndex={medIdx} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Doctor notes */}
                                    {rx.notes && (
                                        <div className="mx-5 mb-4 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                                            <span className="font-bold">Doctor's Note: </span>{rx.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PatientSection>


                    {/* ── Section 4 : Lab Reports ── */}
                    <PatientSection
                        sectionId="labs"
                        title="Lab Reports"
                        subtitle="Click a report to view results"
                    >
                        <div className="space-y-3">
                            {labData.map((report, reportIdx) => (
                                <LabReportCard key={report.report_id} report={report} cardIndex={reportIdx} />
                            ))}
                        </div>
                    </PatientSection>


                    {/* ── Section 5 : Billing ── */}
                    <PatientSection
                        sectionId="billing"
                        title="Billing Estimate"
                        subtitle="Indicative costs — subject to final calculation at discharge"
                    >
                        {billData && (
                            <div className="space-y-4">
                                {/* Summary tiles */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <BillTile
                                        label="Total Estimate"
                                        value={`₹${billData.total_lakh}L`}
                                        subtext="Combined all charges"
                                        colorClass="text-slate-800"
                                        bgClass="bg-slate-50"
                                    />
                                    <BillTile
                                        label="Insurance Covered"
                                        value={`₹${billData.insurance_covered_lakh}L`}
                                        subtext={`${billData.insurance_provider} · ${billData.claim_status}`}
                                        colorClass="text-emerald-600"
                                        bgClass="bg-emerald-50"
                                    />
                                    <BillTile
                                        label="You Owe"
                                        value={`₹${billData.patient_due_lakh}L`}
                                        subtext="Estimated balance due"
                                        colorClass="text-rose-600"
                                        bgClass="bg-rose-50"
                                    />
                                </div>

                                {/* Billing breakdown bar */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <p className="text-sm font-bold text-slate-700 mb-4">Cost Breakdown</p>
                                    <BillingBar bill={billData} />
                                </div>
                            </div>
                        )}
                    </PatientSection>


                    {/* ── Section 6 : Discharge Checklist ── */}
                    <PatientSection
                        sectionId="discharge"
                        title="Discharge Checklist"
                        subtitle="Tasks that must be completed before you leave"
                        badge={
                            dischargeData?.ready_for_discharge
                                ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                                    <CheckCircle2 size={12} /> Ready
                                  </span>
                                : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                                    {doneTasks}/{totalTasks} Complete
                                  </span>
                        }
                    >
                        {/* Progress bar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Progress</span>
                                <span className="font-bold text-slate-700">{dischargePct}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                        dischargePct === 100 ? 'bg-emerald-400'
                                        : dischargePct >= 50  ? 'bg-sky-400'
                                        : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${dischargePct}%` }}
                                />
                            </div>
                        </div>

                        {/* Task list */}
                        <div className="space-y-2">
                            {checklist.map((item, itemIdx) => (
                                <ChecklistItem
                                    key={itemIdx}
                                    task={item.task}
                                    isCompleted={item.completed}
                                    itemIndex={itemIdx}
                                />
                            ))}
                        </div>
                    </PatientSection>


                </main>
            </div>
        </div>
    )
}


// ─── Micro-helpers ────────────────────────────────────────────

function InfoChip({ Icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-rose-500" />
            </div>
            <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
            </div>
        </div>
    )
}

function BillTile({ label, value, subtext, colorClass, bgClass }) {
    return (
        <div className={`rounded-2xl border border-slate-200 shadow-sm p-5 ${bgClass}`}>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">{label}</p>
            <p className={`text-2xl font-black tabular-nums ${colorClass}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1 capitalize">{subtext}</p>}
        </div>
    )
}
