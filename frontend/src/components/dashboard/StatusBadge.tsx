import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: "parsing" | "parsed" | "chat_active" | "complete";
}

const config = {
  parsing: {
    label: "Parsing",
    bg: "bg-muted-foreground/8",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    pulse: true,
  },
  parsed: {
    label: "Ready",
    bg: "bg-warning/8",
    text: "text-warning",
    dot: "bg-warning",
    pulse: false,
  },
  chat_active: {
    label: "Live Chat",
    bg: "bg-accent/8",
    text: "text-accent",
    dot: "bg-accent",
    pulse: true,
  },
  complete: {
    label: "Complete",
    bg: "bg-success/8",
    text: "text-success",
    dot: "bg-success",
    pulse: false,
  },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bg, text, dot, pulse } = config[status];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${bg} ${text} backdrop-blur-sm`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={`absolute inset-0 rounded-full ${dot} animate-ping opacity-40`} />
        )}
        <span className={`relative h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {label}
    </motion.span>
  );
}
