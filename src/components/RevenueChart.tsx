import React, { useState } from 'react';
import { MatrixData } from '../types/sales';
import { formatCurrency } from '../utils/salesCalculator';
import { BarChart3, Layers, BarChart2 } from 'lucide-react';

interface RevenueChartProps {
  matrix: MatrixData;
}

// Distinct, high-contrast palette for regions
const REGION_COLORS: Record<string, { bg: string; fill: string; border: string; text: string }> = {
  North: { bg: 'bg-sky-500', fill: '#0ea5e9', border: '#38bdf8', text: 'text-sky-400' },
  South: { bg: 'bg-emerald-500', fill: '#10b981', border: '#34d399', text: 'text-emerald-400' },
  East: { bg: 'bg-amber-500', fill: '#f59e0b', border: '#fbbf24', text: 'text-amber-400' },
  West: { bg: 'bg-purple-500', fill: '#a855f7', border: '#c084fc', text: 'text-purple-400' },
  Central: { bg: 'bg-rose-500', fill: '#f43f5e', border: '#fb7185', text: 'text-rose-400' },
  EMEA: { bg: 'bg-indigo-500', fill: '#6366f1', border: '#818cf8', text: 'text-indigo-400' },
  APAC: { bg: 'bg-teal-500', fill: '#14b8a6', border: '#2dd4bf', text: 'text-teal-400' },
  Americas: { bg: 'bg-orange-500', fill: '#f97316', border: '#fb923c', text: 'text-orange-400' },
};

const FALLBACK_PALETTE = ['#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#f43f5e', '#6366f1', '#14b8a6'];

export const RevenueChart: React.FC<RevenueChartProps> = ({ matrix }) => {
  const [chartMode, setChartMode] = useState<'by-quarter' | 'by-region' | 'stacked'>('by-quarter');
  const [hoveredBar, setHoveredBar] = useState<{
    region: string;
    quarter: string;
    revenue: number;
    units: number;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, cells, quarterTotals, grandTotalRevenue } = matrix;

  if (quarters.length === 0 || regions.length === 0) {
    return null;
  }

  const getColor = (name: string, index: number) => {
    return REGION_COLORS[name] || {
      bg: 'bg-indigo-500',
      fill: FALLBACK_PALETTE[index % FALLBACK_PALETTE.length],
      border: FALLBACK_PALETTE[index % FALLBACK_PALETTE.length],
      text: 'text-indigo-400',
    };
  };

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const padding = { top: 40, right: 30, bottom: 55, left: 80 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Find max value for Y axis
  let maxRevenue = 0;
  if (chartMode === 'stacked') {
    quarters.forEach((q) => {
      const tot = quarterTotals[q]?.revenue || 0;
      if (tot > maxRevenue) maxRevenue = tot;
    });
  } else {
    regions.forEach((r) => {
      quarters.forEach((q) => {
        const rev = cells[r]?.[q]?.revenue || 0;
        if (rev > maxRevenue) maxRevenue = rev;
      });
    });
  }

  // Round maxRevenue up to clean intervals
  const yTicksCount = 5;
  const roughStep = maxRevenue / (yTicksCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const step = Math.ceil(roughStep / magnitude) * magnitude || 10000;
  const niceMaxY = step * (yTicksCount - 1);

  const yTicks = Array.from({ length: yTicksCount }, (_, i) => i * step);

  const getYCoord = (val: number) => {
    return padding.top + chartHeight - (val / niceMaxY) * chartHeight;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Revenue by Region &amp; Quarter</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare regional sales performance across all active fiscal quarters
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setChartMode('by-quarter')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'by-quarter'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            By Quarter
          </button>
          <button
            type="button"
            onClick={() => setChartMode('by-region')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'by-region'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            By Region
          </button>
          <button
            type="button"
            onClick={() => setChartMode('stacked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'stacked'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stacked
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-4 pb-2 text-xs">
        <span className="text-slate-400 font-medium">Regions:</span>
        {regions.map((region, idx) => {
          const col = getColor(region, idx);
          return (
            <div key={region} className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: col.fill }} />
              <span className="text-slate-200 font-medium">{region}</span>
            </div>
          );
        })}
      </div>

      {/* Chart SVG */}
      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] select-none"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Background Grid Lines & Y Axis Labels */}
          {yTicks.map((tickVal) => {
            const y = getYCoord(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="system-ui"
                >
                  {tickVal >= 1000000
                    ? `$${(tickVal / 1000000).toFixed(1)}M`
                    : tickVal >= 1000
                    ? `$${Math.round(tickVal / 1000)}k`
                    : `$${tickVal}`}
                </text>
              </g>
            );
          })}

          {/* Axes lines */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* MODE 1: BY QUARTER (Clusters of regions per quarter) */}
          {chartMode === 'by-quarter' && (
            <>
              {quarters.map((quarter, qIdx) => {
                const groupWidth = chartWidth / quarters.length;
                const groupX = padding.left + qIdx * groupWidth;
                const innerPadding = 16;
                const barWidth = Math.max(10, Math.min(34, (groupWidth - innerPadding * 2) / regions.length - 4));
                const totalBarsWidth = regions.length * barWidth + (regions.length - 1) * 4;
                const startX = groupX + (groupWidth - totalBarsWidth) / 2;

                const isQ2orQ3 = quarter === 'Q2' || quarter === 'Q3';

                return (
                  <g key={quarter}>
                    {/* Quarter highlight background if Q2 or Q3 */}
                    {isQ2orQ3 && (
                      <rect
                        x={groupX + 4}
                        y={padding.top}
                        width={groupWidth - 8}
                        height={chartHeight}
                        fill="#6366f1"
                        fillOpacity="0.04"
                        rx="6"
                      />
                    )}

                    {/* Quarter X-axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 24}
                      fill={isQ2orQ3 ? '#c7d2fe' : '#cbd5e1'}
                      fontSize="13"
                      fontWeight={isQ2orQ3 ? '600' : '500'}
                      textAnchor="middle"
                    >
                      {quarter}
                    </text>
                    {isQ2orQ3 && (
                      <text
                        x={groupX + groupWidth / 2}
                        y={svgHeight - padding.bottom + 40}
                        fill="#818cf8"
                        fontSize="10"
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        Variance Focus
                      </text>
                    )}

                    {/* Region Bars */}
                    {regions.map((region, rIdx) => {
                      const cell = cells[region]?.[quarter] || { revenue: 0, units: 0 };
                      const col = getColor(region, rIdx);
                      const barX = startX + rIdx * (barWidth + 4);
                      const barH = niceMaxY > 0 ? (cell.revenue / niceMaxY) * chartHeight : 0;
                      const barY = padding.top + chartHeight - barH;

                      const isHovered =
                        hoveredBar?.region === region && hoveredBar?.quarter === quarter;

                      return (
                        <g key={region}>
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={Math.max(barH, 2)}
                            rx="3"
                            fill={col.fill}
                            stroke={isHovered ? '#ffffff' : col.border}
                            strokeWidth={isHovered ? 2 : 1}
                            className="transition-all duration-150 cursor-pointer hover:opacity-90"
                            onMouseEnter={() =>
                              setHoveredBar({
                                region,
                                quarter,
                                revenue: cell.revenue,
                                units: cell.units,
                                x: barX + barWidth / 2,
                                y: barY,
                              })
                            }
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </>
          )}

          {/* MODE 2: BY REGION (Clusters of quarters per region) */}
          {chartMode === 'by-region' && (
            <>
              {regions.map((region, rIdx) => {
                const groupWidth = chartWidth / regions.length;
                const groupX = padding.left + rIdx * groupWidth;
                const innerPadding = 16;
                const barWidth = Math.max(10, Math.min(32, (groupWidth - innerPadding * 2) / quarters.length - 4));
                const totalBarsWidth = quarters.length * barWidth + (quarters.length - 1) * 4;
                const startX = groupX + (groupWidth - totalBarsWidth) / 2;
                const regionCol = getColor(region, rIdx);

                return (
                  <g key={region}>
                    {/* Region X-axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 24}
                      fill="#e2e8f0"
                      fontSize="13"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {region}
                    </text>

                    {/* Quarter Bars */}
                    {quarters.map((quarter, qIdx) => {
                      const cell = cells[region]?.[quarter] || { revenue: 0, units: 0 };
                      const barX = startX + qIdx * (barWidth + 4);
                      const barH = niceMaxY > 0 ? (cell.revenue / niceMaxY) * chartHeight : 0;
                      const barY = padding.top + chartHeight - barH;
                      const isHovered =
                        hoveredBar?.region === region && hoveredBar?.quarter === quarter;

                      // Lighten/darken based on quarter
                      const opacity = 0.5 + (qIdx / (quarters.length || 1)) * 0.5;

                      return (
                        <g key={quarter}>
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={Math.max(barH, 2)}
                            rx="3"
                            fill={regionCol.fill}
                            fillOpacity={opacity}
                            stroke={isHovered ? '#ffffff' : regionCol.border}
                            strokeWidth={isHovered ? 2 : 1}
                            className="transition-all duration-150 cursor-pointer"
                            onMouseEnter={() =>
                              setHoveredBar({
                                region,
                                quarter,
                                revenue: cell.revenue,
                                units: cell.units,
                                x: barX + barWidth / 2,
                                y: barY,
                              })
                            }
                          />
                          <text
                            x={barX + barWidth / 2}
                            y={svgHeight - padding.bottom + 40}
                            fill="#94a3b8"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {quarter}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </>
          )}

          {/* MODE 3: STACKED BARS PER QUARTER */}
          {chartMode === 'stacked' && (
            <>
              {quarters.map((quarter, qIdx) => {
                const groupWidth = chartWidth / quarters.length;
                const groupX = padding.left + qIdx * groupWidth;
                const barWidth = Math.min(56, groupWidth * 0.55);
                const barX = groupX + (groupWidth - barWidth) / 2;

                let currentStackY = padding.top + chartHeight;

                return (
                  <g key={quarter}>
                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - padding.bottom + 24}
                      fill="#e2e8f0"
                      fontSize="13"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {quarter}
                    </text>

                    {regions.map((region, rIdx) => {
                      const cell = cells[region]?.[quarter] || { revenue: 0, units: 0 };
                      const col = getColor(region, rIdx);
                      const segmentH = niceMaxY > 0 ? (cell.revenue / niceMaxY) * chartHeight : 0;
                      const segmentY = currentStackY - segmentH;
                      currentStackY = segmentY;

                      const isHovered =
                        hoveredBar?.region === region && hoveredBar?.quarter === quarter;

                      return (
                        <rect
                          key={region}
                          x={barX}
                          y={segmentY}
                          width={barWidth}
                          height={Math.max(segmentH, 0)}
                          fill={col.fill}
                          stroke={isHovered ? '#ffffff' : col.border}
                          strokeWidth={isHovered ? 2 : 0.5}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredBar({
                              region,
                              quarter,
                              revenue: cell.revenue,
                              units: cell.units,
                              x: barX + barWidth / 2,
                              y: segmentY + segmentH / 2,
                            })
                          }
                        />
                      );
                    })}

                    {/* Quarter Total Label on top of stack */}
                    <text
                      x={barX + barWidth / 2}
                      y={currentStackY - 6}
                      fill="#cbd5e1"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {formatCurrency(quarterTotals[quarter]?.revenue || 0)}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredBar && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs backdrop-blur-md transition-all -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredBar.x / svgWidth) * 100}%`,
              top: `${(hoveredBar.y / svgHeight) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>{hoveredBar.region}</span>
              <span className="text-slate-400 font-normal">({hoveredBar.quarter})</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Total Revenue:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(hoveredBar.revenue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Total Units:</span>
                <span className="font-medium text-slate-200">{hoveredBar.units.toLocaleString()}</span>
              </div>
              {grandTotalRevenue > 0 && (
                <div className="flex justify-between gap-4 border-t border-slate-800/80 pt-1 text-[11px]">
                  <span className="text-slate-400">Share of All Revenue:</span>
                  <span className="text-indigo-300 font-medium">
                    {((hoveredBar.revenue / grandTotalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
