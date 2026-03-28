"use client";
import { useState, useEffect } from "react";
import { Database, Plus, RefreshCw, CheckCircle, XCircle, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { listConnections, createConnection, testConnection, syncConnection, uploadTally, uploadCSV, type Connection } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type Tab = "sql" | "tally" | "csv";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tab, setTab] = useState<Tab>("sql");
  const [showForm, setShowForm] = useState(false);
  const { setActiveConnection } = useAppStore();

  const refresh = () => listConnections().then((r) => setConnections(r.data)).catch(() => {});
  useEffect(() => { refresh(); }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Data Connections</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Connect your database, Tally export, or Google Sheets CSV</p>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-500 text-white text-sm font-medium hover:bg-saffron-600 transition-colors">
              <Plus size={16} /> Add Connection
            </button>
          </div>

          {/* Connection List */}
          <div className="space-y-3 mb-8">
            {connections.map((c) => (
              <ConnectionCard key={c.id} conn={c} onSync={refresh} onSelect={() => { setActiveConnection(c.id); toast.success(`Switched to ${c.name}`); }} />
            ))}
            {connections.length === 0 && !showForm && (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <Database size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No connections yet. Add one to start asking questions.</p>
              </div>
            )}
          </div>

          {/* Add Connection Form */}
          {showForm && (
            <div className="rounded-xl border p-6 fade-in" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                {(["sql", "tally", "csv"] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${tab === t ? "bg-saffron-500 text-white" : ""}`} style={tab !== t ? { color: "var(--text-secondary)" } : {}}>
                    {t === "sql" ? "PostgreSQL / MySQL" : t === "tally" ? "Tally Import" : "CSV / Sheets"}
                  </button>
                ))}
              </div>
              {tab === "sql" && <SQLForm onDone={() => { setShowForm(false); refresh(); }} />}
              {tab === "tally" && <TallyForm onDone={() => { setShowForm(false); refresh(); }} />}
              {tab === "csv" && <CSVForm onDone={() => { setShowForm(false); refresh(); }} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ConnectionCard({ conn, onSync, onSelect }: { conn: Connection; onSync: () => void; onSelect: () => void }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncConnection(conn.id);
      toast.success("Sync complete!");
      onSync();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Sync failed");
    }
    setSyncing(false);
  };

  const statusColor = conn.status === "ready" ? "text-teal-400" : conn.status === "error" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border transition-colors hover:border-saffron-500/30" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
          <Database size={18} style={{ color: "var(--text-muted)" }} />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{conn.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {conn.conn_type} · <span className={statusColor}>{conn.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {conn.status === "ready" && (
          <button onClick={onSelect} className="text-xs px-3 py-1.5 rounded-md border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Use
          </button>
        )}
        <button onClick={handleSync} disabled={syncing} className="text-xs px-3 py-1.5 rounded-md border flex items-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sync
        </button>
      </div>
    </div>
  );
}

function SQLForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", conn_type: "postgresql", host: "", port: "5432", database_name: "", username: "", password: "" });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await testConnection({ ...form, port: parseInt(form.port) });
      setTestResult(res.data?.ok ?? res.data?.[0] ?? false);
      toast.success("Connection successful!");
    } catch { setTestResult(false); toast.error("Connection failed"); }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createConnection({ ...form, port: parseInt(form.port) });
      toast.success("Connection saved!");
      onDone();
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Failed to save"); }
    setSaving(false);
  };

  const F = ({ label, field, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type={type} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder}
        className="w-full text-sm px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-saffron-500/40" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <F label="Connection Name" field="name" placeholder="My Database" />
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Type</label>
          <select value={form.conn_type} onChange={(e) => setForm({ ...form, conn_type: e.target.value })} className="w-full text-sm px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <option value="postgresql" style={{ background: "var(--bg-card)" }}>PostgreSQL</option>
            <option value="mysql" style={{ background: "var(--bg-card)" }}>MySQL</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2"><F label="Host" field="host" placeholder="localhost or IP" /></div>
        <F label="Port" field="port" placeholder="5432" />
      </div>
      <F label="Database Name" field="database_name" placeholder="my_database" />
      <div className="grid grid-cols-2 gap-4">
        <F label="Username" field="username" placeholder="postgres" />
        <F label="Password" field="password" type="password" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleTest} disabled={testing} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          {testing ? <Loader2 size={14} className="animate-spin" /> : testResult === true ? <CheckCircle size={14} className="text-teal-400" /> : testResult === false ? <XCircle size={14} className="text-red-400" /> : null}
          Test
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-500 text-white text-sm font-medium hover:bg-saffron-600">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save & Sync
        </button>
      </div>
    </div>
  );
}

function TallyForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadTally(file, name || file.name);
      toast.success("Tally data imported!");
      onDone();
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Upload failed"); }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Export from TallyPrime: press <span className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--bg-secondary)" }}>Alt+E</span> → choose XML (Data Interchange) or Excel format → upload here.
      </p>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Company Tally"
          className="w-full text-sm px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-saffron-500/40" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
      </div>
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-saffron-500/40"
        style={{ borderColor: "var(--border)" }}
        onClick={() => document.getElementById("tally-file")?.click()}
      >
        <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: file ? "var(--text-primary)" : "var(--text-muted)" }}>
          {file ? file.name : "Click to upload .xml or .xlsx from Tally"}
        </p>
        <input id="tally-file" type="file" accept=".xml,.xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      <button onClick={handleUpload} disabled={!file || uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-500 text-white text-sm font-medium hover:bg-saffron-600 disabled:opacity-40">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import Tally Data
      </button>
    </div>
  );
}

function CSVForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadCSV(file, name || file.name);
      toast.success("CSV data imported!");
      onDone();
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Upload failed"); }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Export your Google Sheet as CSV: <span className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--bg-secondary)" }}>File → Download → CSV</span> → upload here.
      </p>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Data Sheet"
          className="w-full text-sm px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-saffron-500/40" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }} />
      </div>
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-saffron-500/40"
        style={{ borderColor: "var(--border)" }}
        onClick={() => document.getElementById("csv-file")?.click()}
      >
        <FileSpreadsheet size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: file ? "var(--text-primary)" : "var(--text-muted)" }}>
          {file ? file.name : "Click to upload .csv file"}
        </p>
        <input id="csv-file" type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      <button onClick={handleUpload} disabled={!file || uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-500 text-white text-sm font-medium hover:bg-saffron-600 disabled:opacity-40">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import CSV
      </button>
    </div>
  );
}