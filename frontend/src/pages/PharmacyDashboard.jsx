// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// PharmacyDashboard.jsx — Pharmacy / Billing Counter
// Features: Prescription queue, dispense medications,
//           generate invoices, payment tracking, revenue summary
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import {
  Pill, CreditCard, CheckCircle, Clock, AlertTriangle,
  RefreshCw, LogOut, Bell, X, DollarSign, Package,
  Users, TrendingUp, Receipt, FileText, Search, Filter
} from 'lucide-react'
import { workflowApi } from '../api/client'

// ── Order Card ────────────────────────────────────────────────
function OrderCard({ order, onDispense, dispensing }) {
  const isPending = order.status === 'pending'

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isPending ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50 opacity-80'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPending ? 'bg-amber-100' : 'bg-emerald-100'
        }`}>
          <Pill size={18} className={isPending ? 'text-amber-600' : 'text-emerald-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-slate-800 text-sm">{order.medication}</p>
            <span className="text-xs text-slate-500 font-medium">{order.dose}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>{isPending ? 'Pending' : 'Dispensed'}</span>
          </div>
          <p className="text-xs text-slate-600 mb-0.5">
            <span className="font-semibold">{order.patient_name}</span> · {order.department}
          </p>
          <p className="text-xs text-slate-400">{order.frequency} · {order.duration} · {order.instructions}</p>
          <p className="text-xs text-slate-400 mt-1">
            Ordered by {order.ordered_by} · {new Date(order.ordered_at).toLocaleTimeString()}
          </p>
          {order.dispensed_at && (
            <p className="text-xs text-emerald-600 mt-0.5">
              Dispensed by {order.dispensed_by} at {new Date(order.dispensed_at).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-slate-700">₹{order.amount?.toLocaleString()}</p>
          {isPending && (
            <button
              onClick={() => onDispense(order.order_id, order.medication)}
              disabled={dispensing === order.order_id}
              className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {dispensing === order.order_id
                ? <RefreshCw size={11} className="animate-spin" />
                : <CheckCircle size={11} />}
              {dispensing === order.order_id ? 'Dispensing...' : 'Dispense'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Patient Bill Card ─────────────────────────────────────────
function PatientBillCard({ patient, billing }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            patient.status === 'discharged' ? 'bg-slate-100' : 'bg-sky-100'
          }`}>
            <Users size={15} className={patient.status === 'discharged' ? 'text-slate-500' : 'text-sky-600'} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 text-sm">{patient.name}</p>
            <p className="text-xs text-slate-400">{patient.patient_id} · {patient.department_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-slate-800">₹{billing?.total_billed?.toLocaleString() || 0}</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            patient.status === 'discharged' ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700'
          }`}>{patient.status === 'discharged' ? 'Discharged' : 'Admitted'}</span>
        </div>
      </button>

      {expanded && billing && (
        <div className="border-t border-slate-100 px-5 py-4">
          {/* Bill breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-slate-50 rounded-xl py-3">
              <p className="text-xs text-slate-400">Total Billed</p>
              <p className="text-lg font-black text-slate-800">₹{billing.total_billed?.toLocaleString()}</p>
            </div>
            <div className="text-center bg-emerald-50 rounded-xl py-3">
              <p className="text-xs text-slate-400">Insurance</p>
              <p className="text-lg font-black text-emerald-600">₹{billing.insurance_covered?.toLocaleString()}</p>
            </div>
            <div className="text-center bg-red-50 rounded-xl py-3">
              <p className="text-xs text-slate-400">Patient Due</p>
              <p className="text-lg font-black text-red-600">₹{billing.patient_due?.toLocaleString()}</p>
            </div>
          </div>

          {/* Transactions */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Line Items</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {billing.transactions?.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-700">{t.description}</p>
                  <p className="text-slate-400 capitalize">{t.category}</p>
                </div>
                <span className="font-bold text-emerald-700">+₹{t.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Insurance info */}
          <p className="text-xs text-slate-400 mt-3">
            Insurance: <span className="font-semibold text-slate-600">{billing.insurance_provider || 'None'}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Pharmacy Dashboard ───────────────────────────────────
export default function PharmacyDashboard({ onLogout }) {
  const [orders,      setOrders]      = useState([])
  const [patients,    setPatients]    = useState([])
  const [billingSummary, setBilling]  = useState(null)
  const [notifications, setNotifs]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [dispensing,  setDispensing]  = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [activeTab,   setActiveTab]   = useState('queue')
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [searchTerm,  setSearch]      = useState('')
  const [filterStatus,setFilter]      = useState('all')
  const [patientBills, setPatientBills] = useState({})

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [ordersRes, patientsRes, billingRes, notifsRes] = await Promise.all([
        workflowApi.getPharmacyQueue(),
        workflowApi.getWorkflowPatients(),
        workflowApi.getBillingSummary(),
        workflowApi.getNotifications('pharmacy'),
      ])
      setOrders(ordersRes.data?.orders || [])
      setPatients(patientsRes.data?.patients || [])
      setBilling(billingRes.data)
      setNotifs(notifsRes.data?.notifications || [])
      setLastRefresh(new Date())

      // Load billing for each patient
      const bills = {}
      for (const p of patientsRes.data?.patients || []) {
        try {
          const res = await workflowApi.getPatientBilling(p.patient_id)
          bills[p.patient_id] = res.data
        } catch { /* silent */ }
      }
      setPatientBills(bills)
    } catch (err) {
      setError('Backend offline — start with: uvicorn main:app --reload --port 8000')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 20000)
    return () => clearInterval(t)
  }, [loadData])

  const handleDispense = async (orderId, medName) => {
    setDispensing(orderId)
    try {
      await workflowApi.dispenseMedication(orderId, { dispensed_by: 'Pharmacist' })
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: 'dispensed', dispensed_by: 'Pharmacist', dispensed_at: new Date().toISOString() } : o))
      await loadData()  // refresh billing
    } catch (err) {
      alert('Failed to dispense: ' + (err.response?.data?.detail || err.message))
    } finally {
      setDispensing(null)
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchTerm || o.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.medication?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchFilter
  })

  const pending   = orders.filter(o => o.status === 'pending')
  const dispensed = orders.filter(o => o.status === 'dispensed')
  const totalRevenue = orders.filter(o => o.status === 'dispensed').reduce((sum, o) => sum + (o.amount || 0), 0)
  const unreadCount  = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Pill size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">PrimeCare</span>
              <span className="text-slate-400 text-sm"> · Pharmacy & Billing</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                {pending.length} Pending
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {lastRefresh.toLocaleTimeString()}
            </span>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(o => !o)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">Pharmacy Notifications</p>
                    <button onClick={() => setShowNotifs(false)}><X size={13} className="text-slate-400" /></button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-6">No notifications</p>
                      : notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 text-xs">
                            <p className="text-slate-700 leading-relaxed">{n.message}</p>
                            <p className="text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
            <button onClick={loadData} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
              <RefreshCw size={14} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Pill size={14} className="text-emerald-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">PrimeCare Pharmacy</p>
                <p className="text-xs text-slate-400">Billing Counter</p>
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
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Backend not connected</p>
              <p className="text-xs text-amber-600 mt-0.5">{error}</p>
            </div>
            <button onClick={loadData} className="ml-auto px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 border border-amber-300 shrink-0">Retry</button>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Orders',   value: pending.length,               color: 'amber',  Icon: Clock       },
            { label: 'Dispensed Today',  value: dispensed.length,             color: 'emerald',Icon: CheckCircle },
            { label: 'Pharmacy Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'sky', Icon: TrendingUp },
            { label: 'Active Patients',  value: patients.filter(p => p.status === 'admitted').length, color: 'violet', Icon: Users },
          ].map(tile => (
            <div key={tile.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tile.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${tile.color}-100`}>
                  <tile.Icon size={14} className={`text-${tile.color}-600`} />
                </div>
              </div>
              <p className={`text-2xl font-black tabular-nums text-${tile.color}-600`}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'queue',   label: 'Prescription Queue', Icon: Package  },
            { id: 'billing', label: 'Patient Billing',    Icon: Receipt  },
            { id: 'summary', label: 'Revenue Summary',    Icon: DollarSign},
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              <tab.Icon size={14} /> {tab.label}
              {tab.id === 'queue' && pending.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Prescription Queue */}
        {activeTab === 'queue' && (
          <div>
            {/* Search + Filter */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <Search size={14} className="text-slate-400" />
                <input
                  className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                  placeholder="Search patient or medication..."
                  value={searchTerm}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {['all', 'pending', 'dispensed'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                      filterStatus === f
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}>{f}</button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Package size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">No orders found</p>
                <p className="text-xs text-slate-400 mt-1">Orders appear when doctors prescribe medications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <OrderCard key={order.order_id} order={order} onDispense={handleDispense} dispensing={dispensing} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patient Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Users size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No patients admitted through workflow yet</p>
              </div>
            ) : patients.map(p => (
              <PatientBillCard key={p.patient_id} patient={p} billing={patientBills[p.patient_id]} />
            ))}
          </div>
        )}

        {/* Revenue Summary */}
        {activeTab === 'summary' && billingSummary && (
          <div className="space-y-4">
            {/* Workflow billing */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-sm font-bold text-slate-700 mb-4">Workflow Revenue Breakdown</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Active Patients',   value: billingSummary.workflow_billing?.active_patients || 0,    color: 'sky'     },
                  { label: 'Discharged',         value: billingSummary.workflow_billing?.discharged_patients || 0,color: 'emerald' },
                  { label: 'Total Billed',       value: `₹${(billingSummary.workflow_billing?.total_billed_inr || 0).toLocaleString()}`, color: 'violet' },
                  { label: 'Pharmacy Revenue',   value: `₹${totalRevenue.toLocaleString()}`,                     color: 'amber'   },
                ].map(tile => (
                  <div key={tile.label} className={`rounded-xl border p-4 text-center bg-${tile.color}-50 border-${tile.color}-200`}>
                    <p className={`text-xl font-black text-${tile.color}-600`}>{tile.value}</p>
                    <p className={`text-xs text-${tile.color}-700 font-medium mt-1`}>{tile.label}</p>
                  </div>
                ))}
              </div>

              {/* By category */}
              {billingSummary.workflow_billing?.revenue_by_category && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Revenue by Category</p>
                  <div className="space-y-2">
                    {Object.entries(billingSummary.workflow_billing.revenue_by_category).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 capitalize w-24">{cat}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${Math.min((amt / (billingSummary.workflow_billing?.total_billed_inr || 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-20 text-right">₹{amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hospital finance overview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-sm font-bold text-slate-700 mb-4">Hospital Finance Overview</p>
              <div className="space-y-2">
                {[
                  { label: 'Revenue Today',     value: `₹${billingSummary.hospital_finance?.revenue_today_lakh}L` },
                  { label: 'MTD Revenue',       value: `₹${billingSummary.hospital_finance?.revenue_mtd_lakh}L / ₹${billingSummary.hospital_finance?.revenue_target_lakh}L` },
                  { label: 'Collection Rate',   value: `${billingSummary.hospital_finance?.collection_rate_pct}%` },
                  { label: 'Pending Bills',     value: `₹${billingSummary.hospital_finance?.pending_bills_lakh}L` },
                  { label: 'Insurance Claims',  value: `${billingSummary.hospital_finance?.insurance_claims_pct}%` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-bold text-slate-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            {billingSummary.workflow_billing?.recent_transactions?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-bold text-slate-700 mb-4">Recent Transactions</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {billingSummary.workflow_billing.recent_transactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 text-xs">
                      <div>
                        <p className="font-semibold text-slate-700">{t.description}</p>
                        <p className="text-slate-400">{t.patient_name} · <span className="capitalize">{t.category}</span></p>
                      </div>
                      <span className="font-bold text-emerald-700">+₹{t.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
