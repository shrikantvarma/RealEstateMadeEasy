import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PreferenceCardProps {
  category: string;
  value: string;
  confidence: "low" | "medium" | "high";
  source: "transcript" | "chat" | "both";
  isConfirmed: boolean;
}

const confidenceConfig = {
  high: {
    dot: "bg-success",
    label: "High",
    bg: "bg-success/5",
    badgeBg: "bg-success/15",
    badgeBorder: "border-success/30",
    badgeText: "text-success",
  },
  medium: {
    dot: "bg-gold",
    label: "Med",
    bg: "",
    badgeBg: "bg-gold/15",
    badgeBorder: "border-gold/30",
    badgeText: "text-gold",
  },
  low: {
    dot: "bg-destructive",
    label: "Low",
    bg: "",
    badgeBg: "bg-destructive/15",
    badgeBorder: "border-destructive/30",
    badgeText: "text-destructive",
  },
} as const;

const sourceLabels = {
  transcript: "Transcript",
  chat: "Chat",
  both: "Both",
} as const;

export function PreferenceCard({
  category,
  value,
  confidence,
  source,
  isConfirmed,
}: PreferenceCardProps) {
  const { dot, label, bg, badgeBg, badgeBorder, badgeText } = confidenceConfig[confidence];

  return (
    <Card className={`gap-0 rounded-2xl border-border/30 bg-surface-2 py-0 shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all duration-300 ${bg}`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {category}
          </span>
          {isConfirmed && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 border border-success/30">
              <Check className="h-3 w-3 text-success" />
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">
          {value}
        </p>
      </div>

      <div className="flex items-center gap-2.5 border-t border-border/20 px-4 py-2.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${badgeBg} ${badgeBorder} ${badgeText}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </span>

        <Badge
          variant="secondary"
          className="px-2 py-0.5 text-[10px] font-normal rounded-md"
        >
          {sourceLabels[source]}
        </Badge>
      </div>
    </Card>
  );
}
