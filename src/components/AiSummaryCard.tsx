import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, AlertCircle, ShieldCheck, Code, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { VarianceCalculationSummary } from '../types/sales';
import { formatCurrency } from '../utils/salesCalculator';

interface AiSummaryCardProps {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  varianceSummary: VarianceCalculationSummary;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summary,
  isLoading,
  error,
  onRegenerate,
  varianceSummary,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split summary into sentences for verification display
  const sentences = summary
    ? summary
        .split(/(?<=[.?!])\s+/)
        .filter((s) => s.trim().length > 0)
    : [];

  const topRegion = varianceSummary.mostChangedRegion;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Q2 → Q3 Regional Variance Summary
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                Strictly Grounded
              </span>
            </div>
            <p className="text-xs text-indigo-200/70 mt-0.5">
              Three-sentence executive brief synthesized strictly from app-calculated metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Copy 3-sentence summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading || !varianceSummary.hasQ2AndQ3}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative mt-5">
        {isLoading ? (
          <div className="py-8 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium mb-3">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing calculated sales metrics and synthesizing 3-sentence summary...</span>
            </div>
            <div className="h-4 bg-slate-800/80 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-800/80 rounded w-11/12 animate-pulse" />
            <div className="h-4 bg-slate-800/80 rounded w-4/5 animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800/70 rounded-xl p-4 text-xs text-rose-200 flex items-start gap-3 my-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Unable to generate summary</p>
              <p className="text-rose-200/80">{error}</p>
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-900/60 hover:bg-rose-800/80 rounded text-rose-100 font-medium cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !varianceSummary.hasQ2AndQ3 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Upload a CSV containing both Q2 and Q3 sales orders to generate the variance summary.
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* The 3 Sentences Display */}
            <div className="bg-slate-950/70 border border-indigo-900/50 rounded-xl p-5 shadow-inner">
              <div className="text-slate-100 leading-relaxed text-sm space-y-2.5">
                {sentences.length === 3 ? (
                  sentences.map((sentence, idx) => (
                    <p key={idx} className="flex items-start gap-2.5">
                      <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-100 font-normal">{sentence}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-slate-100 text-sm leading-relaxed">{summary}</p>
                )}
              </div>
            </div>

            {/* Quick-reference calculated metrics verified from the data */}
            {topRegion && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                  <span className="text-[11px] text-slate-400 block">Top Changed Region</span>
                  <span className="text-sm font-bold text-white">{topRegion.region}</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                  <span className="text-[11px] text-slate-400 block">Q2 → Q3 Shift</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      topRegion.revenueDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {topRegion.revenueDiff >= 0 ? '+' : ''}
                    {formatCurrency(topRegion.revenueDiff)} ({topRegion.pctChange >= 0 ? '+' : ''}
                    {topRegion.pctChange.toFixed(1)}%)
                  </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                  <span className="text-[11px] text-slate-400 block">Q2 / Q3 Revenue</span>
                  <span className="text-sm font-mono text-slate-200">
                    {formatCurrency(topRegion.q2Revenue)} → {formatCurrency(topRegion.q3Revenue)}
                  </span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                  <span className="text-[11px] text-slate-400 block">Primary Driver Product</span>
                  <span className="text-sm font-medium text-indigo-300 truncate block">
                    {topRegion.topProductDriver ? topRegion.topProductDriver.product : 'General'}
                  </span>
                </div>
              </div>
            )}

            {/* Auditability Drawer: See exact payload given to Gemini */}
            <div className="border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={() => setShowPayload(!showPayload)}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showPayload ? 'Hide' : 'Inspect'} Calculated Numbers Fed to AI</span>
                {showPayload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPayload && (
                <div className="mt-3 bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                  <div className="text-slate-400 mb-2 font-sans text-xs">
                    This exact JSON payload of strictly computed numbers was sent to the server-side Gemini model:
                  </div>
                  <pre className="text-emerald-300">
                    {JSON.stringify(varianceSummary.aiPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
