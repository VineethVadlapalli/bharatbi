"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, BarChart3, TrendingUp, PieChart, Table2, Trash2, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { listPinned, unpinQuery, runQuery } from "@/lib/api";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const CHART_ICONS: Record<string, any> = {
  bar: BarChart3, line: TrendingUp, pie: PieChart, horizontal_bar: BarChart3, grouped_bar: BarChart3, table: Table2,
};

export default function DashboardPage() {
  const [pins, setPins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [refreshedData, setRefreshedData] = useState<Record<string, any>>({});
  const router = useRouter();

  const load = () => listPinned().then((r) => setPins(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUnpin = async (queryId: string) => {
    try { await unpinQuery(queryId); toast.success("Unpinned"); load(); } catch { toast.error("Failed to unpin"); }
  };

  const handleRefresh = async (pin: any) => {
    setRefreshing(pin.query_id);
    try {
      const res = await runQuery({ question: pin.question, connection_id: pin.connection_id, llm_provider: pin.llm_provider || "openai" });
      setRefreshedData((prev) => ({ ...prev, [pin.query_id]: res.data }));
      toast.success("Refreshed!");
    } catch { toast.error("Refresh failed"); }
    setRefreshing(null);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{pins.length > 0 ? `${pins.length} pinned queries` : "Pin queries from Chat to build your dashboard"}</p>
            </div>
          </div>

          {pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <LayoutDashboard size={40} className="mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>No pinned queries yet</p>
              <button onClick={() => router.push("/chat")} className="text-xs text-saffron-500 hover:underline mt-2">Go to Chat → ask a question → Pin to Dashboard</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pins.map((pin) => {
                const data = refreshedData[pin.query_id];
                const ChartIcon = CHART_ICONS[pin.chart_type] || Table2;
                return (
                  <div key={pin.pin_id} className="rounded-xl border p-5 fade-in" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ChartIcon size={16} style={{ color: "var(--accent)" }} />
                        <h3 className="text-sm font-medium line-clamp-1" style={{ color: "var(--text-primary)" }}>{pin.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRefresh(pin)} disabled={refreshing === pin.query_id} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]">
                          {refreshing === pin.query_id ? <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} /> : <RefreshCw size={12} style={{ color: "var(--text-muted)" }} />}
                        </button>
                        <button onClick={() => handleUnpin(pin.query_id)} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]">
                          <Trash2 size={12} style={{ color: "var(--text-muted)" }} />
                        </button>
                      </div>
                    </div>
                    {data?.chart?.echarts_option && data.chart.chart_type !== "table" && (
                      <div className="mb-3 -mx-1"><ReactECharts option={{ ...data.chart.echarts_option, backgroundColor: "transparent" }} style={{ height: 180 }} /></div>
                    )}
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{data?.summary || pin.summary || "Click refresh to load latest data"}</p>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <span>{pin.result_row_count} rows</span>
                      <span>{pin.duration_ms}ms</span>
                      <span className="px-1.5 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{pin.llm_provider}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
