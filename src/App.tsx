import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CsvUploader } from './components/CsvUploader';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { AiSummaryCard } from './components/AiSummaryCard';
import { OrdersDataTable } from './components/OrdersDataTable';
import { SalesOrder } from './types/sales';
import {
  parseCsvOrders,
  computeMatrixData,
  computeQ2ToQ3Variance,
  formatCurrency,
} from './utils/salesCalculator';
import { SAMPLE_CSV_DATA } from './utils/sampleData';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  Globe,
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute Matrix & Variance calculations whenever orders change
  const matrix = useMemo(() => computeMatrixData(orders), [orders]);
  const varianceSummary = useMemo(
    () => computeQ2ToQ3Variance(orders, matrix),
    [orders, matrix]
  );

  // Trigger AI variance summary generation using server-side Gemini
  const triggerAiAnalysis = useCallback(
    async (calcSummary = varianceSummary) => {
      if (!calcSummary.hasQ2AndQ3 || !calcSummary.mostChangedRegion) {
        setAiSummary(null);
        return;
      }

      setIsAiLoading(true);
      setAiError(null);

      try {
        const response = await fetch('/api/analyze-variance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calculatedData: calcSummary.aiPayload,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        setAiSummary(data.summary);
      } catch (err: any) {
        console.error('Failed to generate AI variance summary:', err);
        setAiError(err.message || 'Error communicating with analysis service.');
      } finally {
        setIsAiLoading(false);
      }
    },
    [varianceSummary]
  );

  // Handle uploaded CSV text
  const handleDataLoaded = (csvText: string, name: string) => {
    const { orders: parsedOrders, errors } = parseCsvOrders(csvText);
    setParseErrors(errors);
    if (parsedOrders.length > 0) {
      setOrders(parsedOrders);
      setFileName(name);

      const computedM = computeMatrixData(parsedOrders);
      const computedV = computeQ2ToQ3Variance(parsedOrders, computedM);
      triggerAiAnalysis(computedV);
    }
  };

  // Load sample dataset
  const handleLoadSample = () => {
    handleDataLoaded(SAMPLE_CSV_DATA, 'sample_sales_orders.csv');
  };

  // Auto-load sample dataset on first visit for instant delight
  useEffect(() => {
    handleLoadSample();
  }, []);

  const topRegion = varianceSummary.mostChangedRegion;

  return (
    <div className="min-h-screen bg-[#051613] text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  SalesPulse
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Regional Variance
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Regional Sales Orders &amp; Q2-to-Q3 Shift Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {orders.length > 0 && (
              <div className="hidden md:flex items-center gap-3 text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{matrix.quarters.join(', ')}</span>
                </div>
                <span className="text-slate-700">•</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>{matrix.regions.length} Regions</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* CSV Upload Section */}
        <CsvUploader
          onDataLoaded={handleDataLoaded}
          onLoadSample={handleLoadSample}
          orderCount={orders.length}
          fileName={fileName}
          errors={parseErrors}
        />

        {orders.length > 0 && (
          <>
            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Grand Total Revenue */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total All-Time Revenue</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {formatCurrency(matrix.grandTotalRevenue)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Across {matrix.quarters.length} active quarter(s)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Total Units Sold */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Units Sold</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {matrix.grandTotalUnits.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {orders.length.toLocaleString()} total sales orders
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              {/* Q2 vs Q3 Net Company Shift */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Q2 → Q3 Shift</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <p
                      className={`text-xl font-bold font-mono ${
                        varianceSummary.totalRevenueChange >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {varianceSummary.totalRevenueChange >= 0 ? '+' : ''}
                      {formatCurrency(varianceSummary.totalRevenueChange)}
                    </p>
                    <span
                      className={`text-xs font-semibold ${
                        varianceSummary.totalPctChange >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      ({varianceSummary.totalPctChange >= 0 ? '+' : ''}
                      {varianceSummary.totalPctChange.toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatCurrency(varianceSummary.totalQ2Revenue)} →{' '}
                    {formatCurrency(varianceSummary.totalQ3Revenue)}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    varianceSummary.totalRevenueChange >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Top Changed Region */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-medium text-slate-400">#1 Region Changed Most</p>
                  <p className="text-xl font-bold text-amber-300 mt-1 truncate">
                    {topRegion ? topRegion.region : 'N/A'}
                  </p>
                  {topRegion ? (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {topRegion.revenueDiff >= 0 ? '+' : ''}
                      {formatCurrency(topRegion.revenueDiff)} ({topRegion.pctChange >= 0 ? '+' : ''}
                      {topRegion.pctChange.toFixed(1)}%)
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5">Needs Q2 &amp; Q3 data</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* AI 3-Sentence Summary Card (High Prominence) */}
            <AiSummaryCard
              summary={aiSummary}
              isLoading={isAiLoading}
              error={aiError}
              onRegenerate={() => triggerAiAnalysis()}
              varianceSummary={varianceSummary}
            />

            {/* Total Revenue by Region and Quarter: Chart */}
            <RevenueChart matrix={matrix} />

            {/* Total Revenue by Region and Quarter: Table */}
            <RevenueTable matrix={matrix} varianceSummary={varianceSummary} />

            {/* Raw parsed sales orders explorer */}
            <OrdersDataTable
              orders={orders}
              quarters={matrix.quarters}
              regions={matrix.regions}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#041210] py-6 text-center text-xs text-slate-400 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SalesPulse</span>
            <span>•</span>
            <span>Quarterly Sales Order &amp; Regional Variance Platform</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strictly Grounded AI Summaries via Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
