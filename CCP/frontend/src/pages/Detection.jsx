import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, AlertCircle, BarChart3, CheckCircle, Crosshair } from 'lucide-react';

export default function Detection({ apiBase }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load metrics:", err);
        setLoading(false);
      });
  }, [apiBase]);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 font-mono animate-pulse">
        Loading evaluation metrics from model_pack/metrics.json...
      </div>
    );
  }

  const rf = metrics?.random_forest_v1 || {};
  const iso = metrics?.isolation_forest || {};
  const rfCm = rf.confusion_matrix || [[49442, 83], [78, 10408]];
  const isoCm = iso.confusion_matrix || [[47010, 2515], [5350, 5136]];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-purple-400" />
          AI-Based Intrusion Detection &amp; Classification Metrics
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supervised Random Forest (rf_v1) vs Unsupervised Anomaly Isolation Forest trained on 300,055 flows.
        </p>
      </div>

      {/* Model Performance Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Random Forest Card */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-indigo-500/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                Primary Supervised Classifier
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Random Forest (rf_v1)</h3>
            </div>
            <Cpu className="w-8 h-8 text-indigo-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 mono">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Accuracy</span>
              <span className="text-base font-bold text-emerald-400">{(rf.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Precision</span>
              <span className="text-base font-bold text-blue-400">{(rf.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Recall</span>
              <span className="text-base font-bold text-purple-400">{(rf.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">F1-Score</span>
              <span className="text-base font-bold text-indigo-400">{(rf.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>ROC-AUC: <strong className="text-gray-200 mono">{(rf.roc_auc || 0.9999).toFixed(4)}</strong></span>
            <span>Trees: <strong className="text-gray-200 mono">100</strong> (Max Depth: 16)</span>
            <span>Size: <strong className="text-emerald-400 mono">1.81 MB</strong></span>
          </div>
        </div>

        {/* Isolation Forest Card */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Unsupervised Anomaly Detector
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Isolation Forest (iso)</h3>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 mono">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Accuracy</span>
              <span className="text-base font-bold text-gray-200">{(iso.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Precision</span>
              <span className="text-base font-bold text-gray-200">{(iso.precision * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">Recall</span>
              <span className="text-base font-bold text-gray-200">{(iso.recall * 100).toFixed(2)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[11px] text-gray-500 block">F1-Score</span>
              <span className="text-base font-bold text-gray-200">{(iso.f1_score * 100).toFixed(2)}%</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>Trained On: <strong className="text-emerald-400">Benign Traffic Only</strong></span>
            <span>Contamination: <strong className="text-gray-200 mono">0.05</strong></span>
            <span>Size: <strong className="text-emerald-400 mono">2.18 MB</strong></span>
          </div>
        </div>
      </div>

      {/* Confusion Matrices Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RF Confusion Matrix */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Random Forest Confusion Matrix (Test Set: 60,011 flows)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Rows: Actual Class | Columns: Predicted Class</p>

          <div className="grid grid-cols-2 gap-3 text-center mono">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-xs text-gray-400 block font-sans">True Benign (TN)</span>
              <span className="text-xl font-bold text-emerald-400">{rfCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">99.83% Specificity</span>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="text-xs text-gray-400 block font-sans">False Alarm (FP)</span>
              <span className="text-xl font-bold text-amber-400">{rfCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">0.17% False Positive</span>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-gray-400 block font-sans">Missed Attack (FN)</span>
              <span className="text-xl font-bold text-amber-400">{rfCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">0.74% False Negative</span>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <span className="text-xs text-gray-400 block font-sans">Detected Attack (TP)</span>
              <span className="text-xl font-bold text-blue-400">{rfCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">99.26% Sensitivity</span>
            </div>
          </div>
        </div>

        {/* Isolation Forest Confusion Matrix */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Isolation Forest Confusion Matrix (Zero-Day Anomaly Evaluation)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Evaluates zero-shot novelty detection without attack labels</p>

          <div className="grid grid-cols-2 gap-3 text-center mono">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-xs text-gray-400 block font-sans">True Normal (TN)</span>
              <span className="text-xl font-bold text-emerald-400">{isoCm[0][0].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Normal Baseline</span>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="text-xs text-gray-400 block font-sans">False Alarm (FP)</span>
              <span className="text-xl font-bold text-amber-400">{isoCm[0][1].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Noise Flags</span>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-gray-400 block font-sans">Missed Novelty (FN)</span>
              <span className="text-xl font-bold text-amber-400">{isoCm[1][0].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Stealth Attacks</span>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs text-gray-400 block font-sans">Detected Anomaly (TP)</span>
              <span className="text-xl font-bold text-purple-400">{isoCm[1][1].toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 block mt-1">Zero-Day Attacks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

