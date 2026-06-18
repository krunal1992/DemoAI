import React, { useState } from "react";
import { DistributionCenterInfo, DistributionCenterItem } from "../types";
import { AlertTriangle, CheckCircle, Flame, Search, ArrowRight, TrendingUp, HelpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

interface StockMonitorProps {
  data: DistributionCenterInfo[];
  loading: boolean;
  onSelectProduct: (dc: string, productId: string) => void;
}

export default function StockMonitor({ data, loading, onSelectProduct }: StockMonitorProps) {
  const [selectedDcId, setSelectedDcId] = useState<string>("DC-East");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const currentDc = data.find(d => d.dc_id === selectedDcId) || data[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-500">Querying live warehouse stock levels...</p>
      </div>
    );
  }

  if (!currentDc) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No Distribution Center online.</p>
      </div>
    );
  }

  // Categories
  const categories = ["all", ...Array.from(new Set(currentDc.items.map(i => i.category)))];

  // Filtering
  const filteredItems = currentDc.items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || item.productId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate high-level metrics for selected DC
  const criticalItems = currentDc.items.filter(i => i.status === "CRITICAL");
  const warningItems = currentDc.items.filter(i => i.status === "WARNING");
  const healthyCount = currentDc.items.filter(i => i.status === "OK").length;

  // Chart Mapping formatted for recharts
  const chartData = filteredItems.map(item => ({
    name: item.productName.split(" (")[0],
    "Current Stock": item.stockLevel,
    "Min Safety Stock": item.minStock,
    "Capacity Limit": item.maxStock,
    status: item.status,
    id: item.productId
  }));

  // Recharts custom colors matching status
  const getBarColor = (status: string) => {
    if (status === "CRITICAL") return "#f43f5e"; // rose-500
    if (status === "WARNING") return "#f59e0b"; // amber-500
    return "#3b82f6"; // blue-500
  };

  return (
    <div className="space-y-6">
      {/* Dynamic DC Selection Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((dc) => {
          const cCount = dc.items.filter(i => i.status === "CRITICAL").length;
          const isSelected = dc.dc_id === selectedDcId;
          return (
            <button
              key={dc.dc_id}
              onClick={() => setSelectedDcId(dc.dc_id)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? "bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/10 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">{dc.dc_id}</span>
                {cCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold animate-pulse">
                    {cCount} ALERT
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <h3 className="font-sans font-medium text-sm text-slate-900 dark:text-white truncate">{dc.name}</h3>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">{dc.location}</p>
            </button>
          );
        })}
      </div>

      {/* High-level status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Critical Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
            <Flame className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="font-sans text-xs text-slate-500 dark:text-slate-400">Critical Stockouts</div>
            <div className="font-sans font-bold text-2xl text-slate-900 dark:text-white mt-1">
              {criticalItems.length} <span className="text-xs font-mono font-normal text-rose-500">({criticalItems.length > 0 ? "Replenish immediately" : "None"})</span>
            </div>
          </div>
        </div>

        {/* Warning Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="font-sans text-xs text-slate-500 dark:text-slate-400">Warning Stock Level</div>
            <div className="font-sans font-bold text-2xl text-slate-900 dark:text-white mt-1">
              {warningItems.length} <span className="text-xs font-mono font-normal text-amber-500">({warningItems.length > 0 ? "Approaching min" : "Optimal"})</span>
            </div>
          </div>
        </div>

        {/* Healthy Indicator */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="font-sans text-xs text-slate-500 dark:text-slate-400">Baseline Optimal</div>
            <div className="font-sans font-bold text-2xl text-slate-900 dark:text-white mt-1">
              {healthyCount} <span className="text-xs font-mono font-normal text-emerald-500">({((healthyCount / currentDc.items.length) * 100).toFixed(0)}% Stable)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Stock Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-sans font-medium text-slate-900 dark:text-white">Active Product Level Chart</h3>
            <p className="font-mono text-xs text-slate-400">Showing comparisons against Safety Thresholds</p>
          </div>
          <div className="font-mono text-xs text-slate-500 flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-xs"></span> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-xs"></span> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-xs"></span> Optimal</span>
          </div>
        </div>

        <div className="h-72 w-full font-mono text-[11px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b", color: "#f8fafc" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar dataKey="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
              <Bar dataKey="Min Safety Stock" fill="#94a3b8" strokeDasharray="3 3" radius={[4, 4, 0, 0]} opacity={0.65} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid search filters + table items */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          {/* Search container */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search catalog ID, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="w-full sm:w-auto flex overflow-x-auto gap-1.5 scrollbar-none pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans border capitalize transition-all shrink-0 ${
                  categoryFilter === cat
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Product Specs</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Active Stock Level</th>
                <th className="py-3 px-4">Daily Velocity (Burn)</th>
                <th className="py-3 px-4">Est. Runout</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-400 font-sans text-xs">
                    No products match the filter search criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const percentOfMin = (item.stockLevel / item.minStock) * 100;
                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-xs">
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{item.productName}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">{item.productId}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono capitalize">
                        {item.category}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {item.stockLevel}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{item.unit}</span>
                        </div>
                        {/* Status bar */}
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.status === "CRITICAL" ? "bg-rose-500" : item.status === "WARNING" ? "bg-amber-500" : "bg-emerald-500"
                            }`} 
                            style={{ width: `${Math.min(100, Math.max(10, percentOfMin))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.burnRate} {item.unit}/day
                      </td>
                      <td className="py-4 px-4">
                        {item.status === "CRITICAL" ? (
                          <span className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold">
                            💥 {item.daysToEmpty} Days Left
                          </span>
                        ) : item.status === "WARNING" ? (
                          <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                            ⚠️ {item.daysToEmpty} Days
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                            {item.daysToEmpty} Days Left
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onSelectProduct(selectedDcId, item.productId)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-sans font-medium transition-colors flex items-center justify-center gap-1.5 ml-auto active:scale-[0.98]"
                        >
                          Auto-Pilot Analyze
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
