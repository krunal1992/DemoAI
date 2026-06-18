import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import StockMonitor from "./components/StockMonitor";
import LogViewer from "./components/LogViewer";
import AgentControl from "./components/AgentControl";
import ChatPanel from "./components/ChatPanel";
import { 
  BarChart2, Sun, Moon, LogOut, Database, Cpu, History, MessageSquare, 
  HelpCircle, Sparkles, RefreshCw, Layers
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import { DistributionCenterInfo } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; username: string; name: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  // Dynamic warehouse status data
  const [inventory, setInventory] = useState<DistributionCenterInfo[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Core navigation state
  const [activeTab, setActiveTab] = useState<"inventory" | "analyze" | "logs" | "chat">("inventory");

  // Selection state bridging log inspections or stock alerts directly into analysis triggers
  const [selectedDc, setSelectedDc] = useState("DC-East");
  const [selectedProductId, setSelectedProductId] = useState("PROD-MILK");
  const [selectedScenarioId, setSelectedScenarioId] = useState("ANOMALY-01");

  // Theme Management
  const [darkMode, setDarkMode] = useState(false);

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const response = await fetch("/api/data/inventory");
      if (!response.ok) throw new Error("Inventory database offline");
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch live stock level summaries");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Load persistence states safely (SSR safe hydration)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedTheme = localStorage.getItem("theme");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    // Default to dark theme for safe eyebass observability, toggleable
    const isDark = savedTheme === "dark" || !savedTheme;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setHydrated(true);
  }, []);

  // Sync database state as soon as authorization goes green
  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token]);

  // Save/purge token helper
  const handleLoginSuccess = (newToken: string, newUser: { email: string; username: string; name: string }) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success(`Authorized: Welcome back ${newUser.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast.success("Security token revoked successfully. Logged out.");
  };

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Cross-component activation pipeline triggers
  const handleSelectProduct = (dc: string, productId: string) => {
    setSelectedDc(dc);
    setSelectedProductId(productId);
    
    // Choose appropriate default scenario based on common IDs
    let matchedScenario = "ANOMALY-01";
    if (productId === "PROD-BREAD") matchedScenario = "ANOMALY-02";
    if (productId === "PROD-JUICE") matchedScenario = "ANOMALY-03";
    if (productId === "PROD-TOMATO") matchedScenario = "ANOMALY-04";
    if (productId === "PROD-CHIPS") matchedScenario = "ANOMALY-05";
    if (productId === "PROD-SUGAR") matchedScenario = "ANOMALY-06";
    if (productId === "PROD-PEANUT") matchedScenario = "ANOMALY-07";
    if (productId === "PROD-COOKI" && dc === "DC-South") matchedScenario = "ANOMALY-08";
    if (productId === "PROD-COOKI" && dc === "DC-East") matchedScenario = "ANOMALY-09";
    if (productId === "PROD-PASTA") matchedScenario = "ANOMALY-10";

    setSelectedScenarioId(matchedScenario);
    setActiveTab("analyze");
    toast(`Routing telemetry for ${productId} at ${dc}...`);
  };

  const handleSelectScenario = (dc: string, productId: string, scenarioId: string) => {
    setSelectedDc(dc);
    setSelectedProductId(productId);
    setSelectedScenarioId(scenarioId);
    setActiveTab("analyze");
    toast(`Auto-pilot configured for ${scenarioId}!`);
  };

  const handleAuditSuccess = () => {
    // Inventory reports were successfully triggered; reload stock dashboard
    fetchInventory();
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          Mounting Supply-Chain Cryptography...
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toaster position="top-right" />
      
      {/* Enterprise Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Branding logo */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/10">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-sans font-extrabold tracking-tight text-slate-900 dark:text-white text-sm">
                  CPG Auto-Pilot
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-500 text-[9px] font-mono font-bold uppercase tracking-wide">
                  Intelligence Suite
                </span>
              </div>
            </div>

            {/* Menu Options Tabs */}
            <div className="hidden md:flex gap-1">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  activeTab === "inventory"
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Database className="w-4 h-4" /> Stock Status
              </button>
              <button
                onClick={() => setActiveTab("analyze")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  activeTab === "analyze"
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Cpu className="w-4 h-4" /> Replenishment Optimizer
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  activeTab === "logs"
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <History className="w-4 h-4" /> Logs &amp; Alert Traces
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  activeTab === "chat"
                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Cognitive Troubleshooting
              </button>
            </div>

            {/* Right side user elements & toggles */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-850"
                title="Toggle UI Color Mode"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-right hidden sm:block">
                <div className="text-xs font-sans font-semibold text-slate-900 dark:text-white">
                  {user?.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 transition-all active:scale-95 flex items-center justify-center"
                title="Revoke Token &amp; Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Tab bar helper */}
      <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex overflow-x-auto justify-around py-2 shrink-0">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${activeTab === "inventory" ? "text-blue-500 font-bold" : "text-slate-400"}`}
        >
          <Database className="w-4 h-4" /> Stock Status
        </button>
        <button
          onClick={() => setActiveTab("analyze")}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${activeTab === "analyze" ? "text-blue-500 font-bold" : "text-slate-400"}`}
        >
          <Cpu className="w-4 h-4" /> Optimizer
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${activeTab === "logs" ? "text-blue-500 font-bold" : "text-slate-400"}`}
        >
          <History className="w-4 h-4" /> Traces
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${activeTab === "chat" ? "text-blue-500 font-bold" : "text-slate-400"}`}
        >
          <MessageSquare className="w-4 h-4" /> Advisor
        </button>
      </div>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === "inventory" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white">
                Supply Chain Distribution Stock Status
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Monitor live safety stock reserves, burn levels, and runout projections across core distribution points.
              </p>
            </div>
            
            <StockMonitor 
              data={inventory} 
              loading={inventoryLoading} 
              onSelectProduct={handleSelectProduct} 
            />
          </div>
        )}

        {activeTab === "analyze" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white">
                Multi-Agent Replenishment &amp; Demand Optimizer
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Trigger our parallelized multi-agent diagnostic sequence to compute safety stock shortfalls and generate restocking suggestions automatically.
              </p>
            </div>

            <AgentControl 
              preselectedDc={selectedDc}
              preselectedProductId={selectedProductId}
              preselectedScenarioId={selectedScenarioId}
              onAnalysisSuccess={handleAuditSuccess}
            />
          </div>
        )}

        {activeTab === "logs" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white">
                Supply Chain Transaction Logs
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Query raw physical telemetry, transit checkpoints, cold chain markers and systemic order transaction records.
              </p>
            </div>

            <LogViewer onSelectScenario={handleSelectScenario} />
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white">
                Cognitive Troubleshooting Advisor (RAG)
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Consult our RAG-enhanced AI agent. Injects live vector matches dynamically to clarify warehouse bottlenecks or supplier deadlocks.
              </p>
            </div>

            <ChatPanel 
              activeDc={selectedDc}
              activeProductId={selectedProductId}
              activeScenarioId={selectedScenarioId}
            />
          </div>
        )}
      </main>

      {/* Footer credits and environment guidelines */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950/20 text-center text-xs text-slate-400 font-mono shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p>CPG Observability Platform • Licensed under Apache 2.0</p>
          <p className="text-[10px] text-slate-500">
            Powered by Gemini Core 3.5 AI Gateway models • Local RAG Vectors online
          </p>
        </div>
      </footer>
    </div>
  );
}
