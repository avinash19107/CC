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

  const fetchAlerts = () => {
    fetch(`${apiBase}/alerts?limit=25&risk_level=${filter}`)
      .then(r => r.json())
      .then(data => {
        setAlerts(data.alerts || []);
        if (data.alerts && data.alerts.length > 0 && !selectedAlert) {
          setSelectedAlert(data.alerts[0]);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
    // Fetch global SHAP importance
    fetch(`${apiBase}/explain/global`)
      .then(r => r.json())
      .then(data => setGlobalImportance(data.ranking || []))
      .catch(console.error);
  }, [apiBase, filter]);

  const shapChartData = selectedAlert?.top_features ? selectedAlert.top_features.map(f => ({
    name: f.feature,
    impact: f.shap_value,
    abs: Math.abs(f.shap_value),
    direction: f.direction,
    raw: f.raw_value
  })) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Explainable AI (XAI) &amp; Threat Analysis (SHAP)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Powered by <code className="text-indigo-400">shap.TreeExplainer</code> with 200-sample background distribution for local &amp; global intrusion explainability.
        </p>
      </div>

      {/* Selected Alert Explainability Detail Card */}
      {selectedAlert ? (
        <div className="p-5 rounded-xl bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border border-indigo-500/40 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase mono ${
                selectedAlert.risk_level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                selectedAlert.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {selectedAlert.risk_level} Risk Threat
              </span>
              <span className="mono text-sm font-semibold text-gray-200">
                {selectedAlert.flow_id}
              </span>
            </div>

            <div className="text-xs text-gray-400 mono flex items-center gap-4">
              <span>Malicious Probability: <strong className="text-red-400 font-bold">{selectedAlert.risk_score}</strong></span>
              <span>Anomaly Score: <strong className="text-purple-400 font-bold">{selectedAlert.anomaly_score}</strong></span>
              <span>Action: <strong className="text-emerald-400 font-bold">{selectedAlert.simulated_action}</strong></span>
            </div>
          </div>

          {/* Natural Language Alert Text */}
          <div className="my-4 p-3 rounded-lg bg-gray-900/80 border border-indigo-500/20 flex items-start gap-3">
            <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold block mb-0.5">Automated Explainable Security Alert:</span>
              <p className="text-sm font-mono text-gray-100 font-medium">
                "{selectedAlert.alert_text || `Flow ${selectedAlert.flow_id}: ${selectedAlert.risk_level} risk (${selectedAlert.risk_score}). High flow rate detected.`}"
              </p>
            </div>
          </div>

          {/* Local SHAP Waterfall Bar Chart */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Local Feature Contributions to Threat Classification (SHAP Impact Values)
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapChartData} layout="vertical" margin={{ left: 100, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                    formatter={(val, name, props) => [
                      `SHAP Impact: ${val} (Raw Value: ${props.payload.raw}, ${props.payload.direction})`,
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
        <div className="p-8 rounded-xl bg-gray-900 border border-gray-800 text-center text-gray-400">
          No alert selected. Trigger live simulation on the Overview tab to stream new flows.
        </div>
      )}

      {/* Global SHAP Importance & Alert History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global SHAP Importance Ranking */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Global Feature Importance (SHAP)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Mean absolute SHAP value across the network traffic dataset</p>

          <div className="space-y-2.5">
            {globalImportance.slice(0, 8).map((feat, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between text-gray-400 mb-1">
                  <span className="font-medium text-gray-200">{feat.feature}</span>
                  <span className="mono text-indigo-400">{feat.importance.toFixed(4)}</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, feat.importance * 350)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Recorded Threat Alerts
            </h3>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs mono">
              {['All', 'High', 'Medium'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filter === lvl 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Flow ID</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Probability</th>
                  <th className="py-2.5 px-3">Anomaly</th>
                  <th className="py-2.5 px-3">Simulated Action</th>
                  <th className="py-2.5 px-3">Explain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                {alerts.length > 0 ? (
                  alerts.map((al, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedAlert(al)}
                      className={`cursor-pointer transition-colors ${
                        selectedAlert?.id === al.id 
                          ? 'bg-indigo-950/40 border-l-2 border-indigo-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-blue-400 font-semibold">{al.flow_id}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          al.risk_level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          al.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {al.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-200">{al.risk_score}</td>
                      <td className="py-2 px-3 text-purple-400">{al.anomaly_score}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">{al.simulated_action}</td>
                      <td className="py-2 px-3 text-indigo-400 flex items-center gap-1">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No security alerts recorded for filter: {filter}. Stream traffic via the live replay engine.
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

