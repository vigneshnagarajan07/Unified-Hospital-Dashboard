// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// LoginPage.jsx — FIX: Added Floor Supervisor role
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import {
    Stethoscope, Building2, BarChart3,
    UserCircle, Activity, MapPin,
    ChevronRight, Shield
} from 'lucide-react'

const AVAILABLE_ROLES = [
    {
        roleId: 'admin',
        roleTitle: 'Admin / CEO',
        roleDescription: 'Hospital-wide analytics, revenue, AI insights and 48hr forecast',
        RoleIcon: BarChart3,
        colorScheme: {
            card: 'hover:border-emerald-300 hover:shadow-emerald-100',
            iconBox: 'bg-emerald-100 text-emerald-600',
            badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            button: 'bg-emerald-500 hover:bg-emerald-600',
            highlight: 'text-emerald-600',
        },
        demoUser: 'Mr. Arvind Kumar · Hospital Administrator',
        capabilities: ['All KPIs', 'AI Insights', 'Revenue', '48hr Forecast'],
    },
    {
        roleId: 'department_head',
        roleTitle: 'Department Head',
        roleDescription: 'Department KPIs, staff roster, surgery schedule and anomaly alerts',
        RoleIcon: Building2,
        colorScheme: {
            card: 'hover:border-violet-300 hover:shadow-violet-100',
            iconBox: 'bg-violet-100 text-violet-600',
            badge: 'bg-violet-50 text-violet-600 border-violet-100',
            button: 'bg-violet-500 hover:bg-violet-600',
            highlight: 'text-violet-600',
        },
        demoUser: 'Dr. Priya Subramaniam · General Medicine',
        capabilities: ['Dept KPIs', 'Staff Roster', 'Surgery Schedule', 'Dept Anomalies'],
    },
    {
        roleId: 'doctor',
        roleTitle: 'Doctor / Nurse',
        roleDescription: 'View your patients, OPD queue, prescriptions and ward alerts',
        RoleIcon: Stethoscope,
        colorScheme: {
            card: 'hover:border-sky-300 hover:shadow-sky-100',
            iconBox: 'bg-sky-100 text-sky-600',
            badge: 'bg-sky-50 text-sky-600 border-sky-100',
            button: 'bg-sky-500 hover:bg-sky-600',
            highlight: 'text-sky-600',
        },
        demoUser: 'Dr. Ramesh Iyer · Cardiology',
        capabilities: ['My Patients', 'OPD Queue', 'Prescriptions', 'Critical Alerts'],
    },
    {
        roleId: 'floor_supervisor',
        roleTitle: 'Floor Supervisor',
        roleDescription: 'Real-time bed map, edit bed availability, ward capacity and staff alerts',
        RoleIcon: MapPin,
        colorScheme: {
            card: 'hover:border-teal-300 hover:shadow-teal-100',
            iconBox: 'bg-teal-100 text-teal-600',
            badge: 'bg-teal-50 text-teal-600 border-teal-100',
            button: 'bg-teal-500 hover:bg-teal-600',
            highlight: 'text-teal-600',
        },
        demoUser: 'Ms. Kavitha Rajan · Floors 2 & 3',
        capabilities: ['Bed Map', 'Edit Availability', 'Ward Capacity', 'Staff On Duty'],
    },
    {
        roleId: 'patient',
        roleTitle: 'Patient Portal',
        roleDescription: 'Track your prescriptions, lab reports, vitals and discharge status',
        RoleIcon: UserCircle,
        colorScheme: {
            card: 'hover:border-rose-300 hover:shadow-rose-100',
            iconBox: 'bg-rose-100 text-rose-600',
            badge: 'bg-rose-50 text-rose-600 border-rose-100',
            button: 'bg-rose-500 hover:bg-rose-600',
            highlight: 'text-rose-600',
        },
        demoUser: 'Mr. Senthil Kumar · Patient ID: APL-2024-0847',
        capabilities: ['Prescriptions', 'Lab Reports', 'Vitals', 'Discharge Status'],
    },
]

function RoleCard({ roleData, cardIndex, onRoleSelect }) {
    const [isHovered, setIsHovered] = useState(false)
    const { colorScheme } = roleData

    return (
        <div
            className={`bg-white rounded-2xl border-2 border-slate-100 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl ${colorScheme.card} animate-slide-up`}
            style={{ animationDelay: `${cardIndex * 0.07}s` }}
            onClick={() => onRoleSelect(roleData.roleId)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorScheme.iconBox}`}>
                    <roleData.RoleIcon size={22} />
                </div>
                <ChevronRight
                    size={18}
                    className={`transition-all duration-300 ${isHovered ? `${colorScheme.highlight} translate-x-1` : 'text-slate-300'}`}
                />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{roleData.roleTitle}</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{roleData.roleDescription}</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
                {roleData.capabilities.map(capability => (
                    <span key={capability} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${colorScheme.badge}`}>
                        {capability}
                    </span>
                ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                    <p className="text-xs text-slate-400">Demo user</p>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{roleData.demoUser}</p>
                </div>
                <button className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${colorScheme.button} ${isHovered ? 'scale-105 shadow-md' : ''}`}>
                    Enter <ChevronRight size={13} />
                </button>
            </div>
        </div>
    )
}

export default function LoginPage({ onRoleSelected }) {
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100">

            <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-sm">
                            <Activity size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 text-sm">PrimeCare</span>
                            <span className="text-slate-400 text-sm font-normal"> · Hospital Performance Dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        <span>{currentDate} · {currentTime}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
                    <Shield size={13} className="text-sky-500" />
                    <span className="text-xs font-semibold text-slate-600">PrimeCare Medical Hospital · Chennai · NABH Accredited</span>
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-3">
                    Welcome to <span className="text-sky-500">PrimeCare</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                    Real-time hospital intelligence platform. Select your role to access your personalised dashboard.
                </p>
                <div className="flex items-center justify-center gap-8 mt-8 mb-2">
                    {[
                        { statValue: '652', statLabel: 'Patients Today' },
                        { statValue: '395', statLabel: 'Total Beds' },
                        { statValue: '6',   statLabel: 'Departments' },
                        { statValue: '58',  statLabel: 'Staff On Duty' },
                    ].map(({ statValue, statLabel }) => (
                        <div key={statLabel} className="text-center">
                            <p className="text-2xl font-black text-slate-800">{statValue}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{statLabel}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 pb-16">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Select Your Role</p>
                {/* 3-col top row, 2-col bottom row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                    {AVAILABLE_ROLES.slice(0, 3).map((roleData, cardIndex) => (
                        <RoleCard key={roleData.roleId} roleData={roleData} cardIndex={cardIndex} onRoleSelect={onRoleSelected} />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
                    {AVAILABLE_ROLES.slice(3).map((roleData, cardIndex) => (
                        <RoleCard key={roleData.roleId} roleData={roleData} cardIndex={cardIndex + 3} onRoleSelect={onRoleSelected} />
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-200 bg-white/50 py-4">
                <p className="text-center text-xs text-slate-400">PrimeCare Hospitals · GKM_8 Intelligence Platform · VITC GlitchCon 2.0</p>
            </div>
        </div>
    )
}
