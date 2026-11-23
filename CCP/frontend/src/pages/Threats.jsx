import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, Filter, ChevronRight, 
  BarChart2, FileText, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell 
} from 'recharts';

export default function Threats({ apiBase }) {
  const [alerts, setAlerts] = useState([]);
  const [globalImportance, setGlobalImportance] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const apiUrl = (path) => `${(apiBase || '').replace(/\/+$/, '')}/${(path || '').replace(/^\/+/, '')}`;

  const fetchAlerts = () => {
    fetch(apiUrl(`alerts?limit=25&risk_level=${filter}`))
      .then(r => r.ok ? r.text() : null)
      .then(text => {
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data && data.alerts) {
              setAlerts(data.alerts);
              if (data.alerts.length > 0 && !selectedAlert) {
                setSelectedAlert(data.alerts[0]);
              }
            }
          } catch (e) {
            console.warn("Alerts parse error:", e);
          }
        }
        setLoading(false);
      })
      .catch(e => {
        console.warn("Alerts fetch error:", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
    fetch(apiUrl('explain/global'))
      .then(r => r.ok ? r.text() : null)
      .then(text => {
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data && data.ranking) setGlobalImportance(data.ranking);
          } catch {}
        }
      })
      .catch(console.warn);
  }, [apiBase, filter]);

  const shapChartData = selectedAlert?.top_features ? selectedAlert.top_features.map(f => ({
    name: f.feature,
    impact: f.shap_value,
    abs: Math.abs(f.shap_value),
    direction: f.direction,
    raw: f.raw_value
  })) : [];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Explainable Threat Analysis (M3)
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            SHAP TreeExplainer
          </span>
        </div>
      </div>

      {/* Selected Alert Explainability Detail Card */}
      {selectedAlert ? (
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-indigo-500/30 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                selectedAlert.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                selectedAlert.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              }`}>
                {selectedAlert.risk_level} Risk Threat
              </span>
              <span className="font-mono text-xs font-semibold text-blue-400">
                {selectedAlert.flow_id}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
              <span>Risk Score: <strong className="text-red-400">{selectedAlert.risk_score}</strong></span>
              <span>•</span>
              <span>Anomaly: <strong className="text-purple-400">{selectedAlert.anomaly_score}</strong></span>
              <span>•</span>
              <span>Simulated Action: <strong className="text-emerald-400">{selectedAlert.simulated_action}</strong></span>
            </div>
          </div>

          {/* Natural Language Alert Text Banner */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <p className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
              {selectedAlert.alert_text || `Flow ${selectedAlert.flow_id}: ${selectedAlert.risk_level} risk (${selectedAlert.risk_score}). High flow rate detected.`}
            </p>
          </div>

          {/* Local SHAP Waterfall Bar Chart */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                Local SHAP Feature Contributions
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Red = Risk Increase | Green = Risk Mitigator
              </span>
            </div>
            
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapChartData} layout="vertical" margin={{ left: 110, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val, name, props) => [
                      `SHAP Value: ${val} (Raw Value: ${props.payload.raw}, Direction: ${props.payload.direction})`,
                      'Feature Impact'
                    ]}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {shapChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#ef4444' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center text-slate-400 font-mono text-xs">
          No alert selected. Trigger live simulation on the Overview tab to stream flows.
        </div>
      )}

      {/* Global SHAP Importance & Alert Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Global SHAP Ranking */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              Global Importance
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Mean |SHAP|</span>
          </div>

          <div className="space-y-2 font-mono">
            {globalImportance.slice(0, 7).map((feat, i) => (
              <div key={i} className="text-[11px]">
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="text-slate-300 truncate max-w-[170px]">{feat.feature}</span>
                  <span className="text-indigo-400 font-semibold">{feat.importance.toFixed(4)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, feat.importance * 350)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Ledger Table */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Threat Alert Ledger
              </h3>
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[10px] font-mono">
              {['All', 'High', 'Medium'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    filter === lvl 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2 px-3">Flow ID</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Probability</th>
                  <th className="py-2 px-3">Anomaly</th>
                  <th className="py-2 px-3">Simulated Defense</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {alerts.length > 0 ? (
                  alerts.slice(0, 6).map((al, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedAlert(al)}
                      className={`cursor-pointer transition-colors ${
                        selectedAlert?.id === al.id 
                          ? 'bg-indigo-950/30 border-l-2 border-indigo-500' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-blue-400 font-semibold">{al.flow_id}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          al.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                          al.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          {al.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-200">{al.risk_score}</td>
                      <td className="py-2 px-3 text-purple-400">{al.anomaly_score}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">{al.simulated_action}</td>
                      <td className="py-2 px-3 text-indigo-400 flex items-center gap-1 font-semibold">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-mono">
                      No threat alerts found for filter: {filter}
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
