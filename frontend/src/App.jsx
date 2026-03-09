// Main Layout containing Navigation and Module Switching
import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, LayoutDashboard, Brain, Lightbulb, Users, TrendingUp, Download, MessageSquare, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { api } from './api/client';

import M1_DataAggregation from './modules/M1_DataAggregation';
import M2_KPIEngine from './modules/M2_KPIEngine';
import M3_AnomalyDetection from './modules/M3_AnomalyDetection';
import M4_AIInsights from './modules/M4_AIInsights';
import M5_Recommendations from './modules/M5_Recommendations';
import M6_RoleViews from './modules/M6_RoleViews';
import M7_Forecast from './modules/M7_Forecast';

function App() {
  const [activeTab, setActiveTab] = useState('M1');
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Chatbox State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am the GKM_8 AI assistant. Ask me anything about the hospital data.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getAggregation();
        setIsBackendDown(false);
        setLastUpdated(new Date());
      } catch (e) {
        setIsBackendDown(true);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await api.sendChat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI service." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const navItems = [
    { id: 'M1', label: 'Overview', icon: LayoutDashboard },
    { id: 'M2', label: 'KPIs', icon: Activity },
    { id: 'M3', label: 'Anomalies', icon: AlertTriangle },
    { id: 'M4', label: 'Insights', icon: Brain },
    { id: 'M5', label: 'Actions', icon: Lightbulb },
    { id: 'M6', label: 'Roles', icon: Users },
    { id: 'M7', label: 'Forecast', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {isBackendDown && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 animate-slide-up">
          <AlertTriangle size={16} />
          Cannot connect to backend - please start FastAPI on port 8000
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">GKM_8</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">Hospital Dash</p>
              </div>
            </div>

            <nav className="hidden md:flex space-x-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-sky-50 text-primary border border-sky-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-slate-400'} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden sm:inline">Live · 30s</span>
              </div>
              <button 
                onClick={() => window.print()}
                className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-full transition-colors"
                title="Export PDF"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in relative z-0">
        {activeTab === 'M1' && <M1_DataAggregation />}
        {activeTab === 'M2' && <M2_KPIEngine />}
        {activeTab === 'M3' && <M3_AnomalyDetection />}
        {activeTab === 'M4' && <M4_AIInsights />}
        {activeTab === 'M5' && <M5_Recommendations />}
        {activeTab === 'M6' && <M6_RoleViews />}
        {activeTab === 'M7' && <M7_Forecast />}
      </main>

      {/* Floating Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {isChatOpen && (
          <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-slide-up" style={{ height: '500px' }}>
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold">
                <Brain size={20} /> Ask_GKM8 AI
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-sky-600 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-purple-100 text-purple-700'}`}>
                    {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about hospital data..." 
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-primary text-white p-2 rounded-lg hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-sky-600 transition-all group pointer-events-auto"
            title="Ask Dashboard AI"
          >
            <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

    </div>
  );
}

export default App;
