"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Database, LayoutDashboard, History, Table2, Zap, CalendarClock, Bell, Users } from "lucide-react";
import { useAppStore } from "@/lib/store";

const NAV = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/connections", label: "Connections", icon: Database },
  { href: "/schema", label: "Schema", icon: Table2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { section: "Automate" },
  { href: "/reports", label: "Reports", icon: CalendarClock },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { section: "Settings" },
  { href: "/teams", label: "Team", icon: Users },
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <Zap size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-sans font-bold text-[15px] tracking-tight" style={{ color: "var(--text-primary)" }}>
            BharatBI
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          if ("section" in item) {
            return sidebarOpen ? (
              <div key={i} className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-5 pb-1" style={{ color: "var(--text-dim)" }}>
                {item.section}
              </div>
            ) : <div key={i} className="h-px mx-3 my-3" style={{ background: "var(--border)" }} />;
          }

          const { href, label, icon: Icon } = item;
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors`}
              style={{
                background: active ? "var(--accent-soft)" : undefined,
                color: active ? "var(--accent)" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={17} />
              {sidebarOpen && label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        {sidebarOpen && (
          <div className="text-[10px] px-2" style={{ color: "var(--text-dim)" }}>
            Made in India 🇮🇳
          </div>
        )}
      </div>
    </aside>
  );
}
