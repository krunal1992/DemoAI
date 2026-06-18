import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { Send, RefreshCw, Bot, User, Cpu, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ChatPanelProps {
  activeDc?: string;
  activeProductId?: string;
  activeScenarioId?: string;
}

export default function ChatPanel({
  activeDc = "DC-East",
  activeProductId = "PROD-MILK",
  activeScenarioId = "ANOMALY-01"
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize helper welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: "msg-welcome",
        sender: "agent",
        text: `Hello! I am your **CPG Auto-Pilot Cognitive Q&A Assistant**. I am linked with dynamic context indexes and our semantic Vector Database (RAG).

How can I help you troubleshoot? Here are some sample questions:
* *Why is our organic milk stock in DC-East experiencing a crisis?*
* *What is the root cause of the wheat bread leakage at DC-West?*
* *When will our packaging supplies delays in DC-Central resolve?*
* *How can we reorder chips during active EDI timeouts?*

I'll search database records, isolate relevant traces, and present actionable solutions.`,
        timestamp: new Date().toISOString(),
        thoughts: "RAG Engine: Indexes initialized and warm. Ready for semantic context evaluation."
      }
    ]);
  }, []);

  // Scroll to bottom of message logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          activeScenarioId,
          dcName: activeDc,
          prodId: activeProductId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat crashed");

      setMessages((prev) => [...prev, {
        id: data.id || `msg-agent-${Date.now()}`,
        sender: "agent",
        text: data.text,
        timestamp: data.timestamp || new Date().toISOString(),
        thoughts: data.thoughts
      }]);
    } catch (err: any) {
      toast.error("Failed to compile conversational answer.");
      setMessages((prev) => [...prev, {
        id: `msg-err-${Date.now()}`,
        sender: "agent",
        text: "🚨 **Service Error:** I was unable to connect to the LLM Gateway. Please check your network or try updating your parameters.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Header info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs">CPG Cognitive Intelligence</h3>
            <p className="font-mono text-[9px] text-slate-400">RAG Context: {activeDc} • {activeProductId}</p>
          </div>
        </div>
        <span className="font-mono text-[9px] text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
          ONLINE
        </span>
      </div>

      {/* Scrolling logs */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin select-text">
        {messages.map((m) => {
          const isAgent = m.sender === "agent";
          return (
            <div key={m.id} className={`flex gap-3 max-w-3xl ${isAgent ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              {/* Profile avatar */}
              <div className={`p-2 h-9 w-9 rounded-xl shrink-0 flex items-center justify-center ${
                isAgent 
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-500" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}>
                {isAgent ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Text blob */}
              <div className="space-y-1.5 flex-1">
                {/* Thoughts/CoT Accordion if present */}
                {isAgent && m.thoughts && (
                  <div className="mb-2 p-3 rounded-lg bg-orange-50/40 dark:bg-amber-950/10 border border-orange-100/40 dark:border-amber-900/10 text-[10px] font-mono text-orange-850 dark:text-amber-400">
                    <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider mb-1">
                      <Cpu className="w-3 h-3 text-orange-500" /> AI Thought Evaluation
                    </div>
                    {m.thoughts}
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-wrap ${
                  isAgent
                    ? "bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-850"
                    : "bg-blue-600 text-white rounded-br-none"
                }`}>
                  {m.text}
                </div>
                <div className={`font-mono text-[9px] text-slate-400 ${isAgent ? "text-left" : "text-right"}`}>
                  {m.timestamp.slice(11, 16)}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="p-2 h-9 w-9 rounded-xl shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-500">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs font-mono flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Evaluating semantic nodes...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input container */}
      <form onSubmit={handleSend} className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask a question about warehouse safety stocks, forecast patterns..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all self-center shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
