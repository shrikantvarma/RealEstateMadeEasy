interface ConfidenceBarProps {
  value: number; // 0-100
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);

  const level =
    value >= 70 ? "high" : value >= 40 ? "medium" : "low";

  const gradientVar =
    level === "high"
      ? "var(--success)"
      : level === "medium"
        ? "var(--warning)"
        : "var(--destructive)";

  const label =
    level === "high" ? "High" : level === "medium" ? "Med" : "Low";

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-0.5"
        role="meter"
        aria-label={`Confidence: ${value} percent`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="h-2 w-1 rounded-sm transition-all"
            style={{
              backgroundColor:
                i < filled ? gradientVar : "var(--muted)",
              opacity: i < filled ? 1 : 0.3,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-xs font-medium tabular-nums">
        {value}%
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
