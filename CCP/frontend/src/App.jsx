import React, { useState, Component } from 'react';
import { 
  Shield, Activity, Crosshair, Sparkles, GitBranch, 
  Sun, Moon, ExternalLink, Terminal, AlertTriangle, RefreshCw
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
        <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#111827] border border-red-500/30 shadow-2xl text-center space-y-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-full w-fit mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold">Dashboard Encountered an Issue</h2>
            <p className="text-xs text-gray-400 font-mono">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Reload Dashboard
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
  const apiBase = import.meta.env.VITE_API_BASE || '/api';

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#0b0f19] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              Cloud IDS Sentinel
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Intelligent Network Traffic Monitoring &amp; Intrusion Detection Using Big Data Analytics
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview &amp; Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('detection')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'detection'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>AI Detection (M2)</span>
          </button>

          <button
            onClick={() => setActiveTab('threats')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'threats'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Threat Analysis (SHAP)</span>
          </button>

          <button
            onClick={() => setActiveTab('drift')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'drift'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Drift &amp; Adaptation</span>
          </button>

          {/* Dataset Info Box */}
          <div className="mt-8 p-4 rounded-xl bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-xs space-y-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300 block">Dataset Specifications</span>
            <div className="text-gray-500 dark:text-gray-400 space-y-1 font-mono">
              <div>CIC-IDS2017</div>
              <div>Sample: 300,055 flows</div>
              <div>25 Scaled Features</div>
              <div>Held-out Demo: 500 flows</div>
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
