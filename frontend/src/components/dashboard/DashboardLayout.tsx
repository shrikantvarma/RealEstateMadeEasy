import { Link, useMatches } from "@tanstack/react-router";
import { MessageSquare, Home } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname ?? "";

  return (
    <div className="min-h-screen flex bg-surface-1">
      <Sidebar currentPath={currentPath} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function Sidebar({ currentPath }: { currentPath: string }) {
  const isActive = currentPath.startsWith("/dashboard");

  return (
    <aside className="w-64 bg-sidebar-background backdrop-blur-sm border-r border-border/30 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="rounded-lg p-1.5" style={{ background: "var(--gradient-hero)" }}>
          <Home className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight">REME</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative ${
            isActive
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          }`}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-full" />
          )}
          <MessageSquare className="h-4 w-4" />
          Sessions
        </Link>
      </nav>

      {/* Version */}
      <div className="px-4 py-3">
        <span className="text-[10px] text-muted-foreground/50">v0.1.0</span>
      </div>
    </aside>
  );
}
