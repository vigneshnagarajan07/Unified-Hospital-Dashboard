// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// KPIAlertOverlay.jsx — Anomaly highlight wrapper
// Wraps any KPI card with red-glow border + AI tooltip
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { AlertTriangle, Lightbulb, TrendingUp, TrendingDown, X } from 'lucide-react'

/**
 * Props:
 *   isAnomaly    — bool: whether to show alert styling
 *   severity     — "critical" | "warning" | "normal"
 *   deviationPct — number, e.g. 38
 *   metricLabel  — e.g. "OPD Wait Time"
 *   currentValue — e.g. "47 min"
 *   aiInsight    — AI-generated explanation string
 *   action       — recommended action string
 *   children     — the KPI card JSX
 */
export default function KPIAlertOverlay({
  isAnomaly = false,
  severity  = 'normal',
  deviationPct = 0,
  metricLabel  = '',
  currentValue = '',
  aiInsight    = '',
  action       = '',
  children,
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  if (!isAnomaly) return <>{children}</>

  const isCritical = severity === 'critical'

  const borderColor = isCritical
    ? 'border-red-300'
    : 'border-amber-300'

  const glowClass = isCritical
    ? 'kpi-anomaly'       /* CSS: glow-red animation */
    : ''

  const badgeColor = isCritical
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-amber-100 text-amber-700 border-amber-200'

  const iconColor = isCritical ? 'text-red-500' : 'text-amber-500'
  const tooltipBorder = isCritical ? 'border-red-200' : 'border-amber-200'
  const tooltipBg = isCritical ? 'bg-red-50' : 'bg-amber-50'
  const actionBg  = isCritical ? 'bg-red-100/60' : 'bg-amber-100/60'

  const directionIcon = deviationPct > 0
    ? <TrendingUp size={11} />
    : <TrendingDown size={11} />

  return (
    <div className="relative">
      {/* ── Anomaly wrapper ── */}
      <div
        className={`relative rounded-2xl border-2 ${borderColor} ${glowClass} transition-all`}
        style={{ isolation: 'isolate' }}
      >
        {/* ── Warning badge top-right ── */}
        <button
          onClick={() => setTooltipOpen(!tooltipOpen)}
          className={`absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform ${badgeColor}`}
          title="View AI Insight"
        >
          <AlertTriangle size={9} className={iconColor} />
          {deviationPct > 0 ? '+' : ''}{deviationPct}% vs baseline
        </button>

        {children}
      </div>

      {/* ── Floating AI Insight Tooltip ── */}
      {tooltipOpen && (
        <div
          className={`absolute z-50 w-72 rounded-2xl border ${tooltipBorder} shadow-xl p-4 mt-2 animate-scale-in`}
          style={{
            top: '100%',
            right: 0,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
                <AlertTriangle size={13} className={iconColor} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">{metricLabel}</p>
                <p className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                  {directionIcon}
                  {currentValue} · {deviationPct > 0 ? '+' : ''}{deviationPct}% vs last week
                </p>
              </div>
            </div>
            <button
              onClick={() => setTooltipOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors ml-2"
            >
              <X size={12} className="text-slate-400" />
            </button>
          </div>

          {/* AI Insight */}
          {aiInsight && (
            <div className={`rounded-xl p-3 mb-2 ${tooltipBg} border ${tooltipBorder}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                AI Insight
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">{aiInsight}</p>
            </div>
          )}

          {/* Recommended Action */}
          {action && (
            <div className={`rounded-xl px-3 py-2 ${actionBg} flex items-start gap-2`}>
              <Lightbulb size={11} className="text-sky-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Recommended: </span>
                {action}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
