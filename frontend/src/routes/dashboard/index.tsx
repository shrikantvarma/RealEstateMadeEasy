import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { SessionCard } from "@/components/dashboard/SessionCard";

export const Route = createFileRoute("/dashboard/")({
  component: SessionListPage,
});

function SessionListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await api.sessions.list();
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
  });

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data && data.length > 0
              ? `${data.length} buyer ${data.length === 1 ? "session" : "sessions"}`
              : "Manage your buyer conversations"}
          </p>
        </div>
        <Link to="/dashboard/new">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200 gap-2">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-2xl skeleton-shimmer"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
        >
          {data.map((session) => (
            <motion.div
              key={session.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
              }}
            >
              <SessionCard session={session} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-8">
        <div
          className="rounded-3xl p-5 shadow-elevation-2"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Home className="h-10 w-10 text-white" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 rounded-full bg-surface-2 p-1 shadow-elevation-1"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4 text-accent" />
        </motion.div>
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">
        Ready to understand your buyers?
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Upload a conversation transcript and let AI extract preferences,
        priorities, and deal-breakers automatically.
      </p>
      <Link to="/dashboard/new">
        <Button
          className="text-white rounded-xl px-6 py-2.5 shadow-elevation-2 hover:shadow-elevation-3 hover:-translate-y-0.5 transition-all duration-300"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Create Your First Session
        </Button>
      </Link>
    </motion.div>
  );
}
