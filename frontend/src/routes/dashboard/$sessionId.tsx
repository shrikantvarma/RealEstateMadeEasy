import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  BarChart3,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type TabId = "preferences" | "profile";

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("preferences");

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
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-3" />
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

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; count?: number }[] = [
    { id: "preferences", label: "Preferences", icon: BarChart3, count: sortedPreferences.length },
    { id: "profile", label: "Buyer Profile", icon: User },
  ];

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Back nav */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
        Sessions
      </Link>

      {/* Header: title left, actions right */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-serif text-2xl tracking-tight truncate">
            {session.buyer_name || "Unnamed Buyer"}
          </h1>
          <StatusBadge status={session.status} />
        </div>

        {session.status !== "parsing" && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => handleCopy(chatLink)}
              className="gap-2 rounded-xl border-border text-sm"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Chat Link"}
            </Button>
            <Button
              onClick={() => window.open(chatLink, "_blank")}
              className="gap-2 rounded-xl bg-navy text-primary-foreground hover:bg-navy-light shadow-elevation-1 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Open Buyer Chat
            </Button>
          </div>
        )}
      </div>

      {/* Chat link banner */}
      {session.status !== "parsing" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Buyer Chat Link</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                {chatLink}
              </p>
            </div>
            <button
              onClick={() => handleCopy(chatLink)}
              className="text-xs text-gold hover:text-gold-light font-medium transition-colors shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
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
        <>
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border/40 mb-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isActive
                        ? "bg-gold/15 text-gold"
                        : "bg-surface-3 text-muted-foreground"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "preferences" ? (
            <div className="space-y-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
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
          ) : (
            <BuyerProfilePanel session={session} />
          )}
        </>
      )}
    </div>
  );
}
