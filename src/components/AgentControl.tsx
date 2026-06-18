import React, { useState, useEffect, useRef } from "react";
import { AnomalyReport, ReorderSchedule, DemandForecast } from "../types";
import { PRODUCTS, DISTRIBUTION_CENTERS } from "../server/utils/data.js";
import { 
  Play, RefreshCw, Cpu, Activity, AlertTriangle, FileText, Download, CheckSquare, 
  ThumbsUp, ThumbsDown, MessageSquare, Calendar, ShieldCheck, HelpCircle, ArrowRight
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

interface AgentControlProps {
  preselectedDc?: string;
  preselectedProductId?: string;
  preselectedScenarioId?: string;
  onAnalysisSuccess: () => void;
}

interface ProgressLine {
  stage: string;
  text: string;
  timestamp: string;
}

export default function AgentControl({ 
  preselectedDc = "DC-East", 
  preselectedProductId = "PROD-MILK", 
  preselectedScenarioId = "ANOMALY-01",
  onAnalysisSuccess
}: AgentControlProps) {
  const [dc, setDc] = useState(preselectedDc);
  const [productId, setProductId] = useState(preselectedProductId);
  const [scenarioId, setScenarioId] = useState(preselectedScenarioId);

  // Sync state if preselected values shift from parent tabs
  useEffect(() => {
    if (preselectedDc) setDc(preselectedDc);
    if (preselectedProductId) setProductId(preselectedProductId);
    if (preselectedScenarioId) setScenarioId(preselectedScenarioId);
  }, [preselectedDc, preselectedProductId, preselectedScenarioId]);

  const [loading, setLoading] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<ProgressLine[]>([]);
  const [currentStage, setCurrentStage] = useState("");
  const [aiEngineMode, setAiEngineMode] = useState<"Simulated" | "Gemini 3.5 Active">("Simulated");

  // Report package
  const [report, setReport] = useState<{
    anomalyReport: AnomalyReport;
    demandForecast: DemandForecast;
    reorderRecommendation: ReorderSchedule;
    cotSteps: string[];
    detailedAnalysis: string;
  } | null>(null);

  // Operator feedback
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<"up" | "down" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll live terminal to bottom when a new line is pumped
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionLogs]);

  // Check if GEMINI_API_KEY is active on server
  useEffect(() => {
    // If we have API, show full mode, else demo mode
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/data/logs?limit=1");
        if (response.ok) {
          // If env has key on server we mark as Active. By default, let's look at the result status when analyze completes
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkApiKey();
  }, []);

  const triggerMultiAgentWorkflow = async () => {
    setLoading(true);
    setReport(null);
    setSubmittedFeedback(false);
    setFeedbackRating(null);
    setFeedbackComment("");
    setSessionLogs([]);
    setCurrentStage("INIT_PIPELINE");

    const sessId = `sess-${Math.floor(Math.random() * 900000 + 100000)}`;

    // 1. Establish WebSocket stream first (Mandated Flow!)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/progress?sessionId=${sessId}`;

    console.log(`Pipeline: opening WS connection to ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established. Launching REST request...");
      // Append initial log line client-side
      setSessionLogs(l => [...l, {
        stage: "WS_OPENED",
        text: "Authorized telemetry link established. Pre-warming RAG cache indices...",
        timestamp: new Date().toISOString()
      }]);

      // 2. Now trigger standard REST pipeline execution
      triggerRestPipeline(sessId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stage) {
          setCurrentStage(data.stage);
          setSessionLogs(lines => [...lines, {
            stage: data.stage,
            text: data.text || "Diagnostic heartbeat registered.",
            timestamp: data.timestamp || new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    ws.onerror = (e) => {
      console.error("WS transport failure:", e);
    };

    ws.onclose = () => {
      console.log("WebSocket pipeline closed.");
    };
  };

  const triggerRestPipeline = async (sessionId: string) => {
    try {
      const response = await fetch("/api/agents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          activeScenarioId: scenarioId,
          dcName: dc,
          prodId: productId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Execution failed");
      }

      setReport({
        anomalyReport: data.anomalyReport,
        demandForecast: data.demandForecast,
        reorderRecommendation: data.reorderRecommendation,
        cotSteps: data.cotSteps,
        detailedAnalysis: data.detailedAnalysis
      });

      // Detect if Gemini API was used or fallbacks took place
      if (data.anomalyReport?.id?.includes("MSG-AI") || data.anomalyReport?.id?.startsWith("ANOM-") && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY !== "") {
        setAiEngineMode("Gemini 3.5 Active");
      } else {
        setAiEngineMode("Simulated");
      }

      toast.success("All Agents completed telemetry successfully!");
      onAnalysisSuccess(); // Trigger stock listing audit refreshes on parent
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed during multi-agent analysis.");
      setSessionLogs(lines => [...lines, {
        stage: "STG_ERROR",
        text: `FATAL: Pipeline aborted. Reason: ${err.message || "Internal Service Timeout"}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      // Close WebSocket safely
      if (wsRef.current) {
        wsRef.current.close();
      }
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackRating) {
      toast.error("Please pick a satisfaction rating indicator first.");
      return;
    }

    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomalyId: report?.anomalyReport?.id,
          reorderId: report?.reorderRecommendation?.id,
          rating: feedbackRating,
          comments: feedbackComment
        })
      });

      if (res.ok) {
        setSubmittedFeedback(true);
        toast.success("Feedback saved into operational training log!");
      }
    } catch (e) {
      toast.error("Failed to submit feedback registry.");
    }
  };

  // Pre-calculated target labels
  const activeProductObj = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];
  const activeScenarioNum = scenarioId.split("-")[1] || "01";

  // Recharts 7 Days forecast data formulation
  const forecastChartData = report?.demandForecast 
    ? report.demandForecast.next7DaysForecast.map((val, idx) => {
        const date = new Date();
        date.setDate(date.getDate() + idx + 1);
        return {
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          "Projected Volume": val
        };
      })
    : [];

  const handleExportPDF = () => {
    window.print();
  };

  const handleCopyJSON = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast.success("JSON telemetry payload copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Parameter Selection panel left */}
      <div className="xl:col-span-4 space-y-5">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <h3 className="font-sans font-medium text-slate-900 dark:text-white mb-4">Core Analysis Parameter Input</h3>
          <div className="space-y-4">
            {/* DC Dropdown */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-2">Target DC</label>
              <select
                value={dc}
                onChange={(e) => setDc(e.target.value)}
                disabled={loading}
                className="w-full pl-3 pr-8 py-2 text-xs font-sans rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {DISTRIBUTION_CENTERS.map(dName => (
                  <option key={dName} value={dName}>{dName} (Warehouse)</option>
                ))}
              </select>
            </div>

            {/* Product Dropdown */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-2">Primary Product ID</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loading}
                className="w-full pl-3 pr-8 py-2 text-xs font-sans rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Scenario Mapping Dropdown */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-2">Active Bottleneck Scenario</label>
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                disabled={loading}
                className="w-full pl-3 pr-8 py-2 text-xs font-sans rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ANOMALY-01">ANOMALY-01: Perishable Demand Surge</option>
                <option value="ANOMALY-02">ANOMALY-02: Local Aisle Discrepancy Shrinkage</option>
                <option value="ANOMALY-03">ANOMALY-03: Loading bay driver gridlock</option>
                <option value="ANOMALY-04">ANOMALY-04: Blizzard transit route delay</option>
                <option value="ANOMALY-05">ANOMALY-05: API EDI purchase order failure</option>
                <option value="ANOMALY-06">ANOMALY-06: Sugarcane supplier capacity caps</option>
                <option value="ANOMALY-07">ANOMALY-07: Silica short jar packing disruption</option>
                <option value="ANOMALY-08">ANOMALY-08: Invoice gate bills-of-lading block</option>
                <option value="ANOMALY-09">ANOMALY-09: Refrigeration trailer spoilage</option>
                <option value="ANOMALY-10">ANOMALY-10: Peak season staff roster shortage</option>
              </select>
            </div>

            <button
              onClick={triggerMultiAgentWorkflow}
              disabled={loading}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-sans font-medium text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Downstream Agents...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Multi-Agent Diagnostics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Terminal outputs */}
        <div className="p-5 bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-80">
          <div className="flex justify-between items-center pb-3 border-b border-slate-900 mb-3 shrink-0">
            <span className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-slate-700"}`}></span>
              Active Diagnostic Heartbeat
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Session Live Link
            </span>
          </div>

          {/* Scrolling output lines */}
          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed scrollbar-thin select-text">
            {sessionLogs.length === 0 ? (
              <div className="text-slate-600 italic h-full flex items-center justify-center text-center p-6">
                Terminal idle. Click 'Run Multi-Agent Diagnostics' to initiate websocket stream callbacks.
              </div>
            ) : (
              sessionLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600">[{log.timestamp.slice(14, 19)}]</span>
                  <span className={
                    log.stage === "STG_ERROR" ? "text-rose-400" : 
                    log.stage === "STAGE_PIPELINE_COMPLETE" ? "text-emerald-400 font-bold" : 
                    "text-sky-300"
                  }>
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Main Compiled outputs right */}
      <div className="xl:col-span-8 space-y-6">
        {!report && !loading && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20">
            <Cpu className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-sans font-semibold text-slate-900 dark:text-white text-base">Continuous Diagnostics Idle</h3>
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5">
              Select your parameters on the left and trigger the Multi-Agent engine to capture real-time CPG replenishment suggestions and root cause analyses.
            </p>
          </div>
        )}

        {loading && !report && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-24 space-y-4">
            <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
            <div className="font-sans font-bold text-slate-800 dark:text-white text-sm">
              AI Orchestral Pipeline active on Server
            </div>
            <p className="font-sans text-xs text-slate-400 max-w-xs leading-normal">
              Evaluating RAG data clusters &amp; compiling 4-stage step-by-step diagnostic reasoning records. Results will stream momentarily.
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-6 print:border-none print:shadow-none">
            {/* 1. Header Card Anomaly Detection */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 shrink-0 flex items-center gap-1">
                <span className="font-mono text-[9px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase border border-slate-200 dark:border-slate-800">
                  Confidence Score: {(report.anomalyReport.confidenceScore * 100).toFixed(0)}%
                </span>
                <span className="font-mono text-[9px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase border border-slate-200 dark:border-slate-800">
                  {aiEngineMode}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                  report.anomalyReport.severity === "CRITICAL"
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                }`}>
                  {report.anomalyReport.severity} ALERT
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">
                  Scenario {scenarioId}
                </span>
              </div>

              <h2 className="font-sans font-bold text-xl text-slate-950 dark:text-white mb-2">
                {report.anomalyReport.title}
              </h2>
              <div className="font-mono text-[11px] text-blue-500 dark:text-blue-400 uppercase tracking-wide font-bold mb-4">
                Category: {report.anomalyReport.anomalyClass}
              </div>

              <p className="font-sans text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                {report.anomalyReport.description}
              </p>
            </div>

            {/* 2. CoT Diagnostical Steps */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h3 className="font-sans font-bold text-slate-950 dark:text-white text-sm mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                Step-by-Step Chain-of-Thought Reasoning
              </h3>

              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 space-y-6">
                {report.cotSteps.map((stepText, idx) => (
                  <div key={idx} className="relative pl-6">
                    {/* Circle marker */}
                    <span className="absolute -left-[11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-950 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white shadow-xs">
                      {idx + 1}
                    </span>
                    <p className="font-sans text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {stepText}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800/50 pt-5">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2">Root Cause Synthesis</div>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400 leading-normal italic">
                  "{report.detailedAnalysis}"
                </p>
              </div>
            </div>

            {/* 3. Reorder Suggestion Split card and Future demand details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Restock slip */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full shrink-0" />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-sans font-bold text-slate-950 dark:text-white text-sm">Replenishment Order Slip</h3>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold uppercase">
                      Suggested RESTOCK
                    </span>
                  </div>

                  <div className="space-y-3 font-sans text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">SUPPLIER:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{report.reorderRecommendation.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">PRODUCT:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{report.reorderRecommendation.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">RECOMMENDED QUANTITY:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {report.reorderRecommendation.recommendedQty} ({activeProductObj.unit})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">EST COST (PRE-VAT):</span>
                      <span className="font-medium text-slate-900 dark:text-white font-mono">${report.reorderRecommendation.restockingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> EST LEAD TIME:
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold">{report.reorderRecommendation.leadTimeDays} DAYS (ETA: {report.reorderRecommendation.estimatedDeliveryDate})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/40 text-[11px] leading-relaxed text-blue-800 dark:text-blue-400">
                  <strong>Trigger Context:</strong> {report.reorderRecommendation.reorderTriggerReason}
                </div>
              </div>

              {/* Demand chart */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-sans font-bold text-slate-950 dark:text-white text-sm">7-Day Demand Forecast</h3>
                    <p className="font-mono text-[10px] text-slate-400">Projected volume changes</p>
                  </div>
                  <span className="font-mono text-xs text-emerald-500 font-bold">
                    +{report.demandForecast.forecastedDailyGrowth}% Velocity
                  </span>
                </div>

                <div className="h-44 w-full font-mono text-[9px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b", color: "#f8fafc" }}
                      />
                      <Bar dataKey="Projected Volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-3 italic leading-normal">
                  "AI Insight: {report.demandForecast.insights}"
                </p>
              </div>
            </div>

            {/* Print, Export & Copy */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="font-mono text-[10px] text-slate-500">
                Diagnostic ID: {report.anomalyReport.id}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98]"
                >
                  Copy JSON Payload
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono transition-all flex items-center gap-1 ml-auto active:scale-[0.98]"
                >
                  <Download className="w-4.5 h-4.5" /> Print / Export Report
                </button>
              </div>
            </div>

            {/* 4. Operator Feedback Loop */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <h3 className="font-sans font-bold text-slate-950 dark:text-white text-sm mb-2">
                Operational Evaluation Loop
              </h3>
              <p className="font-sans text-xs text-slate-400 mb-4">
                Did this recommendation restock schedule resolve risk? Help calibrate dynamic logistics.
              </p>

              {submittedFeedback ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-999/10 border border-emerald-100 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400 text-xs font-sans flex items-center gap-2">
                  <ShieldCheck className="w-5.5 h-5.5" />
                  Your evaluation feedback was logged and committed into training weights. Thank you!
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackRating("up")}
                      className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-sans font-medium text-xs transition-all active:scale-95 ${
                        feedbackRating === "up"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> Good / Mitigated Anomaly
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackRating("down")}
                      className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-sans font-medium text-xs transition-all active:scale-95 ${
                        feedbackRating === "down"
                          ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 hover:border-rose-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" /> Inaccurate / High Cost
                    </button>
                  </div>

                  <div>
                    <textarea
                      placeholder="Comment on cost model adjustments or transport routing alternatives..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-sans font-medium transition-all"
                  >
                    Submit Evaluation Response
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
