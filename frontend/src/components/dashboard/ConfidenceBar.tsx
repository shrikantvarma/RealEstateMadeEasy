import { motion } from "framer-motion";

interface ConfidenceBarProps {
  value: number; // 0-100
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = value;

  const level =
    value >= 70 ? "high" : value >= 40 ? "medium" : "low";

  const color =
    level === "high"
      ? "var(--success)"
      : level === "medium"
        ? "var(--warning)"
        : "var(--destructive)";

  const label =
    level === "high" ? "High" : level === "medium" ? "Med" : "Low";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-1.5 flex-1 max-w-[120px] rounded-full bg-surface-3 overflow-hidden"
        role="meter"
        aria-label={`Confidence: ${value} percent`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {value}%
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
