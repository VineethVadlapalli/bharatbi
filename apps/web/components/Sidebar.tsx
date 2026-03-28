"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Database, LayoutDashboard, History, Settings, Zap, Table2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

const NAV = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/connections", label: "Connections", icon: Database },
  { href: "/schema", label: "Schema", icon: Table2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useAppStore();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col border-r transition-all duration-200 z-30 ${
        sidebarOpen ? "w-56" : "w-16"
      }`}
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
            BharatBI
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-saffron-500"
                  : "hover:bg-[var(--bg-hover)]"
              }`}
              style={{
                background: active ? "var(--accent-soft)" : undefined,
                color: active ? undefined : "var(--text-secondary)",
              }}
            >
              <Icon size={18} />
              {sidebarOpen && label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        {sidebarOpen && (
          <div className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
            Made in India 🇮🇳
          </div>
        )}
      </div>
    </aside>
  );
}
