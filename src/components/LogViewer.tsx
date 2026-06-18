import React, { useState, useEffect } from "react";
import { LogEntry } from "../types";
import { Search, RotateCcw, RotateCw, AlertTriangle, AlertCircle, Info, Filter, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface LogViewerProps {
  onSelectScenario: (dc: string, productId: string, scenarioId: string) => void;
}

export default function LogViewer({ onSelectScenario }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [dcFilter, setDcFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        dc: dcFilter,
        severity: severityFilter,
        service: serviceFilter,
        search: searchQuery
      });

      const response = await fetch(`/api/data/logs?${params.toString()}`);
      if (!response.ok) throw new Error("Logger failed");
      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      toast.error("Failed to query log registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, dcFilter, severityFilter, serviceFilter, limit]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchLogs();
    }
  };

  const clearFilters = () => {
    setDcFilter("");
    setSeverityFilter("");
    setServiceFilter("");
    setSearchQuery("");
    setPage(1);
    toast.success("Filters cleared");
    setTimeout(fetchLogs, 100);
  };

  const handleResetCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      toast.success("Logs re-compiled and vectors seeded!");
      setPage(1);
      fetchLogs();
    } catch (err) {
      toast.error("Failed to reset dataset");
    } finally {
      setLoading(false);
    }
  };

  // Predefined scenarios list for quick access mapping
  const SCENARIOS = [
    { id: "ANOMALY-01", name: "Demand Surge on Dairy", dc: "DC-East", prod: "PROD-MILK", badge: "Critical" },
    { id: "ANOMALY-02", name: "Bread/Wheat Shrinkage Loss", dc: "DC-West", prod: "PROD-BREAD", badge: "Warning" },
    { id: "ANOMALY-03", name: "Forklift Driver Deadlocks", dc: "DC-Central", prod: "PROD-JUICE", badge: "Critical" },
    { id: "ANOMALY-04", name: "I-80 Blizzard Delay (Tomatoes)", dc: "DC-South", prod: "PROD-TOMATO", badge: "Warning" },
    { id: "ANOMALY-05", name: "EDI restock request timeout", dc: "DC-East", prod: "PROD-CHIPS", badge: "Error" },
    { id: "ANOMALY-06", name: "Sugar allocations rationed", dc: "DC-West", prod: "PROD-SUGAR", badge: "Warning" },
    { id: "ANOMALY-07", name: "Silica short glass Packaging drop", dc: "DC-Central", prod: "PROD-PEANUT", badge: "Critical" },
    { id: "ANOMALY-08", name: "Clerical manifestation deadlocks", dc: "DC-South", prod: "PROD-COOKI", badge: "Warning" },
    { id: "ANOMALY-09", name: "Transport reefer compartment spoil", dc: "DC-East", prod: "PROD-COOKI", badge: "Critical" },
    { id: "ANOMALY-10", name: "Seasonal picking workforce deficit", dc: "DC-West", prod: "PROD-PASTA", badge: "Warning" }
  ];

  const applyScenario = (dc: string, prod: string, id: string) => {
    setDcFilter(dc);
    setSearchQuery("");
    setSeverityFilter("");
    setServiceFilter("");
    setPage(1);
    toast.success(`Active filter: ${id}`);
    
    // Auto-populate filter for quick observation
    // Execute after state cycles
    setTimeout(() => {
      fetchLogs();
    }, 150);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Quick Scenario Jumps */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-sans font-medium text-slate-900 dark:text-white">Active Telemetry Scenarios</h3>
            <p className="font-mono text-xs text-slate-400">Jump directly to specific operational anomalies</p>
          </div>
          <button
            onClick={handleResetCatalog}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" /> Re-Seed Datasets
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {SCENARIOS.map((sc, index) => (
            <div
              key={sc.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                    Scenario 0{index + 1}
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1 rounded-sm uppercase ${
                    sc.badge === "Critical" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}>
                    {sc.badge}
                  </span>
                </div>
                <h4 className="font-sans font-semibold text-slate-950 dark:text-slate-100 text-xs truncate">
                  {sc.name}
                </h4>
                <p className="font-mono text-[10px] text-slate-500 mt-1 uppercase">
                  {sc.dc} • {sc.id.split("-")[1] || "CPG"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  onClick={() => applyScenario(sc.dc, sc.prod, sc.id)}
                  className="font-mono text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all underline"
                >
                  Inspect Logs
                </button>
                <button
                  onClick={() => onSelectScenario(sc.dc, sc.prod, sc.id)}
                  className="text-blue-600 dark:text-blue-400 font-mono text-[10px] flex items-center gap-0.5 hover:underline font-bold"
                >
                  Analyze <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Log Filter Controls & List */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-5">
          <div className="w-full lg:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search traces / keywords... (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="w-full lg:w-auto flex flex-wrap gap-2 items-center">
            {/* DC dropdown */}
            <select
              value={dcFilter}
              onChange={(e) => setDcFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All DCs</option>
              <option value="DC-East">DC-East</option>
              <option value="DC-West">DC-West</option>
              <option value="DC-Central">DC-Central</option>
              <option value="DC-South">DC-South</option>
            </select>

            {/* Severity dropdown */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR / FATAL</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Services</option>
              <option value="InventoryService">InventoryService</option>
              <option value="OrderProcessor">OrderProcessor</option>
              <option value="LogisticsCarrier">LogisticsCarrier</option>
              <option value="WarehouseMgmt">WarehouseMgmt</option>
              <option value="SupplierERP">SupplierERP</option>
              <option value="ColdChainSensors">ColdChainSensors</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-1.5 border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-sans transition-all flex items-center gap-1"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
          <table className="w-full font-mono text-left text-[11px] leading-relaxed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider text-[9px]">
                <th className="py-3 px-4 w-40">TIMESTAMP (UTC)</th>
                <th className="py-3 px-4 w-28">DC LOC</th>
                <th className="py-3 px-4 w-32">SERVICE</th>
                <th className="py-3 px-4 w-28">SEVERITY</th>
                <th className="py-3 px-4">TRACE MESSAGE LOG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans text-xs">
                    <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Fetching indexed traces...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No log traces found matching active filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let alertClass = "text-slate-400 bg-slate-50 dark:bg-slate-950";
                  let Icon = Info;
                  switch (log.severity) {
                    case "ERROR":
                      alertClass = "text-rose-600 bg-rose-50/50 dark:text-rose-400 dark:bg-rose-950/20 font-bold";
                      Icon = AlertCircle;
                      break;
                    case "WARNING":
                      alertClass = "text-amber-600 bg-amber-50/50 dark:text-amber-400 dark:bg-amber-950/20";
                      Icon = AlertTriangle;
                      break;
                  }

                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors ${log.severity !== "INFO" ? "bg-slate-50/20 dark:bg-slate-950/10" : ""}`}>
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {log.timestamp.slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {log.dc}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {log.service}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-semibold uppercase tracking-wider ${alertClass}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-200">
                        <div className="font-mono text-xs">{log.message}</div>
                        <div className="font-mono text-[9px] text-slate-400 mt-1 flex gap-2">
                          <span>TraceID: <span className="text-slate-500 select-all">{log.traceId}</span></span>
                          {log.metadata?.scenarioId && (
                            <span className="text-blue-500">[{log.metadata.scenarioId}]</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginations bar */}
        <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="font-sans text-xs text-slate-500 dark:text-slate-400">
            Total trace matches: <span className="font-bold text-slate-900 dark:text-white">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-sans border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all text-slate-700 dark:text-slate-300 active:scale-95"
            >
              Previous
            </button>
            <div className="font-mono text-xs text-slate-500">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-sans border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all text-slate-700 dark:text-slate-300 active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
