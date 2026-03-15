// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// Toast.jsx — Global toast notification system
// Usage: import { useToast, ToastContainer } from './Toast'
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, createContext, useContext, useRef } from 'react'
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react'

const ToastContext = createContext(null)

let _globalToast = null

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  _globalToast = addToast

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.addToast
}

function ToastItem({ toast, onRemove }) {
  const configs = {
    success: {
      icon: <CheckCircle size={15} />,
      bg:   'bg-emerald-50',
      border: 'border-emerald-200',
      icon_color: 'text-emerald-600',
      text: 'text-emerald-800',
    },
    error: {
      icon: <AlertCircle size={15} />,
      bg:   'bg-red-50',
      border: 'border-red-200',
      icon_color: 'text-red-600',
      text: 'text-red-800',
    },
    warning: {
      icon: <AlertTriangle size={15} />,
      bg:   'bg-amber-50',
      border: 'border-amber-200',
      icon_color: 'text-amber-600',
      text: 'text-amber-800',
    },
    info: {
      icon: <Info size={15} />,
      bg:   'bg-sky-50',
      border: 'border-sky-200',
      icon_color: 'text-sky-600',
      text: 'text-sky-800',
    },
  }

  const c = configs[toast.type] || configs.info

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${c.bg} ${c.border} animate-slide-in-right min-w-[280px] max-w-sm`}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
    >
      <span className={c.icon_color}>{c.icon}</span>
      <p className={`text-sm font-semibold flex-1 leading-snug ${c.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors ml-1"
      >
        <X size={13} />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}
