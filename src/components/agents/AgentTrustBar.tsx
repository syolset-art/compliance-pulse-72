import { trustScoreColor } from "@/lib/agentMacf";
import { cn } from "@/lib/utils";

export function AgentTrustBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", trustScoreColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums w-8 text-right">{clamped}</span>
    </div>
  );
}
