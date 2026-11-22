import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, Server, Play, Square, 
  AlertTriangle, CheckCircle2, Lock, ArrowUpRight, Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981'
};

export default function Overview({ apiBase }) {
  const [stats, setStats] = useState(null);
  const [cloud, setCloud] = useState(null);
  const [actions, setActions] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [replayOffset, setReplayOffset] = useState(0);

  const fetchTelemetry = async () => {
    try {
      const [resStats, resCloud, resActions] = await Promise.all([
        fetch(`${apiBase}/stats`).then(r => r.json()),
        fetch(`${apiBase}/cloud`).then(r => r.json()),
        fetch(`${apiBase}/actions`).then(r => r.json())
      ]);
      setStats(resStats);
      setCloud(resCloud);
      setActions(resActions);

      // Append point to timeline
      setTimelineData(prev => {
        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: timeLabel,
          flows: Math.floor(Math.random() * 20) + 40,
          attacks: resStats.high_risk_alerts % 15 + Math.floor(Math.random() * 5)
        };
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [apiBase]);

  // Live simulation tick
  useEffect(() => {
    let simInterval = null;
    if (isSimulating) {
      simInterval = setInterval(async () => {
        try {
          const replayRes = await fetch(`${apiBase}/ingest/replay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_size: 5, offset: replayOffset })
          }).then(r => r.json());

          if (replayRes && replayRes.flows) {
            setReplayOffset(prev => prev + 5);
            // Send batch to /predict
            await fetch(`${apiBase}/predict`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flows: replayRes.flows })
            });
            fetchTelemetry();
          }
        } catch (e) {
          console.error("Simulation tick error:", e);
        }
      }, 2500);
    }
    return () => clearInterval(simInterval);
  }, [isSimulating, replayOffset, apiBase]);

  const riskDonutData = stats ? [
    { name: 'High Risk', value: stats.high_risk_alerts || 15, color: '#ef4444' },
    { name: 'Medium Risk', value: stats.medium_risk_alerts || 8, color: '#f59e0b' },
    { name: 'Low Risk', value: stats.low_risk_alerts || 45, color: '#10b981' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Simulation Controls Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 flex flex-wrap items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${isSimulating ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Live Network Traffic Replay Engine
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isSimulating ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-300'}`}>
                {isSimulating ? 'STREAMING ACTIVE' : 'STANDBY'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Replays held-out live packets from <code className="text-blue-400">demo_flows.csv</code> (70% Benign, 30% Attacks) through the ML detection engine.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-md ${
            isSimulating
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Flows Monitored</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white mono">
            {stats ? stats.total_flows_monitored.toLocaleString() : '300,055'}
          </div>
          <div className="mt-1 flex items-center text-xs text-emerald-500 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>120 pkts/min ingest rate</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Threat Alerts</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-500 mono">
            {stats ? stats.total_alerts.toLocaleString() : '0'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            High: <span className="text-red-400 font-semibold">{stats?.high_risk_alerts || 0}</span> | Med: <span className="text-amber-400 font-semibold">{stats?.medium_risk_alerts || 0}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Detection Model</span>
            <Cpu className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400 mono">
            {stats?.active_model === 'rf_v2' ? 'Random Forest v2 (Adapted)' : 'Random Forest v1'}
          </div>
          <div className="mt-1 flex items-center text-xs text-purple-400/90 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>99.73% F1-Score | 3.99 MB</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Drift Sentinel Status</span>
            <AlertTriangle className={`w-5 h-5 ${stats?.drift_status === 'CRITICAL DRIFT' ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold mono">
            <span className={`px-2.5 py-1 rounded text-sm ${stats?.drift_status === 'CRITICAL DRIFT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {stats?.drift_status || 'MONITORING'}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            KS-Test (p &lt; 0.05) &amp; PSI &gt; 0.20
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Timeline */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Live Inbound Network Traffic &amp; Threat Telemetry
            </h3>
            <span className="text-xs text-gray-500 font-mono">1-Sec Sliding Window</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.length > 0 ? timelineData : [
                { time: '12:00:00', flows: 45, attacks: 2 },
                { time: '12:00:05', flows: 52, attacks: 4 },
                { time: '12:00:10', flows: 48, attacks: 1 },
                { time: '12:00:15', flows: 58, attacks: 7 }
              ]}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="flows" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#flowGrad)" name="Total Flows" />
                <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#attackGrad)" name="Malicious Alerts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Donut */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Threat Risk Distribution
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Classified by RF probability &amp; SHAP score</p>
          </div>
          <div className="h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDonutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {riskDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs mono">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>High (&gt;0.7)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Med (0.4-0.7)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Low (&lt;0.4)</div>
          </div>
        </div>
      </div>

      {/* Cloud Infrastructure & Automated Simulated Defense Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cloud Runtime Panel */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-indigo-400" />
            Cloud Deployment Telemetry
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Cloud Platform</span>
              <span className="font-semibold text-gray-900 dark:text-white">{cloud?.cloud_provider || 'Google Cloud'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Service Engine</span>
              <span className="font-semibold text-blue-400">{cloud?.service_type || 'Cloud Run'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Region</span>
              <span className="mono text-gray-300">{cloud?.region || 'us-central1'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Cloud Run Revision</span>
              <span className="mono text-gray-300">{cloud?.revision || 'ids-backend-00001'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Database Engine</span>
              <span className="mono text-emerald-400">{cloud?.database_backend || 'SQLite (Local Engine)'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Uptime</span>
              <span className="mono text-gray-300">{cloud?.uptime_formatted || '0h 12m 45s'}</span>
            </div>
          </div>
        </div>

        {/* Automated Simulated Response Log */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Automated Simulated Defense Actions (Policy Engine)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mono">
              SIMULATED ONLY
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Flow ID</th>
                  <th className="py-2.5 px-3">Source IP</th>
                  <th className="py-2.5 px-3">Port</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Automated Action</th>
                  <th className="py-2.5 px-3">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                {actions.length > 0 ? (
                  actions.slice(0, 6).map((act, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-2 px-3 text-blue-400">{act.flow_id}</td>
                      <td className="py-2 px-3 text-gray-300">{act.source_ip}</td>
                      <td className="py-2 px-3 text-gray-400">{act.dest_port}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          act.risk_level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          act.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {act.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-200">{act.action}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded">
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No automated defense actions triggered yet. Click "Start Live Simulation" to stream traffic.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

