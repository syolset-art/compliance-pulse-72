import { TrendingUp, TrendingDown, AlertTriangle, Clock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  customerName: string;
  overallMaturity: number;
  deltaPct: number; // siste 30 dager
  criticalGaps: number;
  hiddenIssues: number; // ting partner ser, men kunden ikke
  nextDeadlineDays?: number;
  nextDeadlineLabel?: string;
}

function colorFor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function MSPCustomerSnapshotCard({
  customerName,
  overallMaturity,
  deltaPct,
  criticalGaps,
  hiddenIssues,
  nextDeadlineDays,
  nextDeadlineLabel,
}: Props) {
  const TrendIcon = deltaPct >= 0 ? TrendingUp : TrendingDown;
  const trendColor = deltaPct >= 0 ? "text-success" : "text-destructive";

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-primary">
            Partner-snapshot
          </p>
          <h3 className="text-base font-semibold text-foreground truncate">
            Hva Mynder ser om {customerName}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Innsikt forbeholdt deg som partner — kunden ser dette ikke i sin egen Trust Profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric
          label="Samlet modenhet"
          value={`${overallMaturity}%`}
          valueClass={colorFor(overallMaturity)}
          sub={
            <span className={cn("inline-flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {deltaPct >= 0 ? "+" : ""}{deltaPct}% / 30d
            </span>
          }
        />
        <Metric
          label="Kritiske gap"
          value={String(criticalGaps)}
          valueClass={criticalGaps > 0 ? "text-destructive" : "text-success"}
          sub={<span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />krever tiltak</span>}
        />
        <Metric
          label="Skjulte saker"
          value={String(hiddenIssues)}
          valueClass={hiddenIssues > 0 ? "text-warning" : "text-success"}
          sub={
            <span className="inline-flex items-center gap-1">
              {hiddenIssues > 0 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              kun synlig for partner
            </span>
          }
        />
        <Metric
          label="Neste frist"
          value={nextDeadlineDays != null ? `${nextDeadlineDays}d` : "—"}
          valueClass="text-foreground"
          sub={<span className="inline-flex items-center gap-1 truncate"><Clock className="h-3 w-3 shrink-0" />{nextDeadlineLabel ?? "ingen frist"}</span>}
        />
      </div>
    </div>
  );
}

function Metric({
  label, value, valueClass, sub,
}: { label: string; value: string; valueClass: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums mt-1", valueClass)}>{value}</p>
      <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
