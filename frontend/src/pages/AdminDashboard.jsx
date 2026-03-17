// ─────────────────────────────────────────────────────────────
// PrimeCare Medical Hospital | GKM_8 Intelligence Platform
// AdminDashboard.jsx — Redesigned light-theme admin view
// New: KPIAlertOverlay, PatientManagementDialog, Toast
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
    Activity, AlertTriangle, BedDouble, Clock,
    Users, TrendingUp, TrendingDown, RefreshCw,
    BarChart3, Brain, Lightbulb, CheckCircle,
    ChevronRight, LogOut, Shield, DollarSign,
    ArrowUpRight, ArrowDownRight, UserCog, Stethoscope,
    Plus, Info, Zap
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { analyticsApi, insightsApi } from '../api/client'
import KPIAlertOverlay from '../components/KPIAlertOverlay'
import PatientManagementDialog from '../components/PatientManagementDialog'
import { useToast } from '../components/Toast'
import WorkflowPanel from '../components/WorkflowPanel'
import { NotificationsBell } from '../components/WorkflowPanel'
import ChatBox from '../components/ChatBox'

// ── Sidebar nav ───────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
    { sectionId: 'health',           label: 'Performance Metrics', Icon: Activity     },
    { sectionId: 'kpis',             label: 'KPIs',             Icon: BarChart3    },
    { sectionId: 'anomalies',        label: 'Anomalies',        Icon: AlertTriangle},
    { sectionId: 'departments',      label: 'Departments',      Icon: BedDouble    },
    { sectionId: 'insights',         label: 'AI Insights',      Icon: Brain        },
    { sectionId: 'recommendations',  label: 'Actions',          Icon: Lightbulb    },
    { sectionId: 'forecast',         label: '48hr Forecast',    Icon: TrendingUp   },
    { sectionId: 'finance',          label: 'Finance',          Icon: DollarSign   },
    { sectionId: 'workflow',         label: 'Workflow',         Icon: Users        },
]

// ── Section wrapper ───────────────────────────────────────────
function DashboardSection({ sectionId, title, subtitle, children, anomalyCount, action }) {
    return (
        <section id={sectionId} className="mb-10">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {anomalyCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                            {anomalyCount} alert{anomalyCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {action}
                </div>
            </div>
            {children}
        </section>
    )
}

// ── Health gauge ──────────────────────────────────────────────
function HealthScoreGauge({ scoreValue, scoreGrade, scoreLabel }) {
    const gaugeColor = scoreValue >= 85 ? '#10B981' : scoreValue >= 70 ? '#0EA5E9' : scoreValue >= 55 ? '#F59E0B' : '#EF4444'
    const trackColor = scoreValue >= 85 ? '#D1FAE5' : scoreValue >= 70 ? '#E0F2FE' : scoreValue >= 55 ? '#FEF3C7' : '#FEE2E2'
    const radius = 54; const centerX = 72; const centerY = 72
    const startAngleDeg = -210; const endAngleDeg = 30
    const totalArcDeg = endAngleDeg - startAngleDeg
    const fillArcDeg = (scoreValue / 100) * totalArcDeg
    const toRad = (deg) => (deg * Math.PI) / 180
    const arcPath = (startDeg, endDeg, r) => {
        const s = { x: centerX + r * Math.cos(toRad(startDeg)), y: centerY + r * Math.sin(toRad(startDeg)) }
        const e = { x: centerX + r * Math.cos(toRad(endDeg)), y: centerY + r * Math.sin(toRad(endDeg)) }
        const laf = endDeg - startDeg > 180 ? 1 : 0
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${laf} 1 ${e.x} ${e.y}`
    }
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-8 stat-card">
            <div className="shrink-0">
                <svg width="144" height="104" viewBox="0 0 144 104">
                    <path d={arcPath(startAngleDeg, endAngleDeg, radius)} fill="none" stroke={trackColor} strokeWidth="10" strokeLinecap="round" />
                    <path d={arcPath(startAngleDeg, startAngleDeg + fillArcDeg, radius)} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
                    <text x="72" y="74" textAnchor="middle" fontSize="24" fontWeight="800" fill={gaugeColor}>{scoreValue}</text>
                    <text x="72" y="88" textAnchor="middle" fontSize="10" fill="#94A3B8">/ 100</text>
                </svg>
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Hospital Performance Metrics</p>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black" style={{ color: gaugeColor }}>{scoreGrade}</span>
                    <span className="text-lg font-bold" style={{ color: gaugeColor }}>{scoreLabel}</span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Weighted across bed occupancy (30%), OPD wait (25%), patient satisfaction (25%), surgery completion (20%)
                </p>
            </div>
        </div>
    )
}

// ── KPI card (used inside overlay) ───────────────────────────
function KPICardInner({ kpiData, cardIndex }) {
    const statusColors = {
        normal:   { bg: 'bg-emerald-50', border: 'border-emerald-100', value: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', line: '#10B981' },
        warning:  { bg: 'bg-amber-50',   border: 'border-amber-100',   value: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   line: '#F59E0B' },
        critical: { bg: 'bg-red-50',     border: 'border-red-100',     value: 'text-red-700',     badge: 'bg-red-100 text-red-700',     line: '#EF4444' },
    }
    const c = statusColors[kpiData.status] || statusColors.normal
    const isPositive = kpiData.delta_pct > 0
    const deltaIsGood = kpiData.higher_is_worse ? !isPositive : isPositive
    const chartData = kpiData.trend?.map((v, i) => ({ value: v, date: kpiData.dates?.[i] || i })) || []
    return (
        <div className={`bg-white rounded-2xl border ${c.border} shadow-sm overflow-hidden card-hover animate-slide-up`} style={{ animationDelay: `${cardIndex * 0.07}s` }}>
            <div className={`${c.bg} px-4 pt-4 pb-3`}>
                <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{kpiData.label}</p>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.badge} capitalize`}>{kpiData.status}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black tabular-nums animate-number-pop ${c.value}`}>{kpiData.value}</span>
                    <span className="text-sm text-slate-400">{kpiData.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{kpiData.description}</p>
            </div>
            <div className="px-2 py-2">
                <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`kpi-grad-${kpiData.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={c.line} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={c.line} stopOpacity={0}    />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px', padding: '4px 8px' }}
                            formatter={v => [v, kpiData.label]}
                        />
                        <Area type="monotone" dataKey="value" stroke={c.line} strokeWidth={2} fill={`url(#kpi-grad-${kpiData.id})`} dot={false} activeDot={{ r: 3 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Baseline <span className="font-bold text-slate-600">{kpiData.baseline}{kpiData.unit}</span></span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${deltaIsGood ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpiData.delta_pct > 0 ? '+' : ''}{kpiData.delta_pct}%
                </span>
            </div>
        </div>
    )
}

// ── Anomaly card ──────────────────────────────────────────────
function AnomalyCard({ anomalyData, cardIndex }) {
    const isCrit = anomalyData.severity === 'critical'
    return (
        <div
            className={`rounded-2xl border p-4 animate-slide-up card-hover ${isCrit ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
            style={{ animationDelay: `${cardIndex * 0.06}s` }}
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isCrit ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <AlertTriangle size={16} className={isCrit ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-sm">{anomalyData.department_name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${isCrit ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {anomalyData.severity}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{anomalyData.message}</p>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                        <Lightbulb size={11} className="text-sky-400 mt-0.5 shrink-0" />
                        <span>{anomalyData.suggested_action}</span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400">Current</p>
                    <p className="text-xl font-black text-slate-700 tabular-nums">
                        {anomalyData.current_value}
                        <span className="text-xs font-normal text-slate-400 ml-0.5">
                            {anomalyData.metric?.includes('Wait') ? 'min' : anomalyData.metric?.includes('Occupancy') ? '%' : ''}
                        </span>
                    </p>
                    <p className="text-[10px] text-slate-400">+{anomalyData.deviation_pct}% vs baseline</p>
                </div>
            </div>
        </div>
    )
}

// ── Department row ────────────────────────────────────────────
function DepartmentRow({ deptData, rowIndex }) {
    const statusColor = deptData.status === 'critical' ? 'border-l-red-500' : deptData.status === 'warning' ? 'border-l-amber-400' : 'border-l-emerald-400'
    const barColor    = deptData.bed_occupancy_pct >= 95 ? 'bg-red-500' : deptData.bed_occupancy_pct >= 85 ? 'bg-amber-400' : 'bg-sky-400'
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${statusColor} shadow-sm p-4 flex items-center gap-4 card-hover animate-slide-up`}
            style={{ animationDelay: `${rowIndex * 0.06}s` }}
        >
            <div className="w-44 shrink-0">
                <p className="font-extrabold text-slate-800 text-sm">{deptData.name}</p>
                <p className="text-xs text-slate-400">&nbsp;</p>
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Bed Occupancy</span>
                    <span className="font-bold">{deptData.bed_occupancy_pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full progress-bar animate-bar-fill ${barColor}`} style={{ width: `${deptData.bed_occupancy_pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{deptData.occupied_beds}/{deptData.total_beds} occupied</p>
            </div>
            <div className="w-20 text-center shrink-0">
                <p className="text-[10px] text-slate-400 mb-0.5">OPD Wait</p>
                <p className={`text-lg font-black tabular-nums ${deptData.wait_delta_pct >= 30 ? 'text-red-600' : deptData.wait_delta_pct >= 15 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {deptData.opd_wait_time_min}<span className="text-[10px] font-normal text-slate-400 ml-0.5">min</span>
                </p>
            </div>
            <div className="w-16 text-center shrink-0">
                <p className="text-[10px] text-slate-400 mb-0.5">Patients</p>
                <p className="text-lg font-black text-slate-700 tabular-nums">{deptData.opd_patients_today}</p>
            </div>
            <div className="w-20 text-center shrink-0">
                <p className="text-[10px] text-slate-400 mb-0.5">Satisfaction</p>
                <p className={`text-lg font-black tabular-nums ${deptData.patient_satisfaction >= 4.3 ? 'text-emerald-600' : deptData.patient_satisfaction >= 3.8 ? 'text-amber-600' : 'text-red-500'}`}>
                    ★ {deptData.patient_satisfaction}
                </p>
            </div>
            <div className="w-20 shrink-0">
                {deptData.anomalies?.length > 0 ? (
                    <div className="space-y-1">
                        {deptData.anomalies.map((a, i) => (
                            <span key={i} className={`block text-[10px] font-bold px-2 py-0.5 rounded-full text-center ${a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {a.severity}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-center">Normal</span>
                )}
            </div>
        </div>
    )
}

// ── Insight card ──────────────────────────────────────────────
function InsightCard({ insightData, cardIndex }) {
    const [expanded, setExpanded] = useState(false)
    const p = insightData.priority
    const style = p === 'critical'
        ? { border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', bg: 'bg-red-50/50' }
        : p === 'warning'
        ? { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', bg: 'bg-amber-50/50' }
        : { border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-400', bg: 'bg-sky-50/50' }
    return (
        <div
            className={`bg-white rounded-2xl border ${style.border} shadow-sm p-5 card-hover animate-slide-up cursor-pointer`}
            style={{ animationDelay: `${cardIndex * 0.07}s` }}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0 animate-pulse`} />
                    <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{insightData.title}</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 capitalize ${style.badge}`}>{insightData.priority}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{insightData.insight}</p>
            {expanded && (
                <div className="animate-slide-up">
                    <div className={`flex items-start gap-2 ${style.bg} rounded-xl px-3 py-2.5 mb-3`}>
                        <ChevronRight size={13} className="text-sky-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600">{insightData.recommended_action}</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400 capitalize">{insightData.department} · {insightData.category}</span>
                <span className="text-[10px] font-bold text-slate-600">Impact <span className="text-sky-600">{insightData.impact_score}/10</span></span>
            </div>
        </div>
    )
}

// ── Recommendation card ───────────────────────────────────────
function RecommendationCard({ recData, cardIndex, onDone }) {
    const [isDone, setIsDone] = useState(false)
    const urgStyle = recData.urgency === 'immediate'
        ? 'bg-red-100 text-red-700 border-red-200'
        : recData.urgency === 'today'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-sky-100 text-sky-700 border-sky-200'
    if (isDone) return null
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 card-hover animate-slide-up" style={{ animationDelay: `${cardIndex * 0.06}s` }}>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-slate-800 text-sm">{recData.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${urgStyle}`}>{recData.urgency.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{recData.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Owner: <span className="font-bold text-slate-600">{recData.owner}</span></span>
                    <span>Impact: <span className="font-bold text-sky-600">{recData.impact_score}/10</span></span>
                </div>
            </div>
            <button
                onClick={() => { setIsDone(true); onDone?.() }}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
                <CheckCircle size={12} /> Done
            </button>
        </div>
    )
}

// ── Finance tile ──────────────────────────────────────────────
function FinanceTile({ tileLabel, tileValue, tileSubtext, colorClass, icon: Icon, iconBg }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 stat-card">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{tileLabel}</p>
                {Icon && <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}><Icon size={14} className={colorClass} /></div>}
            </div>
            <p className={`text-2xl font-black tabular-nums ${colorClass}`}>{tileValue}</p>
            {tileSubtext && <p className="text-xs text-slate-400 mt-1">{tileSubtext}</p>}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout }) {
    const [summaryData, setSummaryData]     = useState(null)
    const [departmentList, setDeptList]     = useState([])
    const [kpiList, setKpiList]             = useState([])
    const [healthScore, setHealthScore]     = useState(null)
    const [anomalyList, setAnomalyList]     = useState([])
    const [insightList, setInsightList]     = useState([])
    const [recommendList, setRecommendList] = useState([])
    const [forecastData, setForecastData]   = useState(null)
    const [isLoading, setIsLoading]         = useState(true)
    const [fetchError, setFetchError]       = useState(null)
    const [lastRefresh, setLastRefresh]     = useState(new Date())
    const [activeSection, setActiveSection] = useState('health')
    const [showPatientMgmt, setShowPatientMgmt] = useState(false)
    const addToast = useToast()

    const loadAll = async () => {
        try {
            setFetchError(null)
            const [sumRes, deptRes, kpiRes, anomRes, insRes, recRes, foreRes] = await Promise.all([
                analyticsApi.getSummary(),
                analyticsApi.getDepartments(),
                analyticsApi.getKPIs(),
                insightsApi.getAnomalies(),
                insightsApi.getAIInsights(),
                insightsApi.getRecommendations(),
                analyticsApi.getForecast(),
            ])
            setSummaryData(sumRes.data)
            setDeptList(deptRes.data.departments || [])
            setKpiList(kpiRes.data.kpis || [])
            setHealthScore(kpiRes.data.health_score || null)
            setAnomalyList(anomRes.data.anomalies || [])
            setInsightList(insRes.data.insights || [])
            setRecommendList(recRes.data.recommendations || [])
            setForecastData(foreRes.data)
            setLastRefresh(new Date())
        } catch {
            setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadAll()
        const t = setInterval(loadAll, 30000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        if (!summaryData) return
        const OFFSET = 80
        const handleScroll = () => {
            let active = SIDEBAR_SECTIONS[0].sectionId
            for (const { sectionId } of SIDEBAR_SECTIONS) {
                const el = document.getElementById(sectionId)
                if (el && el.getBoundingClientRect().top <= 56 + OFFSET) active = sectionId
            }
            setActiveSection(active)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [summaryData])

    const scrollTo = (id) => {
        const el = document.getElementById(id)
        if (!el) return
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' })
        setActiveSection(id)
    }

    const financeData  = summaryData?.finance
    const criticalCount = anomalyList.filter(a => a.severity === 'critical').length
    const warningCount  = anomalyList.filter(a => a.severity === 'warning').length

    const forecastChartData = forecastData?.forecast_points?.map(fp => ({
        time: fp.forecast_time,
        bedOcc: fp.bed_occupancy, bedUpper: fp.bed_upper, bedLower: fp.bed_lower,
        waitTime: fp.opd_wait_min, patients: fp.opd_patients,
    })) || []

    // Build anomaly map for KPI overlay
    const anomalyMap = {}
    anomalyList.forEach(a => {
        const key = a.metric?.toLowerCase().replace(' ', '_')
        if (!anomalyMap[key]) anomalyMap[key] = a
    })

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* ── Navbar ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm shadow-sky-200 animate-pulse-ring">
                            <Activity size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-extrabold text-slate-800 text-sm tracking-tight">PrimeCare</span>
                            <span className="text-slate-400 text-sm"> · Receptionist Dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                            <div className="relative group">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 animate-pulse-ring-red cursor-help">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    {criticalCount} Critical
                                </span>
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-red-100 p-3 hidden group-hover:block z-50">
                                    <p className="text-xs font-bold text-slate-800 mb-2">Critical Anomalies</p>
                                    <div className="space-y-2">
                                        {anomalyList.filter(a => a.severity === 'critical').slice(0, 3).map((a, i) => (
                                            <div key={i} className="text-xs">
                                                <span className="font-semibold text-red-600">{a.department_name}:</span> <span className="text-slate-600">{a.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {warningCount > 0 && (
                            <div className="relative group">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 cursor-help">
                                    <AlertTriangle size={10} /> {warningCount} Warning
                                </span>
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-amber-100 p-3 hidden group-hover:block z-50">
                                    <p className="text-xs font-bold text-slate-800 mb-2">Warning Anomalies</p>
                                    <div className="space-y-2">
                                        {anomalyList.filter(a => a.severity === 'warning').slice(0, 3).map((a, i) => (
                                            <div key={i} className="text-xs">
                                                <span className="font-semibold text-amber-600">{a.department_name}:</span> <span className="text-slate-600">{a.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {lastRefresh.toLocaleTimeString()}
                        </span>
                        <NotificationsBell role="admin" />
                        <button
                            onClick={() => { loadAll(); addToast('Dashboard refreshed', 'info', 2000) }}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"
                        >
                            <RefreshCw size={14} />
                        </button>
                        {/* Manage Patients button */}
                        <button
                            onClick={() => setShowPatientMgmt(true)}
                            className="btn-primary hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold"
                        >
                            <UserCog size={13} /> Manage Patients
                        </button>
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Shield size={13} className="text-emerald-600" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-slate-700">Mr. Arvind Kumar</p>
                                <p className="text-[10px] text-slate-400">Receptionist</p>
                            </div>
                            <button onClick={onLogout} className="ml-1 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <LogOut size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

                {/* ── Sidebar ── */}
                <aside className="w-52 shrink-0 bg-white border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 hidden lg:block">
                    <nav className="px-3 space-y-0.5">
                        {SIDEBAR_SECTIONS.map(({ sectionId, label, Icon }) => (
                            <button
                                key={sectionId}
                                onClick={() => scrollTo(sectionId)}
                                className={`sidebar-link w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                                    ${activeSection === sectionId
                                        ? 'active bg-sky-50 text-sky-700 border border-sky-100'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                        <div className="pt-4 px-2">
                            <button
                                onClick={() => setShowPatientMgmt(true)}
                                className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold"
                            >
                                <UserCog size={12} /> Manage Patients
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* ── Main content ── */}
                <main className="flex-1 px-6 py-6">

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="mb-6 flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4">
                            <RefreshCw size={16} className="text-sky-500 animate-spin shrink-0" />
                            <p className="text-sm font-semibold text-sky-700">Connecting to hospital systems...</p>
                        </div>
                    )}

                    {/* Offline banner */}
                    {fetchError && !isLoading && (
                        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Backend offline — showing cached data</p>
                                <p className="text-xs text-amber-600 mt-0.5">Run: <code className="bg-amber-100 px-1 rounded">uvicorn main:app --reload --port 8000</code></p>
                            </div>
                            <button onClick={loadAll} className="ml-auto px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 border border-amber-300 shrink-0">Retry</button>
                        </div>
                    )}

                    {/* Health score */}
                    <DashboardSection sectionId="health" title="Hospital Performance Metrics" subtitle="Real-time weighted performance index">
                        {healthScore && (
                            <HealthScoreGauge scoreValue={healthScore.score} scoreGrade={healthScore.grade} scoreLabel={healthScore.label} />
                        )}
                    </DashboardSection>

                    {/* KPIs with overlays */}
                    <DashboardSection sectionId="kpis" title="Key Performance Indicators" subtitle="7-day trends with anomaly detection">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kpiList.map((kpi, i) => {
                                const anom = anomalyList.find(a =>
                                    a.metric?.toLowerCase().includes(kpi.label?.toLowerCase().split(' ')[0].toLowerCase())
                                )
                                const isAnomaly = !!anom || kpi.status === 'critical'

                                return (
                                    <KPIAlertOverlay
                                        key={kpi.id}
                                        isAnomaly={isAnomaly}
                                        severity={kpi.status}
                                        deviationPct={anom?.deviation_pct || Math.abs(kpi.delta_pct)}
                                        metricLabel={kpi.label}
                                        currentValue={`${kpi.value}${kpi.unit}`}
                                        aiInsight={anom?.message || ''}
                                        action={anom?.suggested_action || ''}
                                    >
                                        <KPICardInner kpiData={kpi} cardIndex={i} />
                                    </KPIAlertOverlay>
                                )
                            })}
                        </div>
                    </DashboardSection>

                    {/* Anomalies */}
                    <DashboardSection sectionId="anomalies" title="Active Anomalies" subtitle="Rule-based detection with 15% deviation threshold" anomalyCount={anomalyList.length}>
                        {anomalyList.length === 0 ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                                <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                                <p className="font-bold text-emerald-700">All metrics within normal range</p>
                                <p className="text-xs text-emerald-600 mt-1">No deviations detected in the past 24h</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {anomalyList.map((a, i) => <AnomalyCard key={a.anomaly_id} anomalyData={a} cardIndex={i} />)}
                            </div>
                        )}
                    </DashboardSection>

                    {/* Departments */}
                    <DashboardSection sectionId="departments" title="Department Overview" subtitle="All 6 departments — live metrics">
                        <div className="space-y-3">
                            {departmentList.map((d, i) => <DepartmentRow key={d.id} deptData={d} rowIndex={i} />)}
                        </div>
                    </DashboardSection>

                    {/* AI Insights */}
                    <DashboardSection sectionId="insights" title="AI Insights" subtitle="Groq-powered root cause analysis — click cards to expand">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {insightList.map((ins, i) => <InsightCard key={ins.insight_id} insightData={ins} cardIndex={i} />)}
                        </div>
                    </DashboardSection>

                    {/* Recommendations */}
                    <DashboardSection sectionId="recommendations" title="Recommendations" subtitle="Ranked corrective actions from anomaly analysis">
                        <div className="space-y-3">
                            {recommendList.map((rec, i) => (
                                <RecommendationCard
                                    key={rec.rec_id}
                                    recData={rec}
                                    cardIndex={i}
                                    onDone={() => addToast(`Action marked done: ${rec.title}`, 'success')}
                                />
                            ))}
                        </div>
                    </DashboardSection>

                    {/* 48hr Forecast */}
                    <DashboardSection sectionId="forecast" title="48-Hour Forecast" subtitle="Trend-based projection in 6-hour intervals">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <p className="text-sm font-extrabold text-slate-600 mb-4">Bed Occupancy Forecast (%)</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={forecastChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="forecast-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}    />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[50, 100]} />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px' }} />
                                    <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Critical 90%', fontSize: 10, fill: '#EF4444' }} />
                                    <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Warning 80%', fontSize: 10, fill: '#F59E0B' }} />
                                    <Area type="monotone" dataKey="bedUpper" stroke="none" fill="#E0F2FE" />
                                    <Area type="monotone" dataKey="bedOcc"   stroke="#0EA5E9" strokeWidth={2.5} fill="url(#forecast-grad)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="bedLower" stroke="none" fill="#ffffff" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <p className="text-sm font-extrabold text-slate-600 mt-6 mb-4">OPD Wait Time Forecast (min)</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={forecastChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px' }} />
                                    <ReferenceLine y={35} stroke="#EF4444" strokeDasharray="4 4" />
                                    <Line type="monotone" dataKey="waitTime" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardSection>

                    {/* Finance */}
                    <DashboardSection sectionId="finance" title="Finance Overview" subtitle="Today's revenue and billing summary">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FinanceTile tileLabel="Revenue Today" tileValue={`₹${financeData?.revenue_today_lakh}L`} tileSubtext="Across all departments" colorClass="text-emerald-600" icon={TrendingUp} iconBg="bg-emerald-50" />
                            <FinanceTile tileLabel="Revenue MTD"   tileValue={`₹${financeData?.revenue_mtd_lakh}L`} tileSubtext={`Target ₹${financeData?.revenue_target_lakh}L`} colorClass="text-sky-600" icon={BarChart3} iconBg="bg-sky-50" />
                            <FinanceTile tileLabel="Cost Per Patient" tileValue={`₹${financeData?.cost_per_patient?.toLocaleString()}`} tileSubtext="Average across OPD" colorClass="text-slate-700" icon={Users} iconBg="bg-slate-50" />
                            <FinanceTile tileLabel="Pending Bills"  tileValue={`₹${financeData?.pending_bills_lakh}L`} tileSubtext="Awaiting settlement" colorClass="text-amber-600" icon={Clock} iconBg="bg-amber-50" />
                        </div>
                    </DashboardSection>

                    {/* Workflow */}
                    <DashboardSection sectionId="workflow" title="Patient Workflow" subtitle="End-to-end clinical pipeline — admit, vitals, diagnose, pharmacy, billing, discharge">
                        <WorkflowPanel role="admin" />
                    </DashboardSection>

                </main>
            </div>

            {/* ── Patient Management Dialog ── */}
            {showPatientMgmt && (
                <PatientManagementDialog
                    onClose={() => setShowPatientMgmt(false)}
                    addToast={addToast}
                />
            )}
            <ChatBox role="admin" />
        </div>
    )
}
