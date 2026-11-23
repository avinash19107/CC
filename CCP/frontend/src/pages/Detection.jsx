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
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <Crosshair className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Intrusion Detection Performance (M2)
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
            60,011 Held-out Test Flows
          </span>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Random Forest Card */}
        <div className="p-5 rounded-xl bg-white border border-indigo-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Supervised Benchmark
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
                Random Forest (rf_v1)
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Accuracy</span>
              <span className="text-sm font-bold text-emerald-600">{(rf.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Precision</span>
              <span className="text-sm font-bold text-blue-600">{(rf.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Recall</span>
              <span className="text-sm font-bold text-purple-600">{(rf.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">F1-Score</span>
              <span className="text-sm font-bold text-indigo-600">{(rf.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100">
            <span>ROC-AUC: <strong className="text-slate-800">{(rf.roc_auc || 0.9999).toFixed(4)}</strong></span>
            <span>Trees: <strong className="text-slate-800">100 (Depth 16)</strong></span>
            <span>Size: <strong className="text-emerald-700 font-semibold">1.81 MB</strong></span>
          </div>
        </div>

        {/* Isolation Forest Card */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Unsupervised Detector
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
                Isolation Forest (iso)
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Accuracy</span>
              <span className="text-sm font-bold text-slate-800">{(iso.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Precision</span>
              <span className="text-sm font-bold text-slate-800">{(iso.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Recall</span>
              <span className="text-sm font-bold text-slate-800">{(iso.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">F1-Score</span>
              <span className="text-sm font-bold text-slate-800">{(iso.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2.5 border-t border-slate-100">
            <span>Trained: <strong className="text-emerald-700">Benign Only</strong></span>
            <span>Contamination: <strong className="text-slate-800">0.05</strong></span>
            <span>Size: <strong className="text-emerald-700 font-semibold">2.18 MB</strong></span>
          </div>
        </div>
      </div>

      {/* Confusion Matrices Heatmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RF Matrix */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Random Forest Matrix (rf_v1)
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">60,011 Flows</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block uppercase font-sans font-semibold">True Benign (TN)</span>
              <span className="text-lg font-bold text-emerald-700">{rfCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">99.83% Specificity</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 block uppercase font-sans font-semibold">False Positive (FP)</span>
              <span className="text-lg font-bold text-amber-700">{rfCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">0.17% False Alarm</span>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-800 block uppercase font-sans font-semibold">False Negative (FN)</span>
              <span className="text-lg font-bold text-rose-700">{rfCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-rose-600 block mt-0.5">0.74% Missed Attack</span>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-800 block uppercase font-sans font-semibold">True Attack (TP)</span>
              <span className="text-lg font-bold text-blue-700">{rfCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">99.26% Sensitivity</span>
            </div>
          </div>
        </div>

        {/* Isolation Forest Matrix */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Isolation Forest Matrix (iso)
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Zero-Day Anomaly</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block uppercase font-sans font-semibold">True Normal (TN)</span>
              <span className="text-lg font-bold text-emerald-700">{isoCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Benign Baseline</span>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 block uppercase font-sans font-semibold">False Alarm (FP)</span>
              <span className="text-lg font-bold text-amber-700">{isoCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">Noise Flags</span>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-800 block uppercase font-sans font-semibold">Missed Novelty (FN)</span>
              <span className="text-lg font-bold text-rose-700">{isoCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-rose-600 block mt-0.5">Stealth Attacks</span>
            </div>

            <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200">
              <span className="text-[10px] text-purple-800 block uppercase font-sans font-semibold">Detected Anomaly (TP)</span>
              <span className="text-lg font-bold text-purple-700">{isoCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-purple-600 block mt-0.5">Zero-Day Attacks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
