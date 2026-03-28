"use client";
import { useState, useEffect } from "react";
import { History, Clock, BarChart3 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { listQueries } from "@/lib/api";

export default function HistoryPage() {
  const [queries, setQueries] = useState<any[]>([]);

  useEffect(() => {
    listQueries(50).then((r) => setQueries(r.data)).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="font-display text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Query History</h1>

          {queries.length === 0 ? (
            <div className="flex flex-col items-center py-20 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <History size={32} className="mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No queries yet. Go to Chat and ask something!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queries.map((q: any) => (
                <div key={q.id} className="p-4 rounded-xl border transition-colors hover:border-saffron-500/20" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q.question}</p>
                      {q.summary && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{q.summary}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {q.chart_type && <BarChart3 size={14} style={{ color: "var(--text-muted)" }} />}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{q.duration_ms}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{q.llm_provider}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{q.result_row_count} rows</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} /> {new Date(q.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}