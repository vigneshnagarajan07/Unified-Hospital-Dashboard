// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// AuthLoginPage.jsx — Authentication gateway
// UPDATED: Added Nurse and Pharmacy login cards
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import {
    Activity, Lock, User, Eye, EyeOff,
    Shield, AlertCircle, Heart,
    BedDouble, Clock, Users, TrendingUp, Stethoscope,
    Brain, FileText, Sparkles, BarChart3, Pill
} from 'lucide-react'

const DEMO_CREDENTIALS = [
    { username: 'admin',    password: 'admin123',    label: 'Receptionist',       role: 'admin',            icon: Shield,      color: 'sky'     },
    { username: 'doctor',   password: 'doctor123',   label: 'Doctor',             role: 'doctor',           icon: Stethoscope, color: 'emerald' },
    { username: 'depthead', password: 'depthead123', label: 'Department Head',    role: 'department_head',  icon: TrendingUp,  color: 'violet'  },
    { username: 'floor',    password: 'floor123',    label: 'Floor Supervisor',   role: 'floor_supervisor', icon: BedDouble,   color: 'amber'   },
    { username: 'nurse',    password: 'nurse123',    label: 'Nurse',              role: 'nurse',            icon: Activity,    color: 'purple'  },
    { username: 'pharmacy', password: 'pharmacy123', label: 'Pharmacy / Billing', role: 'pharmacy',         icon: Pill,        color: 'teal'    },
    { username: 'patient',  password: 'patient123',  label: 'Patient Portal',     role: 'patient',          icon: Heart,       color: 'rose'    },
]

const LIVE_STATS = [
    { icon: BedDouble, label: 'Beds Occupied',  value: '319/395', color: 'text-sky-600'     },
    { icon: Clock,     label: 'Avg Wait Time',  value: '22 min',  color: 'text-amber-600'   },
    { icon: Users,     label: 'Patients Today', value: '284',     color: 'text-emerald-600' },
    { icon: Activity,  label: 'Health Score',   value: '82/100',  color: 'text-violet-600'  },
    { icon: Heart,     label: 'Surgeries Done', value: '14',      color: 'text-rose-500'    },
    { icon: TrendingUp,label: 'NPS Score',      value: '72 pts',  color: 'text-sky-600'     },
]

const COLOR_MAP = {
    sky:    { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    icon: 'text-sky-600'    },
    emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',icon: 'text-emerald-600'},
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-600' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: 'text-amber-600'  },
    rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   icon: 'text-rose-500'   },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   icon: 'text-teal-600'   },
}

export default function AuthLoginPage({ onAuthenticated }) {
    const [username,     setUsername]     = useState('')
    const [password,     setPassword]     = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading,    setIsLoading]    = useState(false)
    const [error,        setError]        = useState('')
    const [statIdx,      setStatIdx]      = useState(0)

    // Rotate live stats
    useState(() => {
        const t = setInterval(() => setStatIdx(i => (i + 1) % LIVE_STATS.length), 2500)
        return () => clearInterval(t)
    })

    const handleLogin = async (e) => {
        e?.preventDefault()
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password.')
            return
        }
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            })
            if (!res.ok) {
                const data = await res.json()
                setError(data.detail || 'Invalid credentials')
                return
            }
            const data = await res.json()
            onAuthenticated(data.role)
        } catch {
            // Fallback: match demo credentials
            const match = DEMO_CREDENTIALS.find(c => c.username === username.trim() && c.password === password)
            if (match) {
                onAuthenticated(match.role)
            } else {
                setError('Invalid username or password')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const quickLogin = (cred) => {
        setUsername(cred.username)
        setPassword(cred.password)
        setError('')
        setTimeout(() => onAuthenticated(cred.role), 100)
    }

    const stat = LIVE_STATS[statIdx]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
                        <Activity size={26} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">PrimeCare Hospital</h1>
                    <p className="text-slate-500 text-sm mt-1">GKM_8 Intelligence Platform</p>
                    {/* Live stat ticker */}
                    <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                        <stat.icon size={13} className={stat.color} />
                        <span className="text-xs font-semibold text-slate-500">{stat.label}:</span>
                        <span className={`text-xs font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Login form */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="font-bold text-slate-800 mb-1">Sign In</h2>
                        <p className="text-xs text-slate-400 mb-5">Access your role dashboard</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Username</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        placeholder="Enter username"
                                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        placeholder="Enter password"
                                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                    <button onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                                    <AlertCircle size={13} />
                                    {error}
                                </div>
                            )}

                            <button onClick={handleLogin} disabled={isLoading}
                                className="w-full py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                {isLoading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                                    : 'Sign In'
                                }
                            </button>
                        </div>
                    </div>

                    {/* Quick role cards */}
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Access — Demo Roles</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_CREDENTIALS.map(cred => {
                                const c = COLOR_MAP[cred.color]
                                return (
                                    <button
                                        key={cred.role}
                                        onClick={() => quickLogin(cred)}
                                        className={`${c.bg} ${c.border} border rounded-xl p-3 text-left hover:shadow-md transition-all group`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/70`}>
                                                <cred.icon size={15} className={c.icon} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold truncate ${c.text}`}>{cred.label}</p>
                                                <p className="text-[10px] text-slate-400">{cred.username}</p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center">Click any card to log in instantly</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
