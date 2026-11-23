import React, { useState, Component } from 'react';
import { 
  Shield, Activity, Crosshair, Sparkles, GitBranch, 
  Terminal, AlertTriangle, RefreshCw, Radio, Layers
} from 'lucide-react';
import Overview from './pages/Overview';
import Detection from './pages/Detection';
import Threats from './pages/Threats';
import Drift from './pages/Drift';

// React Error Boundary to prevent any white screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-red-200 shadow-xl text-center space-y-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto border border-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Console Rendering Issue</h2>
            <p className="text-xs text-slate-500 font-mono">
              {this.state.error?.message || "An unexpected error occurred while rendering this view."}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 mx-auto transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('overview');

  // Smart API Base URL:
  // Automatically strips any trailing slashes to avoid 404 errors (e.g. //stats)
  const getApiBase = () => {
    let base = import.meta.env.VITE_API_BASE;
    if (!base && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        base = 'http://127.0.0.1:8000';
      } else {
        base = 'https://cloud-ids-backend.onrender.com';
      }
    }
    return (base || 'https://cloud-ids-backend.onrender.com').trim().replace(/\/+$/, '');
  };
  const apiBase = getApiBase();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, tag: 'Live' },
    { id: 'detection', label: 'Detection', icon: Crosshair, tag: 'M2' },
    { id: 'threats', label: 'Threat Analysis', icon: Sparkles, tag: 'SHAP' },
    { id: 'drift', label: 'Drift & Adaptation', icon: GitBranch, tag: 'M4' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-indigo-500/20 selection:text-indigo-700">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-mono">
              Sentinel IDS
            </h1>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 py-1 font-bold">
            Security Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white font-medium' : 'bg-slate-100 text-slate-500 border border-slate-200/80 font-medium'
                }`}>
                  {item.tag}
                </span>
              </button>
            );
          })}

          {/* Clean Environment Specs Card */}
          <div className="pt-4">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Engine Telemetry
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">v1.0</span>
              </div>
              
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Benchmark</span>
                  <span className="text-slate-800 font-semibold">CIC-IDS2017</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Flow Sample</span>
                  <span className="text-slate-800 font-semibold">300,055</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Input Features</span>
                  <span className="text-slate-800 font-semibold">25 Numeric</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Model Engine</span>
                  <span className="text-indigo-600 font-bold">RandomForest</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && <Overview apiBase={apiBase} />}
          {activeTab === 'detection' && <Detection apiBase={apiBase} />}
          {activeTab === 'threats' && <Threats apiBase={apiBase} />}
          {activeTab === 'drift' && <Drift apiBase={apiBase} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
