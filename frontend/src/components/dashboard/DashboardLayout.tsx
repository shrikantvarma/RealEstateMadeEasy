import { Link, useMatches } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Plus, LayoutDashboard } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname ?? "";

  return (
    <div className="min-h-screen flex bg-surface-1">
      <Sidebar currentPath={currentPath} />
      <main className="flex-1 overflow-auto">
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

const navItems = [
  { to: "/dashboard" as const, icon: LayoutDashboard, label: "Sessions" },
];

function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="w-[260px] bg-sidebar-background/80 backdrop-blur-xl border-r border-border/20 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div
          className="rounded-xl p-2 shadow-elevation-1"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Home className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight block leading-none">
            REME
          </span>
          <span className="text-[10px] text-muted-foreground/60 leading-none mt-0.5 block">
            Agent Dashboard
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border/30" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-surface-3/80 hover:text-foreground"
              }`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-full"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </AnimatePresence>
              <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.label}
            </Link>
          );
        })}

        {/* Quick action */}
        <Link
          to="/dashboard/new"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-3/80 transition-all duration-200 mt-2"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-muted-foreground/60">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
