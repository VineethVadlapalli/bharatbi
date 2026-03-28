import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// Types
export interface Connection {
  id: string;
  name: string;
  conn_type: string;
  host?: string;
  port?: number;
  database_name?: string;
  status: string;
  last_synced_at?: string;
  created_at: string;
}

export interface QueryResponse {
  query_id: string;
  question: string;
  sql: string;
  explanation: string;
  columns: string[];
  rows: any[][];
  row_count: number;
  chart: { chart_type: string; echarts_option?: any } | null;
  summary: string;
  suggested_questions: string[];
  duration_ms: number;
  llm_provider: string;
}

export interface SchemaTable {
  table_name: string;
  columns: { column_name: string; data_type: string; description: string; is_primary_key: boolean }[];
}

// Connections
export const testConnection = (data: any) => api.post("/api/connections/test", data);
export const createConnection = (data: any) => api.post<Connection>("/api/connections", data);
export const listConnections = () => api.get<Connection[]>("/api/connections");
export const syncConnection = (id: string) => api.post(`/api/connections/${id}/sync`);
export const getConnection = (id: string) => api.get<Connection>(`/api/connections/${id}`);

// Query
export const runQuery = (data: { question: string; connection_id: string; llm_provider?: string }) =>
  api.post<QueryResponse>("/api/query", { llm_provider: "openai", ...data });
export const listQueries = (limit?: number) => api.get(`/api/queries?limit=${limit || 20}`);

// Schema
export const getSchema = (connectionId: string) => api.get<SchemaTable[]>(`/api/schema/${connectionId}`);

// Tally
export const uploadTally = (file: File, name: string) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("name", name);
  return api.post("/api/tally/upload", fd);
};

// Sheets
export const uploadCSV = (file: File, name: string, sheetName?: string) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("name", name);
  fd.append("sheet_name", sheetName || "sheet1");
  return api.post("/api/sheets/upload-csv", fd);
};

export default api;