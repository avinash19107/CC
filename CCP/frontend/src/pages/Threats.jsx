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
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Explainable Threat Analysis (M3)
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
            SHAP TreeExplainer
          </span>
        </div>
      </div>

      {/* Selected Alert Explainability Detail Card */}
      {selectedAlert ? (
        <div className="p-5 rounded-xl bg-white border border-indigo-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                selectedAlert.risk_level === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                selectedAlert.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {selectedAlert.risk_level} Risk Threat
              </span>
              <span className="font-mono text-xs font-bold text-indigo-600">
                {selectedAlert.flow_id}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
              <span>Risk Score: <strong className="text-rose-600 font-bold">{selectedAlert.risk_score}</strong></span>
              <span>•</span>
              <span>Anomaly: <strong className="text-purple-600 font-bold">{selectedAlert.anomaly_score}</strong></span>
              <span>•</span>
              <span>Simulated Action: <strong className="text-emerald-700 font-bold">{selectedAlert.simulated_action}</strong></span>
            </div>
          </div>

          {/* Natural Language Alert Text Banner */}
          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200/70 flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-xs font-mono text-slate-800 truncate font-medium">
              {selectedAlert.alert_text || `Flow ${selectedAlert.flow_id}: ${selectedAlert.risk_level} risk (${selectedAlert.risk_score}). High flow rate detected.`}
            </p>
          </div>

          {/* Local SHAP Waterfall Bar Chart */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                Local SHAP Feature Contributions
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Red = Risk Increase | Green = Risk Mitigator
              </span>
            </div>
            
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapChartData} layout="vertical" margin={{ left: 110, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val, name, props) => [
                      `SHAP Value: ${val} (Raw Value: ${props.payload.raw}, Direction: ${props.payload.direction})`,
                      'Feature Impact'
                    ]}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {shapChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#e11d48' : '#059669'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-white border border-slate-200/90 text-center text-slate-500 font-mono text-xs shadow-xs">
          No alert selected. Trigger live simulation on the Overview tab to stream flows.
        </div>
      )}

      {/* Global SHAP Importance & Alert Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Global SHAP Ranking */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
              Global Importance
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Mean |SHAP|</span>
          </div>

          <div className="space-y-2.5 font-mono">
            {globalImportance.slice(0, 7).map((feat, i) => (
              <div key={i} className="text-[11px]">
                <div className="flex justify-between text-slate-500 mb-0.5">
                  <span className="text-slate-700 truncate max-w-[170px] font-medium">{feat.feature}</span>
                  <span className="text-indigo-600 font-bold">{feat.importance.toFixed(4)}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full" 
                    style={{ width: `${Math.min(100, feat.importance * 350)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Ledger Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
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
                      ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Flow ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Probability</th>
                  <th className="py-2.5 px-3">Anomaly</th>
                  <th className="py-2.5 px-3">Simulated Defense</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.length > 0 ? (
                  alerts.slice(0, 6).map((al, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedAlert(al)}
                      className={`cursor-pointer transition-colors ${
                        selectedAlert?.id === al.id 
                          ? 'bg-indigo-50/80 border-l-2 border-indigo-600' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-indigo-600 font-bold">{al.flow_id}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          al.risk_level === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          al.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {al.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">{al.risk_score}</td>
                      <td className="py-2.5 px-3 text-purple-600 font-semibold">{al.anomaly_score}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{al.simulated_action}</td>
                      <td className="py-2.5 px-3 text-indigo-600 flex items-center gap-1 font-semibold">
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
