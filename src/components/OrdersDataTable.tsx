import React, { useState } from 'react';
import { SalesOrder } from '../types/sales';
import { formatCurrency } from '../utils/salesCalculator';
import { Database, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface OrdersDataTableProps {
  orders: SalesOrder[];
  quarters: string[];
  regions: string[];
}

export const OrdersDataTable: React.FC<OrdersDataTableProps> = ({ orders, quarters, regions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredOrders = orders.filter((o) => {
    if (selectedQuarter !== 'all' && o.quarter !== selectedQuarter) return false;
    if (selectedRegion !== 'all' && o.region !== selectedRegion) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        o.product.toLowerCase().includes(term) ||
        o.channel.toLowerCase().includes(term) ||
        o.region.toLowerCase().includes(term) ||
        o.quarter.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Parsed Sales Orders Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredOrders.length.toLocaleString()} of {orders.length.toLocaleString()} total uploaded rows
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, channel..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          {/* Quarter dropdown */}
          <select
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Quarters</option>
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          {/* Region dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <th className="py-2.5 px-3 font-semibold">Quarter</th>
              <th className="py-2.5 px-3 font-semibold">Region</th>
              <th className="py-2.5 px-3 font-semibold">Channel</th>
              <th className="py-2.5 px-3 font-semibold">Product</th>
              <th className="py-2.5 px-3 font-semibold text-right">Units</th>
              <th className="py-2.5 px-3 font-semibold text-right">Discount %</th>
              <th className="py-2.5 px-3 font-semibold text-right text-slate-200">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedOrders.map((o, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-3 font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                      o.quarter === 'Q2' || o.quarter === 'Q3'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {o.quarter}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-white">{o.region}</td>
                <td className="py-2.5 px-3 text-slate-300">{o.channel}</td>
                <td className="py-2.5 px-3 text-slate-200">{o.product}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">{o.units.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                  {(o.discount_pct * 100).toFixed(0)}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                  {formatCurrency(o.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
        <div>
          Page {currentPage} of {totalPages} ({filteredOrders.length} records)
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
