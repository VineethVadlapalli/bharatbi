"use client";
import { useState } from "react";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Pin your favourite queries as live dashboard cards</p>
            </div>
          </div>

          {/* Placeholder — will be built when pinning is wired */}
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <LayoutDashboard size={40} className="mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>No pinned queries yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Go to Chat → ask a question → click "Pin to Dashboard" to add it here
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}