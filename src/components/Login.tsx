import React, { useState } from "react";
import { Shield, Key, Mail, RefreshCw, BarChart2 } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, user: { email: string; username: string; name: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [identifier, setIdentifier] = useState("dev@example.ai");
  const [password, setPassword] = useState("developer123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.includes("@") ? identifier : undefined,
          username: !identifier.includes("@") ? identifier : undefined,
          password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Safe hydration in parent
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to establish connection to authorization service.");
    } finally {
      setLoading(false);
    }
  };

  const autofill = () => {
    setIdentifier("dev@example.ai");
    setPassword("developer123");
    setError("");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Visual branding column */}
      <div className="hidden lg:flex lg:col-span-7 bg-slate-900 justify-between flex-col p-12 relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-950 z-0" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <BarChart2 className="w-6 h-6" />
          </div>
          <span className="font-sans font-bold tracking-tight text-white text-lg">CPG Auto-Pilot</span>
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
            <Shield className="w-3.5 h-3.5" /> Ready for Production
          </div>
          <h1 className="text-4xl xl:text-5xl font-sans font-medium tracking-tight text-white mb-6 leading-tight">
            Multi-Agent Supply Observability &amp; Inventory Optimizer
          </h1>
          <p className="text-slate-400 font-sans leading-relaxed text-sm mb-8">
            An advanced cognitive agent layers framework utilizing Gemini models. Monitor continuous supply chain logs, isolate overstock anomalies, generate predictive demand curves, and automate reorder schedules instantly.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left font-mono">
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
              <div className="text-slate-500 text-xs mb-1">RAG PIPELINE</div>
              <div className="text-slate-300 text-xs font-semibold">In-Memory Semantic Embeddings</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
              <div className="text-slate-500 text-xs mb-1">ORCHESTRAL AGENTS</div>
              <div className="text-slate-300 text-xs font-semibold">5 CoT Decoupled Services</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono">
          CPG Observability Platform v2.4.0 • Gemini 3.5 Core
        </div>
      </div>

      {/* Login Form Column */}
      <div className="flex lg:col-span-5 items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Operator Sign-In
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials to access the active telemetry streams.
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Operator ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                  placeholder="e.g. dev@example.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-sans font-medium text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Security Ledger...
                </>
              ) : (
                "Authorize Protocol Access"
              )}
            </button>
          </form>

          {/* Golden Credentials Card */}
          <div className="mt-8 p-5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
            <h4 className="text-xs font-mono text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              💡 Demonstration Credentials
            </h4>
            <div className="space-y-1.5 font-mono text-xs text-amber-700/80 dark:text-amber-400/80">
              <div className="flex justify-between">
                <span>Operator Identifier:</span>
                <span className="font-bold select-all">dev@example.ai</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol Password:</span>
                <span className="font-bold select-all">developer123</span>
              </div>
            </div>
            <button
              onClick={autofill}
              className="mt-3.5 w-full py-1.5 px-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 rounded-lg text-xs font-mono transition-all border border-amber-200 dark:border-amber-900/60"
            >
              Autofill Security protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
