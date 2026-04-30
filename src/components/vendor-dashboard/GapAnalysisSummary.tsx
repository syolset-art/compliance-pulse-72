import { Activity, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DomainBreakdown {
  governance: number;
  operations: number;
  privacy: number;
  thirdParty: number;
}

interface GapAnalysisSummaryProps {
  isNb: boolean;
  avgScore: number;
  totalGaps: number;
  criticalGaps: number;
  domainBreakdown: DomainBreakdown;
  topRiskVendors: { name: string; score: number }[];
  estimatedWeeks: number;
}

const scoreClass = (s: number) =>
  s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";

const barClass = (s: number) =>
  s >= 75 ? "bg-success" : s >= 50 ? "bg-warning" : "bg-destructive";

export function GapAnalysisSummary({
  isNb,
  avgScore,
  totalGaps,
  criticalGaps,
  domainBreakdown,
  topRiskVendors,
  estimatedWeeks,
}: GapAnalysisSummaryProps) {
  const domains = [
    { key: "governance", labelNb: "Styring", labelEn: "Governance", value: domainBreakdown.governance },
    { key: "operations", labelNb: "Drift", labelEn: "Operations", value: domainBreakdown.operations },
    { key: "privacy", labelNb: "Personvern", labelEn: "Privacy", value: domainBreakdown.privacy },
    { key: "thirdParty", labelNb: "Tredjepart", labelEn: "Third-Party", value: domainBreakdown.thirdParty },
  ];

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> {isNb ? "Snitt-score" : "Avg score"}
          </p>
          <p className={cn("text-2xl font-semibold tabular-nums", scoreClass(avgScore))}>
            {avgScore}%
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {isNb ? "Åpne gap" : "Open gaps"}
          </p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{totalGaps}</p>
          <p className="text-[11px] text-destructive">
            {criticalGaps} {isNb ? "kritiske" : "critical"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" /> {isNb ? "Største risiko" : "Top risk"}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {topRiskVendors[0]?.name ?? "–"}
          </p>
          {topRiskVendors[0] && (
            <p className={cn("text-[11px] tabular-nums", scoreClass(topRiskVendors[0].score))}>
              {topRiskVendors[0].score}%
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {isNb ? "Tid til mål" : "Time to target"}
          </p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {estimatedWeeks}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {isNb ? "uker" : "wks"}
            </span>
          </p>
        </div>
      </div>

      {/* Domain breakdown */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
          {isNb ? "Modenhet per domene" : "Maturity per domain"}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {domains.map((d) => (
            <div key={d.key}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{isNb ? d.labelNb : d.labelEn}</span>
                <span className={cn("tabular-nums font-medium", scoreClass(d.value))}>
                  {d.value}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", barClass(d.value))}
                  style={{ width: `${d.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
