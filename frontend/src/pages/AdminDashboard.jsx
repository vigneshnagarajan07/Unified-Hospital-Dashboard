// ─────────────────────────────────────────────────────────────
// Apollo Hospital | GKM_8 Intelligence Platform
// AdminDashboard.jsx — Full hospital overview for Admin / CEO
// Sections: Health Score, KPIs, Anomalies, Departments,
//           AI Insights, Recommendations, 48hr Forecast
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import {
    Activity, AlertTriangle, BedDouble, Clock,
    Users, TrendingUp, TrendingDown, RefreshCw,
    BarChart3, Brain, Lightbulb, CheckCircle,
    ChevronRight, LogOut, Scissors, Shield,
    DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
    AreaChart, Area, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { analyticsApi, insightsApi } from '../api/client'


// ─── Sidebar nav items ────────────────────────────────────────

const SIDEBAR_SECTIONS = [
    { sectionId: 'health', label: 'Health Score', Icon: Activity },
    { sectionId: 'kpis', label: 'KPIs', Icon: BarChart3 },
    { sectionId: 'anomalies', label: 'Anomalies', Icon: AlertTriangle },
    { sectionId: 'departments', label: 'Departments', Icon: BedDouble },
    { sectionId: 'insights', label: 'AI Insights', Icon: Brain },
    { sectionId: 'recommendations', label: 'Recommendations', Icon: Lightbulb },
    { sectionId: 'forecast', label: '48hr Forecast', Icon: TrendingUp },
    { sectionId: 'finance', label: 'Finance', Icon: DollarSign },
]


// ─── Helper : Section wrapper ─────────────────────────────────

function DashboardSection({ sectionId, title, subtitle, children, anomalyCount }) {
    return (
        <section id={sectionId} className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {anomalyCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        {anomalyCount} alert{anomalyCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            {children}
        </section>
    )
}


// ─── Helper : Health Score SVG Gauge ─────────────────────────

function HealthScoreGauge({ scoreValue, scoreGrade, scoreLabel }) {

    const gaugeColor = scoreValue >= 85 ? '#10B981'
        : scoreValue >= 70 ? '#0EA5E9'
            : scoreValue >= 55 ? '#F59E0B'
                : '#EF4444'

    const trackColor = scoreValue >= 85 ? '#D1FAE5'
        : scoreValue >= 70 ? '#E0F2FE'
            : scoreValue >= 55 ? '#FEF3C7'
                : '#FEE2E2'

    // SVG arc math
    const radius = 54
    const centerX = 72
    const centerY = 72
    const startAngleDeg = -210
    const endAngleDeg = 30
    const totalArcDeg = endAngleDeg - startAngleDeg
    const fillArcDeg = (scoreValue / 100) * totalArcDeg
    const toRad = (deg) => (deg * Math.PI) / 180

    const arcPath = (startDeg, endDeg, r) => {
        const startPoint = {
            x: centerX + r * Math.cos(toRad(startDeg)),
            y: centerY + r * Math.sin(toRad(startDeg)),
        }
        const endPoint = {
            x: centerX + r * Math.cos(toRad(endDeg)),
            y: centerY + r * Math.sin(toRad(endDeg)),
        }
        const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0
        return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-8">

            {/* SVG Gauge */}
            <div className="shrink-0">
                <svg width="144" height="104" viewBox="0 0 144 104">
                    <path d={arcPath(startAngleDeg, endAngleDeg, radius)} fill="none" stroke={trackColor} strokeWidth="10" strokeLinecap="round" />
                    <path d={arcPath(startAngleDeg, startAngleDeg + fillArcDeg, radius)} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
                    <text x="72" y="74" textAnchor="middle" fontSize="24" fontWeight="800" fill={gaugeColor} fontFamily="DM Sans">{scoreValue}</text>
                    <text x="72" y="88" textAnchor="middle" fontSize="10" fill="#94A3B8" fontFamily="DM Sans">/ 100</text>
                </svg>
            </div>

            {/* Score details */}
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
                    Hospital Health Score
                </p>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black" style={{ color: gaugeColor }}>
                        {scoreGrade}
                    </span>
                    <span className="text-lg font-semibold" style={{ color: gaugeColor }}>
                        {scoreLabel}
                    </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Weighted across bed occupancy (30%), OPD wait (25%), patient satisfaction (25%), surgery completion (20%)
                </p>
            </div>

        </div>
    )
}


// ─── Helper : KPI Card with sparkline ────────────────────────

function KPICard({ kpiData, cardIndex }) {

    const statusColors = {
        normal: { bg: 'bg-emerald-50', border: 'border-emerald-100', value: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', line: '#10B981' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-100', value: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', line: '#F59E0B' },
        critical: { bg: 'bg-red-50', border: 'border-red-100', value: 'text-red-700', badge: 'bg-red-100 text-red-700', line: '#EF4444' },
    }

    const colorSet = statusColors[kpiData.status] || statusColors.normal
    const isPositive = kpiData.delta_pct > 0
    const deltaIsGood = kpiData.higher_is_worse ? !isPositive : isPositive

    const chartData = kpiData.trend?.map((trendValue, trendIndex) => ({
        value: trendValue,
        date: kpiData.dates?.[trendIndex] || trendIndex,
    })) || []

    return (
        <div
            className={`bg-white rounded-2xl border ${colorSet.border} shadow-sm hover:shadow-md transition-all overflow-hidden animate-slide-up`}
            style={{ animationDelay: `${cardIndex * 0.07}s`, opacity: 0, animationFillMode: 'forwards' }}
        >
            {/* Top section */}
            <div className={`${colorSet.bg} px-4 pt-4 pb-3`}>
                <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                        {kpiData.label}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorSet.badge} capitalize`}>
                        {kpiData.status}
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black tabular-nums ${colorSet.value}`}>
                        {kpiData.value}
                    </span>
                    <span className="text-sm text-slate-400">{kpiData.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{kpiData.description}</p>
            </div>

            {/* Sparkline */}
            <div className="px-2 py-2">
                <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`kpi-grad-${kpiData.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colorSet.line} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={colorSet.line} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px', padding: '4px 8px' }}
                            formatter={(v) => [v, kpiData.label]}
                            labelFormatter={(l) => l}
                        />
                        <Area type="monotone" dataKey="value" stroke={colorSet.line} strokeWidth={2} fill={`url(#kpi-grad-${kpiData.id})`} dot={false} activeDot={{ r: 3 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Delta footer */}
            <div className="px-4 pb-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Baseline <span className="font-semibold text-slate-600">{kpiData.baseline}{kpiData.unit}</span>
                </span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${deltaIsGood ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpiData.delta_pct > 0 ? '+' : ''}{kpiData.delta_pct}%
                </span>
            </div>

        </div>
    )
}


// ─── Helper : Anomaly Alert Card ──────────────────────────────

function AnomalyCard({ anomalyData, cardIndex }) {

    const severityStyle = anomalyData.severity === 'critical'
        ? 'border-red-200 bg-red-50'
        : 'border-amber-200 bg-amber-50'

    const badgeStyle = anomalyData.severity === 'critical'
        ? 'bg-red-100 text-red-700 border-red-200'
        : 'bg-amber-100 text-amber-700 border-amber-200'

    const iconColor = anomalyData.severity === 'critical'
        ? 'text-red-500'
        : 'text-amber-500'

    return (
        <div
            className={`rounded-2xl border ${severityStyle} p-4 animate-slide-up`}
            style={{ animationDelay: `${cardIndex * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
        >
            <div className="flex items-start gap-3">

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${anomalyData.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                    <AlertTriangle size={16} className={iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{anomalyData.department_name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${badgeStyle}`}>
                            {anomalyData.severity}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{anomalyData.message}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Lightbulb size={11} className="text-sky-400" />
                        <span>{anomalyData.suggested_action}</span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Current</p>
                    <p className="text-lg font-black text-slate-700 tabular-nums">
                        {anomalyData.current_value}
                        <span className="text-xs font-normal text-slate-400 ml-0.5">
                            {anomalyData.metric.includes('Wait') ? 'min' : anomalyData.metric.includes('Occupancy') ? '%' : ''}
                        </span>
                    </p>
                    <p className="text-xs text-slate-400">
                        +{anomalyData.deviation_pct}% vs baseline
                    </p>
                </div>

            </div>
        </div>
    )
}


// ─── Helper : Department Row ──────────────────────────────────

function DepartmentRow({ deptData, rowIndex }) {

    const rowStatusColor = deptData.status === 'critical' ? 'border-l-red-500'
        : deptData.status === 'warning' ? 'border-l-amber-400'
            : 'border-l-emerald-400'

    const occupancyBarColor = deptData.bed_occupancy_pct >= 95 ? 'bg-red-500'
        : deptData.bed_occupancy_pct >= 85 ? 'bg-amber-400'
            : 'bg-sky-400'

    return (
        <div
            className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${rowStatusColor} shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all animate-slide-up`}
            style={{ animationDelay: `${rowIndex * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
        >

            {/* Dept name */}
            <div className="w-48 shrink-0">
                <p className="font-bold text-slate-800 text-sm">{deptData.name}</p>
                <p className="text-xs text-slate-400">{deptData.head_doctor_name}</p>
            </div>

            {/* Bed occupancy bar */}
            <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Beds</span>
                    <span className="font-bold">{deptData.bed_occupancy_pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${occupancyBarColor}`}
                        style={{ width: `${deptData.bed_occupancy_pct}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                    {deptData.occupied_beds}/{deptData.total_beds} occupied
                </p>
            </div>

            {/* OPD Wait */}
            <div className="w-24 text-center shrink-0">
                <p className="text-xs text-slate-400 mb-0.5">OPD Wait</p>
                <p className={`text-lg font-black tabular-nums ${deptData.wait_delta_pct >= 30 ? 'text-red-600'
                    : deptData.wait_delta_pct >= 15 ? 'text-amber-600'
                        : 'text-slate-700'
                    }`}>
                    {deptData.opd_wait_time_min}
                    <span className="text-xs font-normal text-slate-400 ml-0.5">min</span>
                </p>
            </div>

            {/* Patients */}
            <div className="w-20 text-center shrink-0">
                <p className="text-xs text-slate-400 mb-0.5">Patients</p>
                <p className="text-lg font-black text-slate-700 tabular-nums">
                    {deptData.opd_patients_today}
                </p>
            </div>

            {/* Satisfaction */}
            <div className="w-20 text-center shrink-0">
                <p className="text-xs text-slate-400 mb-0.5">Satisfaction</p>
                <p className={`text-lg font-black tabular-nums ${deptData.patient_satisfaction >= 4.3 ? 'text-emerald-600'
                    : deptData.patient_satisfaction >= 3.8 ? 'text-amber-600'
                        : 'text-red-500'
                    }`}>
                    ★ {deptData.patient_satisfaction}
                </p>
            </div>

            {/* Anomaly badges */}
            <div className="w-24 shrink-0">
                {deptData.anomalies?.length > 0 ? (
                    <div className="space-y-1">
                        {deptData.anomalies.map((anomalyItem, anomalyIdx) => (
                            <span
                                key={anomalyIdx}
                                className={`block text-xs font-bold px-2 py-0.5 rounded-full text-center ${anomalyItem.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}
                            >
                                {anomalyItem.severity}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-center">
                        Normal
                    </span>
                )}
            </div>

        </div>
    )
}


// ─── Helper : AI Insight Card ─────────────────────────────────

function InsightCard({ insightData, cardIndex }) {

    const priorityStyle = insightData.priority === 'critical'
        ? { border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
        : insightData.priority === 'warning'
            ? { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
            : { border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-400' }

    return (
        <div
            className={`bg-white rounded-2xl border ${priorityStyle.border} shadow-sm p-5 animate-slide-up`}
            style={{ animationDelay: `${cardIndex * 0.07}s`, opacity: 0, animationFillMode: 'forwards' }}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityStyle.dot} shrink-0`} />
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">
                        {insightData.title}
                    </h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 capitalize ${priorityStyle.badge}`}>
                    {insightData.priority}
                </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {insightData.insight}
            </p>

            <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <ChevronRight size={13} className="text-sky-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600">{insightData.recommended_action}</p>
            </div>

            <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400 capitalize">
                    {insightData.department} · {insightData.category}
                </span>
                <span className="text-xs font-bold text-slate-600">
                    Impact <span className="text-sky-600">{insightData.impact_score}/10</span>
                </span>
            </div>

        </div>
    )
}


// ─── Helper : Recommendation Card ────────────────────────────

function RecommendationCard({ recData, cardIndex }) {

    const [isDone, setIsDone] = useState(false)

    const urgencyStyle = recData.urgency === 'immediate'
        ? 'bg-red-100 text-red-700 border-red-200'
        : recData.urgency === 'today'
            ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-sky-100 text-sky-700 border-sky-200'

    if (isDone) return null

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 animate-slide-up"
            style={{ animationDelay: `${cardIndex * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-sm">{recData.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${urgencyStyle}`}>
                        {recData.urgency.replace('_', ' ')}
                    </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{recData.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Owner: <span className="font-semibold text-slate-600">{recData.owner}</span></span>
                    <span>Impact: <span className="font-semibold text-sky-600">{recData.impact_score}/10</span></span>
                </div>
            </div>
            <button
                onClick={() => setIsDone(true)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
                <CheckCircle size={12} /> Done
            </button>
        </div>
    )
}


// ─── Helper : Finance Tile ────────────────────────────────────

function FinanceTile({ tileLabel, tileValue, tileSubtext, colorClass }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">{tileLabel}</p>
            <p className={`text-2xl font-black tabular-nums ${colorClass}`}>{tileValue}</p>
            {tileSubtext && <p className="text-xs text-slate-400 mt-1">{tileSubtext}</p>}
        </div>
    )
}


// ─── Main Admin Dashboard ─────────────────────────────────────

export default function AdminDashboard({ onLogout }) {

    // ── State ──────────────────────────────────────────────────
    const [summaryData, setSummaryData] = useState(null)
    const [departmentList, setDepartmentList] = useState([])
    const [kpiList, setKpiList] = useState([])
    const [healthScore, setHealthScore] = useState(null)
    const [anomalyList, setAnomalyList] = useState([])
    const [insightList, setInsightList] = useState([])
    const [recommendList, setRecommendList] = useState([])
    const [forecastData, setForecastData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
    const [activeSidebarItem, setActiveSidebarItem] = useState('health')


    // ── Data fetching ──────────────────────────────────────────
    const loadAllDashboardData = async () => {
        try {
            setFetchError(null)

            const [
                summaryRes,
                deptsRes,
                kpisRes,
                anomaliesRes,
                insightsRes,
                recommendRes,
                forecastRes,
            ] = await Promise.all([
                analyticsApi.getSummary(),
                analyticsApi.getDepartments(),
                analyticsApi.getKPIs(),
                insightsApi.getAnomalies(),
                insightsApi.getAIInsights(),
                insightsApi.getRecommendations(),
                analyticsApi.getForecast(),
            ])

            setSummaryData(summaryRes.data)
            setDepartmentList(deptsRes.data.departments)
            setKpiList(kpisRes.data.kpis)
            setHealthScore(kpisRes.data.health_score)
            setAnomalyList(anomaliesRes.data.anomalies)
            setInsightList(insightsRes.data.insights)
            setRecommendList(recommendRes.data.recommendations)
            setForecastData(forecastRes.data)
            setLastRefreshTime(new Date())

        } catch (loadError) {
            setFetchError('Cannot connect to backend. Make sure FastAPI is running on port 8000.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadAllDashboardData()
        const refreshTimer = setInterval(loadAllDashboardData, 30000)
        return () => clearInterval(refreshTimer)
    }, [])


    // ── Scroll to section on sidebar click ────────────────────
    const scrollToSection = (sectionId) => {
        setActiveSidebarItem(sectionId)
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }


    // ── Loading state ──────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw size={24} className="text-sky-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">Loading Apollo Hospital data...</p>
            </div>
        </div>
    )


    // ── Error state ────────────────────────────────────────────
    if (fetchError) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
                <p className="font-bold text-red-700 mb-2">Backend Connection Failed</p>
                <p className="text-red-500 text-sm mb-4">{fetchError}</p>
                <code className="block bg-red-50 text-red-400 text-xs px-4 py-2 rounded-xl mb-4">
                    uvicorn main:app --reload --port 8000
                </code>
                <button
                    onClick={loadAllDashboardData}
                    className="px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    )


    // ── Derived values ─────────────────────────────────────────
    const hospitalInfo = summaryData?.hospital
    const financeData = summaryData?.finance
    const criticalCount = anomalyList.filter(a => a.severity === 'critical').length
    const warningCount = anomalyList.filter(a => a.severity === 'warning').length

    // Forecast chart data
    const forecastChartData = forecastData?.forecast_points?.map(fp => ({
        time: fp.forecast_time,
        bedOcc: fp.bed_occupancy,
        bedUpper: fp.bed_upper,
        bedLower: fp.bed_lower,
        waitTime: fp.opd_wait_min,
        patients: fp.opd_patients,
    })) || []


    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* ── Top Navbar ── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                            <Activity size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm">Apollo Hospital</span>
                            <span className="text-slate-400 text-sm"> · Admin Dashboard</span>
                        </div>
                    </div>

                    {/* Alerts + refresh + user */}
                    <div className="flex items-center gap-3">

                        {/* Anomaly badges */}
                        {criticalCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                {criticalCount} Critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                                <AlertTriangle size={11} />
                                {warningCount} Warning
                            </span>
                        )}

                        {/* Live indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            {lastRefreshTime.toLocaleTimeString()}
                        </div>

                        {/* Refresh button */}
                        <button
                            onClick={loadAllDashboardData}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-sky-500 hover:bg-slate-50 transition-all"
                        >
                            <RefreshCw size={14} />
                        </button>

                        {/* User + logout */}
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Shield size={14} className="text-emerald-600" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-slate-700">Mr. Arvind Kumar</p>
                                <p className="text-xs text-slate-400">Administrator</p>
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


            {/* ── Body : Sidebar + Content ── */}
            <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

                {/* ── Sidebar ── */}
                <aside className="w-52 shrink-0 bg-white border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 hidden lg:block">
                    <nav className="px-3 space-y-1">
                        {SIDEBAR_SECTIONS.map(({ sectionId, label, Icon }) => (
                            <button
                                key={sectionId}
                                onClick={() => scrollToSection(sectionId)}
                                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activeSidebarItem === sectionId
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
                </aside>


                {/* ── Main Content ── */}
                <main className="flex-1 px-6 py-6 overflow-y-auto">


                    {/* ── Section 1 : Health Score ── */}
                    <DashboardSection
                        sectionId="health"
                        title="Hospital Health Score"
                        subtitle="Real-time weighted performance index"
                    >
                        {healthScore && (
                            <HealthScoreGauge
                                scoreValue={healthScore.score}
                                scoreGrade={healthScore.grade}
                                scoreLabel={healthScore.label}
                            />
                        )}
                    </DashboardSection>


                    {/* ── Section 2 : KPIs ── */}
                    <DashboardSection
                        sectionId="kpis"
                        title="Key Performance Indicators"
                        subtitle="7-day trends with baseline comparison"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kpiList.map((kpiItem, kpiIndex) => (
                                <KPICard key={kpiItem.id} kpiData={kpiItem} cardIndex={kpiIndex} />
                            ))}
                        </div>
                    </DashboardSection>


                    {/* ── Section 3 : Anomalies ── */}
                    <DashboardSection
                        sectionId="anomalies"
                        title="Active Anomalies"
                        subtitle="Rule-based detection across all departments"
                        anomalyCount={anomalyList.length}
                    >
                        {anomalyList.length === 0 ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                                <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-emerald-700">All metrics within normal range</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {anomalyList.map((anomalyItem, anomalyIndex) => (
                                    <AnomalyCard
                                        key={anomalyItem.anomaly_id}
                                        anomalyData={anomalyItem}
                                        cardIndex={anomalyIndex}
                                    />
                                ))}
                            </div>
                        )}
                    </DashboardSection>


                    {/* ── Section 4 : Departments ── */}
                    <DashboardSection
                        sectionId="departments"
                        title="Department Overview"
                        subtitle="All 6 departments — live metrics"
                    >
                        <div className="space-y-3">
                            {departmentList.map((deptItem, deptIndex) => (
                                <DepartmentRow
                                    key={deptItem.id}
                                    deptData={deptItem}
                                    rowIndex={deptIndex}
                                />
                            ))}
                        </div>
                    </DashboardSection>


                    {/* ── Section 5 : AI Insights ── */}
                    <DashboardSection
                        sectionId="insights"
                        title="AI Insights"
                        subtitle="Groq-powered analysis of live hospital data"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {insightList.map((insightItem, insightIndex) => (
                                <InsightCard
                                    key={insightItem.insight_id}
                                    insightData={insightItem}
                                    cardIndex={insightIndex}
                                />
                            ))}
                        </div>
                    </DashboardSection>


                    {/* ── Section 6 : Recommendations ── */}
                    <DashboardSection
                        sectionId="recommendations"
                        title="Recommendations"
                        subtitle="Actionable items from anomaly analysis"
                    >
                        <div className="space-y-3">
                            {recommendList.map((recItem, recIndex) => (
                                <RecommendationCard
                                    key={recItem.rec_id}
                                    recData={recItem}
                                    cardIndex={recIndex}
                                />
                            ))}
                        </div>
                    </DashboardSection>


                    {/* ── Section 7 : 48hr Forecast ── */}
                    <DashboardSection
                        sectionId="forecast"
                        title="48-Hour Forecast"
                        subtitle="Trend-based projection in 6-hour intervals"
                    >
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <p className="text-sm font-semibold text-slate-600 mb-4">
                                Bed Occupancy Forecast (%)
                            </p>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={forecastChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="forecast-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[50, 100]} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px' }}
                                    />
                                    <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Critical 90%', fontSize: 10, fill: '#EF4444' }} />
                                    <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Warning 80%', fontSize: 10, fill: '#F59E0B' }} />
                                    <Area type="monotone" dataKey="bedUpper" stroke="none" fill="#E0F2FE" />
                                    <Area type="monotone" dataKey="bedOcc" stroke="#0EA5E9" strokeWidth={2} fill="url(#forecast-grad)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="bedLower" stroke="none" fill="#ffffff" />
                                </AreaChart>
                            </ResponsiveContainer>

                            <p className="text-sm font-semibold text-slate-600 mt-6 mb-4">
                                OPD Wait Time Forecast (min)
                            </p>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={forecastChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px' }}
                                    />
                                    <ReferenceLine y={35} stroke="#EF4444" strokeDasharray="4 4" />
                                    <Line type="monotone" dataKey="waitTime" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardSection>


                    {/* ── Section 8 : Finance ── */}
                    <DashboardSection
                        sectionId="finance"
                        title="Finance Overview"
                        subtitle="Today's revenue and billing summary"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FinanceTile
                                tileLabel="Revenue Today"
                                tileValue={`₹${financeData?.revenue_today_lakh}L`}
                                tileSubtext="Across all departments"
                                colorClass="text-emerald-600"
                            />
                            <FinanceTile
                                tileLabel="Revenue MTD"
                                tileValue={`₹${financeData?.revenue_mtd_lakh}L`}
                                tileSubtext={`Target ₹${financeData?.revenue_target_lakh}L`}
                                colorClass="text-sky-600"
                            />
                            <FinanceTile
                                tileLabel="Cost Per Patient"
                                tileValue={`₹${financeData?.cost_per_patient?.toLocaleString()}`}
                                tileSubtext="Average across OPD"
                                colorClass="text-slate-700"
                            />
                            <FinanceTile
                                tileLabel="Pending Bills"
                                tileValue={`₹${financeData?.pending_bills_lakh}L`}
                                tileSubtext="Awaiting settlement"
                                colorClass="text-amber-600"
                            />
                        </div>
                    </DashboardSection>


                </main>
            </div>
        </div>
    )
}