import { Link } from "@tanstack/react-router";
import type { SessionData } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { ConfidenceBar } from "./ConfidenceBar";

interface SessionCardProps {
  session: SessionData;
}

export function SessionCard({ session }: SessionCardProps) {
  const timeAgo = getRelativeTime(session.created_at);

  return (
    <Link
      to="/dashboard/$sessionId"
      params={{ sessionId: session.id }}
      className="block rounded-xl bg-surface-2 border border-border/50 p-5 shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:shadow-elevation-1 active:scale-[0.99] transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-base font-medium">
            {session.buyer_name || (
              <span className="text-muted-foreground italic">
                Unnamed Buyer
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {session.summary && (
        <p className="text-sm text-muted-foreground mb-3 truncate max-w-[60ch]">
          &ldquo;{session.summary}&rdquo;
        </p>
      )}

      {session.overall_confidence != null && (
        <ConfidenceBar value={session.overall_confidence} />
      )}
    </Link>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
