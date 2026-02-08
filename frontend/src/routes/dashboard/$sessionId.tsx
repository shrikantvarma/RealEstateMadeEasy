import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Copy, Check, ExternalLink, Sparkles } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
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
    <div className="px-8 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Sessions
        </Link>
        <span className="text-border">/</span>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl tracking-tight">
            {session.buyer_name || "Unnamed Buyer"}
          </h1>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {session.status === "parsing" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-surface-2 border border-border/40 p-16 text-center"
        >
          <div className="relative inline-block mb-5">
            <Loader2 className="h-12 w-12 animate-spin text-gold" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid var(--gold)", opacity: 0.2 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="font-serif text-lg tracking-tight">Analyzing transcript...</p>
          <p className="text-sm text-muted-foreground mt-1.5">
            Extracting preferences, priorities, and buyer signals
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column — preferences */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Extracted Preferences
            </h2>

            {session.summary && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="note-aside rounded-xl bg-gold/5 py-3"
              >
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {session.summary}
                </p>
              </motion.div>
            )}

            {prefsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl skeleton-shimmer"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : sortedPreferences.length === 0 ? (
              <div className="rounded-2xl bg-surface-2 border border-border/40 p-8 text-center">
                <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No preferences extracted yet.
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                }}
              >
                {sortedPreferences.map((pref) => (
                  <motion.div
                    key={pref.id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                    }}
                  >
                    <PreferenceCard
                      category={pref.category}
                      value={pref.value}
                      confidence={pref.confidence}
                      source={pref.source}
                      isConfirmed={pref.is_confirmed}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right column — buyer profile */}
          <BuyerProfilePanel session={session} />
        </div>
      )}

      {/* Chat Link Section */}
      {session.status !== "parsing" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-2xl bg-surface-2 border border-border/40 p-6 shadow-elevation-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Buyer Chat Link
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-3/80 rounded-xl px-4 py-2.5 font-mono text-sm text-foreground/80 truncate border border-border/30">
              {chatLink}
            </div>
            <button
              onClick={() => handleCopy(chatLink)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-primary-foreground text-sm font-medium rounded-xl hover:bg-navy-light active:scale-[0.98] transition-all duration-200 shadow-elevation-1"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Send this link to your buyer via text or email to start the AI-guided conversation.
          </p>
        </motion.div>
      )}
    </div>
  );
}
