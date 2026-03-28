"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChevronDown, ChevronUp, Copy, Check, Download, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { runQuery, listConnections, type QueryResponse, type Connection } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Message {
  id: string;
  type: "user" | "ai";
  question?: string;
  response?: QueryResponse;
  error?: string;
  loading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const { activeConnectionId, setActiveConnection, llmProvider } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listConnections().then((r) => {
      const ready = r.data.filter((c: Connection) => c.status === "ready");
      setConnections(ready);
      if (ready.length > 0 && !activeConnectionId) setActiveConnection(ready[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const q = input.trim();
    if (!q || loading) return;
    if (!activeConnectionId) { toast.error("Select a data connection first"); return; }

    const userMsg: Message = { id: Date.now().toString(), type: "user", question: q };
    const aiMsg: Message = { id: (Date.now() + 1).toString(), type: "ai", loading: true };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await runQuery({ question: q, connection_id: activeConnectionId, llm_provider: llmProvider });
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsg.id ? { ...m, loading: false, response: res.data } : m))
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Something went wrong";
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsg.id ? { ...m, loading: false, error: errMsg } : m))
      );
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleSuggestion = (q: string) => { setInput(q); inputRef.current?.focus(); };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 flex flex-col h-screen">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b shrink-0" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <h1 className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Ask your data</h1>
          <div className="flex items-center gap-3">
            <select
              value={activeConnectionId || ""}
              onChange={(e) => setActiveConnection(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border bg-transparent cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {connections.length === 0 && <option value="">No connections</option>}
              {connections.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "var(--bg-card)" }}>{c.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && <EmptyState onSuggestion={handleSuggestion} />}
          {messages.map((m) =>
            m.type === "user" ? (
              <UserMessage key={m.id} question={m.question || ""} />
            ) : (
              <AIMessage key={m.id} msg={m} onSuggestion={handleSuggestion} />
            )
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 pb-5 pt-2">
          <div className="relative max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Ask a question about your data..."
              rows={1}
              className="w-full resize-none rounded-xl px-5 py-3.5 pr-14 text-sm border focus:outline-none focus:ring-2 focus:ring-saffron-500/40 transition-shadow"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-saffron-500 text-white disabled:opacity-30 hover:bg-saffron-600 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  const suggestions = [
    "Top 5 customers by revenue",
    "Monthly revenue trend this financial year",
    "Which payment mode is most popular?",
    "Total GST collected this FY",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center mb-5 shadow-lg shadow-saffron-500/20">
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="font-display text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Ask BharatBI anything</h2>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Type a question in plain English — no SQL needed</p>
      <div className="grid grid-cols-2 gap-2.5 max-w-lg">
        {suggestions.map((s) => (
          <button key={s} onClick={() => onSuggestion(s)} className="text-left text-xs px-4 py-3 rounded-lg border transition-colors hover:border-saffron-500/40" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ question }: { question: string }) {
  return (
    <div className="flex justify-end fade-in">
      <div className="max-w-lg px-4 py-2.5 rounded-2xl rounded-br-md text-sm" style={{ background: "var(--accent-soft)", color: "var(--text-primary)" }}>
        {question}
      </div>
    </div>
  );
}

function AIMessage({ msg, onSuggestion }: { msg: Message; onSuggestion: (q: string) => void }) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (msg.loading) {
    return (
      <div className="fade-in space-y-3 max-w-2xl">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          <span className="ml-2">Thinking...</span>
        </div>
      </div>
    );
  }

  if (msg.error) {
    return (
      <div className="fade-in max-w-2xl px-4 py-3 rounded-xl border text-sm" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
        {msg.error}
      </div>
    );
  }

  const r = msg.response!;
  const copySQL = () => { navigator.clipboard.writeText(r.sql); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const downloadCSV = () => {
    const header = r.columns.join(",");
    const rows = r.rows.map((row) => row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "bharatbi_export.csv"; a.click();
  };

  return (
    <div className="fade-in space-y-4 max-w-3xl">
      {/* Summary */}
      {r.summary && (
        <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{r.summary}</div>
      )}

      {/* Chart */}
      {r.chart && r.chart.echarts_option && r.chart.chart_type !== "table" && (
        <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <ReactECharts option={{ ...r.chart.echarts_option, backgroundColor: "transparent" }} style={{ height: 280 }} />
        </div>
      )}

      {/* Data Table */}
      {r.rows.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{r.row_count} rows · {r.duration_ms}ms</span>
            <button onClick={downloadCSV} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-secondary)" }}>
              <Download size={12} /> CSV
            </button>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {r.columns.map((c) => (
                    <th key={c} className="text-left px-4 py-2 font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                    {row.map((cell: any, j: number) => (
                      <td key={j} className="px-4 py-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL Block (collapsible) */}
      <div className="rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => setSqlOpen(!sqlOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          <span>SQL</span>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); copySQL(); }} className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors">
              {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} />}
            </button>
            {sqlOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>
        {sqlOpen && (
          <div className="px-4 pb-3">
            <pre className="sql-block text-xs overflow-x-auto">{r.sql}</pre>
          </div>
        )}
      </div>

      {/* Follow-up suggestions */}
      {r.suggested_questions?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.suggested_questions.map((q) => (
            <button key={q} onClick={() => onSuggestion(q)} className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-saffron-500/40" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}