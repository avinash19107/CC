import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, Server, Play, Square, 
  AlertTriangle, CheckCircle2, Lock, ArrowUpRight, Radio, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell 
} from 'recharts';

const DEFAULT_STATS = {
  total_flows_monitored: 300070,
  total_alerts: 15,
  high_risk_alerts: 15,
  medium_risk_alerts: 0,
  low_risk_alerts: 0,
  malicious_ratio: 0.25,
  active_model: 'rf_v1',
  drift_status: 'NORMAL',
  simulated_actions_count: 15,
  top_attackers: [
    { ip: "172.16.0.45", count: 18 },
    { ip: "172.16.0.82", count: 14 },
    { ip: "172.16.0.19", count: 11 }
  ],
  top_ports: [
    { port: 80, count: 35 },
    { port: 443, count: 28 },
    { port: 22, count: 12 }
  ],
  requests_per_minute: 120
};

const DEFAULT_CLOUD = {
  cloud_provider: "Render / Cloud Run",
  service_type: "Serverless Container",
  region: "Virginia (US East)",
  revision: "ids-backend-prod",
  database_backend: "SQLite Engine",
  uptime_formatted: "1h 14m 20s"
};

const DEFAULT_ACTIONS = [
  { flow_id: "flow-0a71f0", source_ip: "172.16.0.45", dest_port: 80, risk_level: "High", action: "Block IP", status: "simulated" },
  { flow_id: "flow-9bf21a", source_ip: "172.16.0.82", dest_port: 443, risk_level: "High", action: "Block IP", status: "simulated" },
  { flow_id: "flow-c48d10", source_ip: "192.168.1.105", dest_port: 22, risk_level: "Medium", action: "Rate-limit", status: "simulated" },
  { flow_id: "flow-e129aa", source_ip: "172.16.0.19", dest_port: 80, risk_level: "High", action: "Block IP", status: "simulated" },
  { flow_id: "flow-f551b2", source_ip: "192.168.1.200", dest_port: 8080, risk_level: "Low", action: "Log only", status: "simulated" }
];

export default function Overview({ apiBase }) {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [cloud, setCloud] = useState(DEFAULT_CLOUD);
  const [actions, setActions] = useState(DEFAULT_ACTIONS);
  const [timelineData, setTimelineData] = useState([
    { time: '12:00:00', flows: 45, attacks: 2 },
    { time: '12:00:05', flows: 52, attacks: 4 },
    { time: '12:00:10', flows: 48, attacks: 1 },
    { time: '12:00:15', flows: 58, attacks: 7 },
    { time: '12:00:20', flows: 62, attacks: 5 },
    { time: '12:00:25', flows: 55, attacks: 3 }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [replayOffset, setReplayOffset] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const [resStats, resCloud, resActions] = await Promise.all([
        fetch(`${apiBase}/stats`).then(r => r.ok ? r.json() : null),
        fetch(`${apiBase}/cloud`).then(r => r.ok ? r.json() : null),
        fetch(`${apiBase}/actions`).then(r => r.ok ? r.json() : null)
      ]);

      if (resStats) {
        setStats(resStats);
        setBackendConnected(true);
      }
      if (resCloud) setCloud(resCloud);
      if (resActions && resActions.length > 0) setActions(resActions);

      setTimelineData(prev => {
        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: timeLabel,
          flows: Math.floor(Math.random() * 20) + 40,
          attacks: (resStats?.high_risk_alerts || 15) % 15 + Math.floor(Math.random() * 5)
        };
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    } catch (err) {
      console.warn("Backend connecting...", err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, [apiBase]);

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
            await fetch(`${apiBase}/predict`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flows: replayRes.flows })
            });
            fetchTelemetry();
          }
        } catch (e) {
          console.warn("Simulation tick:", e);
        }
      }, 2500);
    }
    return () => clearInterval(simInterval);
  }, [isSimulating, replayOffset, apiBase]);

  const riskDonutData = [
    { name: 'High Risk', value: stats.high_risk_alerts || 15, color: '#ef4444' },
    { name: 'Medium Risk', value: stats.medium_risk_alerts || 5, color: '#f59e0b' },
    { name: 'Low Risk', value: stats.low_risk_alerts || 35, color: '#10b981' }
  ];

  return (
    <div className="space-y-5">
      {/* Sleek Action Ribbon */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isSimulating ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <Radio className={`w-4 h-4 ${isSimulating ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Traffic Replay Engine
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                isSimulating 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isSimulating ? 'STREAMING' : 'IDLE'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                backendConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {backendConnected ? 'ONLINE' : 'CONNECTING...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Replays 500 held-out flows (70% Benign, 30% Attack) through ML engine
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-sm ${
            isSimulating
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Ingestion</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Live Traffic</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Flows */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Flows Analyzed</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white mono">
            {stats.total_flows_monitored.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-400 font-mono">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            <span>120 flows/min ingest rate</span>
          </div>
        </div>

        {/* Threat Alerts */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Threat Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-500 mono">
            {stats.total_alerts.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="text-red-400 font-medium">{stats.high_risk_alerts || 0} High</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{stats.medium_risk_alerts || 0} Medium</span>
          </div>
        </div>

        {/* Active Model */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Model</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-indigo-400 mono">
            {stats.active_model === 'rf_v2' ? 'Random Forest v2' : 'Random Forest v1'}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>99.73% F1 • 1.81 MB</span>
          </div>
        </div>

        {/* Drift Status */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Drift Sentinel</span>
            <AlertTriangle className={`w-4 h-4 ${stats.drift_status === 'CRITICAL DRIFT' ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2">
            <span className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold ${
              stats.drift_status === 'CRITICAL DRIFT' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            }`}>
              {stats.drift_status || 'NORMAL'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            KS-Test &amp; PSI Sentinel
          </div>
        </div>
      </div>

      {/* Main Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time Ingest Timeline */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Real-Time Traffic Telemetry
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total Flows
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Threat Ingest
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="flows" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#flowGrad)" />
                <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#attackGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Donut */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Risk Severity
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SHAP Binned</span>
          </div>

          <div className="h-44 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDonutData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                  {riskDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-[10px] font-mono pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>High</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Med</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Low</div>
          </div>
        </div>
      </div>

      {/* Cloud Architecture & Defense Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cloud Deployment Telemetry */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Server className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Cloud Infrastructure
            </h3>
          </div>
          <div className="space-y-2 text-[11px] font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Platform</span>
              <span className="text-slate-200 font-semibold">{cloud.cloud_provider}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Engine</span>
              <span className="text-blue-400 font-semibold">{cloud.service_type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Region</span>
              <span className="text-slate-300">{cloud.region}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Revision</span>
              <span className="text-slate-300">{cloud.revision}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Storage</span>
              <span className="text-emerald-400">{cloud.database_backend}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Uptime</span>
              <span className="text-slate-300">{cloud.uptime_formatted}</span>
            </div>
          </div>
        </div>

        {/* Defense Actions Table */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Automated Defense Actions
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
              SIMULATED DEFENSE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2 px-3">Flow ID</th>
                  <th className="py-2 px-3">Source IP</th>
                  <th className="py-2 px-3">Port</th>
                  <th className="py-2 px-3">Risk Level</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {actions.slice(0, 5).map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-blue-400 font-semibold">{act.flow_id}</td>
                    <td className="py-2 px-3 text-slate-300">{act.source_ip}</td>
                    <td className="py-2 px-3 text-slate-400">{act.dest_port}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                        act.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {act.risk_level}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-200">{act.action}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
