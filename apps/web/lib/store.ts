import { create } from "zustand";

interface AppState {
  activeConnectionId: string | null;
  setActiveConnection: (id: string | null) => void;
  llmProvider: "openai" | "anthropic";
  setLLMProvider: (p: "openai" | "anthropic") => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeConnectionId: null,
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  llmProvider: "openai",
  setLLMProvider: (p) => set({ llmProvider: p }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// Indian number formatting
export function formatINR(n: number): string {
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}