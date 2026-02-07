import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Home } from "lucide-react";
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
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <Link to="/dashboard/new">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-surface-3 animate-pulse"
            />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-2xl bg-accent/10 p-4 mb-6">
        <Home className="h-12 w-12 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        Ready to understand your buyers?
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Upload a conversation transcript and let AI extract what matters.
      </p>
      <Link to="/dashboard/new">
        <Button
          className="text-white rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-all"
          style={{ background: "var(--gradient-hero)" }}
        >
          Create Your First Session
        </Button>
      </Link>
    </div>
  );
}
