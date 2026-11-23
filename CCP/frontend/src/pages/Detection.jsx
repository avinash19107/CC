import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, BarChart3, Crosshair } from 'lucide-react';

const FALLBACK_METRICS = {
  random_forest_v1: {
    accuracy: 0.9973171585209378,
    precision: 0.9920884567724716,
    recall: 0.9925615105855427,
    f1_score: 0.99232492730133,
    roc_auc: 0.999902587840252,
    confusion_matrix: [[49442, 83], [78, 10408]]
  },
  isolation_forest: {
    accuracy: 0.8689406942060622,
    precision: 0.6712847993726311,
    recall: 0.4897959183673469,
    f1_score: 0.5663560677068975,
    confusion_matrix: [[47010, 2515], [5350, 5136]]
  }
};

export default function Detection({ apiBase }) {
  const [metrics, setMetrics] = useState(FALLBACK_METRICS);

  const apiUrl = (path) => `${(apiBase || '').replace(/\/+$/, '')}/${(path || '').replace(/^\/+/, '')}`;

  useEffect(() => {
    fetch(apiUrl('metrics'))
      .then(res => res.ok ? res.text() : null)
      .then(text => {
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data && data.random_forest_v1) {
              setMetrics(data);
            }
          } catch (e) {
            console.warn("Metrics parse fallback:", e);
          }
        }
      })
      .catch(err => {
        console.warn("Metrics fetch fallback:", err);
      });
  }, [apiBase]);

  const rf = metrics?.random_forest_v1 || FALLBACK_METRICS.random_forest_v1;
  const iso = metrics?.isolation_forest || FALLBACK_METRICS.isolation_forest;
  const rfCm = rf.confusion_matrix || [[49442, 83], [78, 10408]];
  const isoCm = iso.confusion_matrix || [[47010, 2515], [5350, 5136]];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <Crosshair className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Intrusion Detection Performance (M2)
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            60,011 Held-out Test Flows
          </span>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Random Forest Card */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#0f172a] border border-indigo-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                Supervised Benchmark
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
                Random Forest (rf_v1)
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Accuracy</span>
              <span className="text-sm font-bold text-emerald-400">{(rf.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Precision</span>
              <span className="text-sm font-bold text-blue-400">{(rf.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Recall</span>
              <span className="text-sm font-bold text-purple-400">{(rf.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">F1-Score</span>
              <span className="text-sm font-bold text-indigo-400">{(rf.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>ROC-AUC: <strong className="text-slate-200">{(rf.roc_auc || 0.9999).toFixed(4)}</strong></span>
            <span>Trees: <strong className="text-slate-200">100 (Depth 16)</strong></span>
            <span>Size: <strong className="text-emerald-400">1.81 MB</strong></span>
          </div>
        </div>

        {/* Isolation Forest Card */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                Unsupervised Detector
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
                Isolation Forest (iso)
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Accuracy</span>
              <span className="text-sm font-bold text-slate-200">{(iso.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Precision</span>
              <span className="text-sm font-bold text-slate-200">{(iso.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Recall</span>
              <span className="text-sm font-bold text-slate-200">{(iso.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">F1-Score</span>
              <span className="text-sm font-bold text-slate-200">{(iso.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span>Trained: <strong className="text-emerald-400">Benign Only</strong></span>
            <span>Contamination: <strong className="text-slate-200">0.05</strong></span>
            <span>Size: <strong className="text-emerald-400">2.18 MB</strong></span>
          </div>
        </div>
      </div>

      {/* Confusion Matrices Heatmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RF Matrix */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Random Forest Matrix (rf_v1)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">60,011 Flows</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">True Benign (TN)</span>
              <span className="text-lg font-bold text-emerald-400">{rfCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">99.83% Specificity</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">False Positive (FP)</span>
              <span className="text-lg font-bold text-amber-400">{rfCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">0.17% False Alarm</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">False Negative (FN)</span>
              <span className="text-lg font-bold text-amber-400">{rfCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">0.74% Missed Attack</span>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">True Attack (TP)</span>
              <span className="text-lg font-bold text-blue-400">{rfCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">99.26% Sensitivity</span>
            </div>
          </div>
        </div>

        {/* Isolation Forest Matrix */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Isolation Forest Matrix (iso)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Zero-Day Anomaly</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">True Normal (TN)</span>
              <span className="text-lg font-bold text-emerald-400">{isoCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Benign Baseline</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">False Alarm (FP)</span>
              <span className="text-lg font-bold text-amber-400">{isoCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Noise Flags</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Missed Novelty (FN)</span>
              <span className="text-lg font-bold text-amber-400">{isoCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Stealth Attacks</span>
            </div>

            <div className="p-3.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Detected Anomaly (TP)</span>
              <span className="text-lg font-bold text-purple-400">{isoCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Zero-Day Attacks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
