import React, { useState, Component } from 'react';
import { 
  Shield, Activity, Crosshair, Sparkles, GitBranch, 
  Sun, Moon, Terminal, AlertTriangle, RefreshCw, Radio, Layers
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
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0f172a] border border-red-500/30 shadow-2xl text-center space-y-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-full w-fit mx-auto border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Console Rendering Issue</h2>
            <p className="text-xs text-slate-400 font-mono">
              {this.state.error?.message || "An unexpected error occurred while rendering this view."}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 mx-auto transition-colors"
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
  const [darkMode, setDarkMode] = useState(true);

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
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0b101d]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                Sentinel IDS
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SOC ACTIVE
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                CIC-IDS2017
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              Cloud-Based Intelligent Network Traffic Monitoring &amp; Intrusion Detection
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-semibold shadow-sm shadow-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ONLINE</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 px-3 py-1 font-semibold">
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
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.tag}
                </span>
              </button>
            );
          })}

          {/* Clean Environment Specs Card */}
          <div className="pt-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Engine Telemetry
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">v1.0</span>
              </div>
              
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400 dark:text-slate-400">
                  <span>Benchmark</span>
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">CIC-IDS2017</span>
                </div>
                <div className="flex justify-between text-slate-400 dark:text-slate-400">
                  <span>Flow Sample</span>
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">300,055</span>
                </div>
                <div className="flex justify-between text-slate-400 dark:text-slate-400">
                  <span>Input Features</span>
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">25 Numeric</span>
                </div>
                <div className="flex justify-between text-slate-400 dark:text-slate-400">
                  <span>Model Engine</span>
                  <span className="text-indigo-500 dark:text-indigo-400 font-semibold">RandomForest</span>
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
