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
    label: "High confidence",
  },
  medium: {
    dot: "bg-warning",
    label: "Medium",
  },
  low: {
    dot: "bg-destructive",
    label: "Low",
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
  const { dot, label } = confidenceConfig[confidence];

  return (
    <Card className="gap-0 rounded-xl border-border/50 bg-surface-2 py-0 shadow-none">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {category}
          </span>
          {isConfirmed && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
              <Check className="h-2.5 w-2.5 text-success" />
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">
          {value}
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-border/40 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </span>

        <Badge
          variant="secondary"
          className="px-1.5 py-0 text-[10px] font-normal"
        >
          {sourceLabels[source]}
        </Badge>
      </div>
    </Card>
  );
}
