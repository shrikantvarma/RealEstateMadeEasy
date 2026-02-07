import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  ShieldAlert,
  Heart,
  DollarSign,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BuyerProfileData, SessionData } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceBar } from "@/components/dashboard/ConfidenceBar";

/* ---------- sub-types ---------- */

type Readiness = BuyerProfileData["scored_preferences"]["overall_readiness"];

/* ---------- config maps ---------- */

const readinessConfig: Record<
  Readiness,
  { label: string; bg: string; text: string }
> = {
  exploring: {
    label: "Exploring",
    bg: "bg-surface-3",
    text: "text-muted-foreground",
  },
  active: {
    label: "Active",
    bg: "bg-accent/10",
    text: "text-accent",
  },
  ready_to_buy: {
    label: "Ready to Buy",
    bg: "bg-success/10",
    text: "text-success",
  },
};

/* ---------- animation variants ---------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ---------- score bar ---------- */

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7
      ? "var(--success)"
      : score >= 4
        ? "var(--warning)"
        : "var(--destructive)";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative h-1.5 flex-1 rounded-full bg-surface-3 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-5 text-right">
        {score}
      </span>
    </div>
  );
}

/* ---------- main component ---------- */

interface BuyerProfilePanelProps {
  session: SessionData;
}

export function BuyerProfilePanel({ session }: BuyerProfilePanelProps) {
  const queryClient = useQueryClient();
  const canGenerate = session.status === "chat_active";
  const isComplete = session.status === "complete";

  /* fetch profile when status is complete */
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["sessions", session.id, "profile"],
    queryFn: async () => {
      const res = await api.sessions.getProfile(session.id);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    enabled: isComplete,
    retry: 2,
  });

  /* generate profile mutation */
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.sessions.generateProfile(session.id);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    onSuccess: (data) => {
      // cache the profile so we don't re-fetch
      queryClient.setQueryData(
        ["sessions", session.id, "profile"],
        data,
      );
      // invalidate session so status updates to "complete"
      queryClient.invalidateQueries({
        queryKey: ["sessions", session.id],
      });
    },
  });

  /* choose which profile data to render */
  const activeProfile = generateMutation.data ?? profile;

  /* sort scored prefs by score descending */
  const sortedScored = useMemo(() => {
    if (!activeProfile) return [];
    return [...activeProfile.scored_preferences.scored_preferences].sort(
      (a, b) => b.score - a.score,
    );
  }, [activeProfile]);

  /* ---------- render: generate prompt ---------- */
  if (canGenerate && !activeProfile) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Buyer Profile
        </h2>

        <div className="rounded-xl border-2 border-dashed border-border bg-surface-3 p-8 text-center">
          <Sparkles className="h-8 w-8 text-accent mx-auto mb-3 opacity-60" />
          <p className="text-sm text-muted-foreground mb-4">
            Preferences extracted. Generate a scored buyer profile to see
            deal-breakers, priorities, and readiness.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Profile
              </>
            )}
          </Button>

          {generateMutation.isError && (
            <div className="mt-4 flex items-center justify-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : "Failed to generate profile"}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- render: loading state ---------- */
  if (isComplete && profileLoading && !activeProfile) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Buyer Profile
        </h2>
        <div className="rounded-xl bg-surface-2 border border-border/50 p-12 flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  /* ---------- render: error state ---------- */
  if (isComplete && profileError && !activeProfile) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Buyer Profile
        </h2>
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-6 text-center">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">
            {profileError instanceof Error
              ? profileError.message
              : "Failed to load profile"}
          </p>
        </div>
      </div>
    );
  }

  /* ---------- render: placeholder for parsing status ---------- */
  if (!activeProfile) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Buyer Profile
        </h2>
        <div className="rounded-xl border-2 border-dashed border-border bg-surface-3 p-6 text-center text-muted-foreground">
          <p className="text-sm">
            Profile builds after your buyer completes their chat.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- render: full profile ---------- */
  const prefs = activeProfile.scored_preferences;

  const readiness = readinessConfig[prefs.overall_readiness];

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Buyer Profile
      </h2>

      {/* Profile Summary */}
      <motion.div variants={itemVariants}>
        <Card className="gap-0 rounded-xl border-accent/20 bg-accent/5 py-0 shadow-none">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-accent">
                Summary
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {prefs.profile_summary}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Overall Readiness + Confidence */}
      <motion.div variants={itemVariants}>
        <Card className="gap-0 rounded-xl border-border/50 bg-surface-2 py-0 shadow-none">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Readiness
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${readiness.bg} ${readiness.text}`}
              >
                {readiness.label}
              </span>
            </div>

            {session.overall_confidence != null && (
              <div>
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Overall Confidence
                </span>
                <ConfidenceBar value={session.overall_confidence} />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Deal Breakers */}
      <AnimatePresence>
        {prefs.deal_breakers.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="gap-0 rounded-xl border-destructive/15 bg-destructive/5 py-0 shadow-none">
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-destructive">
                    Deal Breakers
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {prefs.deal_breakers.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nice to Haves */}
      <AnimatePresence>
        {prefs.nice_to_haves.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="gap-0 rounded-xl border-emerald-500/15 bg-emerald-500/5 py-0 shadow-none">
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-600">
                    Nice to Have
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {prefs.nice_to_haves.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Summary */}
      {prefs.budget_summary && (
        <motion.div variants={itemVariants}>
          <Card className="gap-0 rounded-xl border-border/50 bg-surface-2 py-0 shadow-none">
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Budget
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                {prefs.budget_summary}
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Scored Preferences */}
      {sortedScored.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="gap-0 rounded-xl border-border/50 bg-surface-2 py-0 shadow-none overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Scored Preferences
                </span>
              </div>

              <div className="space-y-2.5">
                {sortedScored.map((pref) => (
                  <div key={`${pref.category}-${pref.value}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {pref.category}
                        </span>
                        <p className="text-sm font-medium text-foreground truncate">
                          {pref.value}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] font-normal shrink-0"
                      >
                        {pref.confidence}
                      </Badge>
                    </div>
                    <ScoreBar score={pref.score} />
                    {pref.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">
                        {pref.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* bottom padding */}
            <div className="h-3" />
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
