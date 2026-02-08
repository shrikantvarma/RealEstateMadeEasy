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
    <aside className="w-[260px] bg-sidebar-background flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="rounded-xl bg-gold/15 p-2">
          <Home className="h-4 w-4 text-gold" />
        </div>
        <div>
          <span className="font-serif text-[17px] text-gradient-gold block leading-none">
            REME
          </span>
          <span className="text-[10px] text-sidebar-foreground/40 leading-none mt-1 block tracking-wider uppercase">
            Agent Dashboard
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-sidebar-border" />

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
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-full"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </AnimatePresence>
              <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-gold" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"}`} />
              {item.label}
            </Link>
          );
        })}

        {/* Quick action */}
        <Link
          to="/dashboard/new"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-gold hover:bg-sidebar-accent/60 transition-all duration-200 mt-2"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-sidebar-foreground/40">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
