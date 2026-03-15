// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// components/ChatBox.jsx — Ask the Dashboard AI Chatbox
//
// FIX: Was broken because it called a non-existent endpoint.
//      Now uses /api/insights/ask which has real Groq integration
//      via direct httpx REST (no SDK version issues).
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, RefreshCw, X, Minimize2, Maximize2, Bot, User } from 'lucide-react'
import { insightsApi } from '../api/client'

const EXAMPLE_QUESTIONS = [
  "Which department has the highest bed occupancy?",
  "Are there any critical anomalies right now?",
  "What's the average OPD wait time today?",
  "How many critical patients are admitted?",
  "Which departments need immediate attention?",
  "What is the hospital health score?",
]

export default function ChatBox({ role = 'admin' }) {
  const [open, setOpen]         = useState(false)
  const [minimized, setMin]     = useState(false)
  const [messages, setMessages] = useState([
    {
      id:     0,
      role:   'assistant',
      text:   "Hi! I'm the PrimeCare AI assistant. Ask me anything about hospital operations, bed occupancy, anomalies, or patient data.",
      time:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return

    const userMsg = {
      id:   messages.length + 1,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await insightsApi.askAI(text, role)
      const aiMsg = {
        id:     messages.length + 2,
        role:   'assistant',
        text:   res.data.answer,
        source: res.data.source,
        time:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        id:   messages.length + 2,
        role: 'assistant',
        text: 'Connection error — make sure the backend is running on port 8000.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-sky-500 text-white shadow-lg hover:bg-sky-600 transition-all hover:scale-105 flex items-center justify-center"
          title="Ask the Dashboard"
        >
          <MessageSquare size={22} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all ${
          minimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-96 h-[500px]'
        } flex flex-col overflow-hidden`}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-sky-500 text-white shrink-0">
            <div className="w-8 h-8 rounded-xl bg-sky-400 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Ask the Dashboard</p>
              {!minimized && <p className="text-xs opacity-80">AI-powered hospital intelligence</p>}
            </div>
            <button onClick={() => setMin(m => !m)} className="p-1.5 rounded-lg hover:bg-sky-400 transition-colors">
              {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-sky-400 transition-colors">
              <X size={13} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

                {/* Example questions (shown when only welcome message) */}
                {messages.length === 1 && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Try asking:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_QUESTIONS.slice(0, 4).map((q, i) => (
                        <button key={i} onClick={() => sendMessage(q)}
                          className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors text-left">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-sky-100' : 'bg-slate-100'
                    }`}>
                      {msg.role === 'user'
                        ? <User size={12} className="text-sky-600" />
                        : <Bot  size={12} className="text-slate-600" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-sky-500 text-white rounded-br-sm'
                        : msg.isError
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-between mt-1 gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <p className={`text-[10px] opacity-60`}>{msg.time}</p>
                        {msg.source === 'groq' && (
                          <p className="text-[9px] opacity-50">⚡ Groq</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Bot size={12} className="text-slate-600" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="px-3 py-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the hospital..."
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <Send size={13} />
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
