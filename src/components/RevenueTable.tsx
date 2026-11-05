import React, { useState } from 'react';
import { MatrixData, VarianceCalculationSummary } from '../types/sales';
import { formatCurrency } from '../utils/salesCalculator';
import { Table, TrendingUp, TrendingDown, Award, ArrowUpDown, Filter } from 'lucide-react';

interface RevenueTableProps {
  matrix: MatrixData;
  varianceSummary: VarianceCalculationSummary;
}

export const RevenueTable: React.FC<RevenueTableProps> = ({ matrix, varianceSummary }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'variance'>('matrix');
  const [sortField, setSortField] = useState<'region' | 'totalRevenue' | 'q2Revenue' | 'q3Revenue' | 'diff' | 'pct'>('totalRevenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUnitsInMatrix, setShowUnitsInMatrix] = useState(false);

  const { quarters, regions, cells, regionTotals, quarterTotals, grandTotalRevenue, grandTotalUnits } = matrix;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sorted regions for Matrix tab
  const sortedRegions = [...regions].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortField === 'region') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    valA = regionTotals[a]?.revenue || 0;
    valB = regionTotals[b]?.revenue || 0;
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  // Sorted variance rows
  const sortedVariances = [...varianceSummary.allRegionVariances].sort((a, b) => {
    let diff = 0;
    if (sortField === 'region') {
      return sortOrder === 'asc' ? a.region.localeCompare(b.region) : b.region.localeCompare(a.region);
    } else if (sortField === 'q2Revenue') {
      diff = a.q2Revenue - b.q2Revenue;
    } else if (sortField === 'q3Revenue') {
      diff = a.q3Revenue - b.q3Revenue;
    } else if (sortField === 'diff') {
      diff = Math.abs(a.revenueDiff) - Math.abs(b.revenueDiff);
    } else if (sortField === 'pct') {
      diff = Math.abs(a.pctChange) - Math.abs(b.pctChange);
    } else {
      diff = Math.abs(a.revenueDiff) - Math.abs(b.revenueDiff);
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Sales Revenue Table</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tabular breakdown of total revenue by region, quarter, and Q2-to-Q3 variance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'matrix' && (
            <label className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnitsInMatrix}
                onChange={(e) => setShowUnitsInMatrix(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <span>Show Units</span>
            </label>
          )}

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Region x Quarter Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('variance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'variance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Q2 → Q3 Shift</span>
              {varianceSummary.mostChangedRegion && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: REGION X QUARTER MATRIX */}
      {activeTab === 'matrix' && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th
                  onClick={() => handleSort('region')}
                  className="py-3 px-4 font-semibold text-slate-300 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Region</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                {quarters.map((q) => (
                  <th key={q} className="py-3 px-4 font-semibold text-right text-slate-300">
                    <span className={q === 'Q2' || q === 'Q3' ? 'text-indigo-300 font-bold' : ''}>
                      {q} Revenue
                    </span>
                  </th>
                ))}
                <th
                  onClick={() => handleSort('totalRevenue')}
                  className="py-3 px-4 font-semibold text-right text-white cursor-pointer hover:text-indigo-300 bg-slate-950/80"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right text-slate-400">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedRegions.map((region) => {
                const totalRev = regionTotals[region]?.revenue || 0;
                const totalUnits = regionTotals[region]?.units || 0;
                const sharePct = grandTotalRevenue > 0 ? (totalRev / grandTotalRevenue) * 100 : 0;
                const isTopChanged = varianceSummary.mostChangedRegion?.region === region;

                return (
                  <tr key={region} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <span>{region}</span>
                      {isTopChanged && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                          <Award className="w-3 h-3 text-emerald-400" />
                          Top Q2-Q3 Shift
                        </span>
                      )}
                    </td>

                    {quarters.map((q) => {
                      const cell = cells[region]?.[q] || { revenue: 0, units: 0 };
                      const isFocusQuarter = q === 'Q2' || q === 'Q3';
                      return (
                        <td
                          key={q}
                          className={`py-3 px-4 text-right font-mono ${
                            isFocusQuarter ? 'bg-indigo-950/10' : ''
                          }`}
                        >
                          <div className="font-medium text-slate-200">
                            {formatCurrency(cell.revenue)}
                          </div>
                          {showUnitsInMatrix && (
                            <div className="text-[11px] text-slate-500 font-sans">
                              {cell.units.toLocaleString()} units
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400 bg-slate-950/40">
                      <div>{formatCurrency(totalRev)}</div>
                      {showUnitsInMatrix && (
                        <div className="text-[11px] text-slate-500 font-sans">
                          {totalUnits.toLocaleString()} units
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {sharePct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950 font-bold text-white">
                <td className="py-3 px-4">All Regions Total</td>
                {quarters.map((q) => {
                  const qTotalRev = quarterTotals[q]?.revenue || 0;
                  const qTotalUnits = quarterTotals[q]?.units || 0;
                  return (
                    <td key={q} className="py-3 px-4 text-right font-mono">
                      <div>{formatCurrency(qTotalRev)}</div>
                      {showUnitsInMatrix && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          {qTotalUnits.toLocaleString()} units
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                  <div>{formatCurrency(grandTotalRevenue)}</div>
                  {showUnitsInMatrix && (
                    <div className="text-[11px] text-slate-400 font-normal">
                      {grandTotalUnits.toLocaleString()} units
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right text-slate-300 font-mono">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB 2: Q2 VS Q3 VARIANCE DEEP-DIVE */}
      {activeTab === 'variance' && (
        <div>
          {!varianceSummary.hasQ2AndQ3 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              <p className="text-amber-300 font-semibold mb-1">Q2 and Q3 Data Required</p>
              <p>{varianceSummary.warning}</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Sorted by greatest shift ({sortOrder === 'desc' ? 'Highest first' : 'Lowest first'}). Showing calculated dollar &amp; percentage variance.
                </span>
                <span className="text-indigo-300 font-medium">
                  Primary Shift Driver: {varianceSummary.mostChangedRegion?.region || 'None'}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th
                      onClick={() => handleSort('region')}
                      className="py-3 px-4 font-semibold text-slate-300 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Region</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('q2Revenue')}
                      className="py-3 px-4 font-semibold text-right text-slate-300 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Q2 Revenue</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('q3Revenue')}
                      className="py-3 px-4 font-semibold text-right text-slate-300 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Q3 Revenue</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('diff')}
                      className="py-3 px-4 font-semibold text-right text-slate-300 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Dollar Change ($)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('pct')}
                      className="py-3 px-4 font-semibold text-right text-slate-300 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>% Change</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold text-right text-slate-300">Units Shift</th>
                    <th className="py-3 px-4 font-semibold text-left text-slate-300">Top Growth Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedVariances.map((v) => {
                    const isMostChanged = v.region === varianceSummary.mostChangedRegion?.region;
                    const isPositive = v.revenueDiff >= 0;

                    return (
                      <tr
                        key={v.region}
                        className={`transition-colors ${
                          isMostChanged ? 'bg-indigo-950/30 hover:bg-indigo-950/40' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <span>{v.region}</span>
                          {isMostChanged && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40">
                              <Award className="w-3 h-3 text-amber-400" />
                              #1 Most Changed
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(v.q2Revenue)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(v.q3Revenue)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {isPositive ? '+' : ''}
                            {formatCurrency(v.revenueDiff)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {v.pctChange.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {v.unitsDiff >= 0 ? `+${v.unitsDiff.toLocaleString()}` : v.unitsDiff.toLocaleString()} units
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {v.topProductDriver ? (
                            <span className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px]">
                              <span className="font-medium text-slate-200">{v.topProductDriver.product}</span>
                              <span
                                className={`font-mono ${
                                  v.topProductDriver.revenueDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                ({v.topProductDriver.revenueDiff >= 0 ? '+' : ''}
                                {formatCurrency(v.topProductDriver.revenueDiff)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
