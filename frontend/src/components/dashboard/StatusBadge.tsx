interface StatusBadgeProps {
  status: "parsing" | "parsed" | "chat_active" | "complete";
}

const config = {
  parsing: {
    label: "Parsing",
    bg: "bg-surface-3",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground animate-pulse",
  },
  parsed: {
    label: "Parsed",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  chat_active: {
    label: "Chat Active",
    bg: "bg-accent/10",
    text: "text-accent",
    dot: "bg-accent animate-pulse",
  },
  complete: {
    label: "Complete",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bg, text, dot } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
