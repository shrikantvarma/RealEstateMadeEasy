import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { PreferenceData } from "@/lib/api";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PreferenceCard } from "@/components/dashboard/PreferenceCard";
import { BuyerProfilePanel } from "@/components/dashboard/BuyerProfilePanel";

export const Route = createFileRoute("/dashboard/$sessionId")({
  component: SessionDetailPage,
});

const confidenceOrder: Record<PreferenceData["confidence"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function SessionDetailPage() {
  const { sessionId } = Route.useParams();

  const { data: session, isLoading } = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const res = await api.sessions.get(sessionId);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "chat_active" ? 5000 : false,
  });

  const {
    data: preferences,
    isLoading: prefsLoading,
  } = useQuery({
    queryKey: ["sessions", sessionId, "preferences"],
    queryFn: async () => {
      const res = await api.sessions.getPreferences(sessionId);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    enabled: !!session && session.status !== "parsing",
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const chatLink = `${window.location.origin}/chat/${session.id}`;

  const sortedPreferences = preferences
    ? [...preferences].sort(
        (a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence],
      )
    : [];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Sessions
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {session.buyer_name || "Unnamed Buyer"}
        </h1>
        <StatusBadge status={session.status} />
      </div>

      {session.status === "parsing" ? (
        <div className="rounded-xl bg-surface-2 border border-border/50 p-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-lg font-medium">Analyzing transcript...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Extracting preferences and signals
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Extracted Preferences
            </h2>

            {session.summary && (
              <div className="flex items-start gap-2.5 rounded-xl bg-accent/8 border border-accent/15 px-4 py-3">
                <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {session.summary}
                </p>
              </div>
            )}

            {prefsLoading ? (
              <div className="rounded-xl bg-surface-2 border border-border/50 p-6 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : sortedPreferences.length === 0 ? (
              <div className="rounded-xl bg-surface-2 border border-border/50 p-6 text-center text-muted-foreground">
                <p className="text-sm">
                  No preferences extracted yet. Upload a transcript to get
                  started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedPreferences.map((pref) => (
                  <PreferenceCard
                    key={pref.id}
                    category={pref.category}
                    value={pref.value}
                    confidence={pref.confidence}
                    source={pref.source}
                    isConfirmed={pref.is_confirmed}
                  />
                ))}
              </div>
            )}
          </div>

          <BuyerProfilePanel session={session} />
        </div>
      )}

      {session.status !== "parsing" && (
        <div className="mt-8 rounded-xl bg-surface-2 border border-border/50 p-5">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Chat Link
          </h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-surface-3 rounded-lg px-3 py-2 text-sm font-mono truncate">
              {chatLink}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(chatLink)}
              className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Send this link to your buyer via text or email.
          </p>
        </div>
      )}
    </div>
  );
}
