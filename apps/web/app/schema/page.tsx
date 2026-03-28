"use client";
import { useState, useEffect } from "react";
import { Table2, ChevronRight, ChevronDown, Key, Link2, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { listConnections, getSchema, type Connection, type SchemaTable } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function SchemaPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<string>("");
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { activeConnectionId } = useAppStore();

  useEffect(() => {
    listConnections().then((r) => {
      const ready = r.data.filter((c: Connection) => c.status === "ready");
      setConnections(ready);
      const initial = activeConnectionId || (ready[0]?.id ?? "");
      if (initial) { setSelectedConn(initial); loadSchema(initial); }
    }).catch(() => {});
  }, []);

  const loadSchema = (connId: string) => {
    if (!connId) return;
    getSchema(connId).then((r) => setTables(r.data)).catch(() => setTables([]));
  };

  const handleConnChange = (id: string) => {
    setSelectedConn(id);
    loadSchema(id);
    setExpandedTable(null);
  };

  const filtered = tables.filter((t) =>
    t.table_name.toLowerCase().includes(search.toLowerCase()) ||
    t.columns.some((c) => c.column_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Schema Explorer</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Browse your tables, columns, and semantic descriptions</p>
            </div>
            <select
              value={selectedConn}
              onChange={(e) => handleConnChange(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border bg-transparent"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "var(--bg-card)" }}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables or columns..."
              className="w-full text-sm pl-9 pr-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-saffron-500/40"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Tables */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <Table2 size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tables.length === 0 ? "No schema found. Sync a connection first." : "No matching tables or columns."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((table) => {
                const expanded = expandedTable === table.table_name;
                return (
                  <div key={table.table_name} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                    <button
                      onClick={() => setExpandedTable(expanded ? null : table.table_name)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      {expanded ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                      <Table2 size={16} style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-medium font-mono" style={{ color: "var(--text-primary)" }}>{table.table_name}</span>
                      <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{table.columns.length} columns</span>
                    </button>

                    {expanded && (
                      <div className="border-t" style={{ borderColor: "var(--border)" }}>
                        {table.columns.map((col) => (
                          <div key={col.column_name} className="flex items-center gap-3 px-4 py-2.5 text-xs border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                            <div className="w-5 flex justify-center">
                              {col.is_primary_key && <Key size={12} className="text-saffron-400" />}
                              {col.column_name.includes("_id") && !col.is_primary_key && <Link2 size={12} style={{ color: "var(--text-muted)" }} />}
                            </div>
                            <span className="font-mono font-medium w-40 shrink-0" style={{ color: "var(--text-primary)" }}>{col.column_name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>{col.data_type}</span>
                            <span className="flex-1 truncate" style={{ color: "var(--text-muted)" }}>{col.description || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
