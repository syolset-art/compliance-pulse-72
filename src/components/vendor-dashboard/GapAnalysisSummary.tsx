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

  const weakest = [...domains].sort((a, b) => a.value - b.value)[0];

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> {isNb ? "Snitt-score" : "Avg score"}
          </p>
          <p className={cn("text-2xl font-semibold tabular-nums", scoreClass(avgScore))}>
            {avgScore}%
          </p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {isNb ? "Kritiske gap" : "Critical gaps"}
          </p>
          <p className="text-2xl font-semibold tabular-nums text-destructive">{criticalGaps}</p>
          <p className="text-sm text-muted-foreground">
            {isNb ? `av ${totalGaps} åpne` : `of ${totalGaps} open`}
          </p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" /> {isNb ? "Svakest område" : "Weakest area"}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {isNb ? weakest.labelNb : weakest.labelEn}
          </p>
          <p className={cn("text-sm tabular-nums", scoreClass(weakest.value))}>{weakest.value}%</p>
        </div>
      </div>
    </div>
  );
}

