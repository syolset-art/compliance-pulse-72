import { useState } from "react";
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle, FileText, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface MissingControl {
  ref: string;
  title: string;
  severity: "critical" | "high" | "medium";
}

export interface VendorGapDetail {
  asset_id: string;
  name: string;
  score: number;
  implemented: number;
  partial: number;
  missing: number;
  topMissing: MissingControl[];
  evidenceAgeDays: number | null;
  triggeredArticles: string[];
  dpaStatus: "ok" | "missing" | "expired";
  slaStatus: "ok" | "missing" | "outdated";
  certifications: string[];
}

const scoreRing = (s: number) =>
  s >= 75
    ? "ring-success/40 bg-success/10 text-success"
    : s >= 50
    ? "ring-warning/40 bg-warning/10 text-warning"
    : "ring-destructive/40 bg-destructive/10 text-destructive";

const sevBadge = (sev: MissingControl["severity"]) =>
  sev === "critical"
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : sev === "high"
    ? "bg-warning/15 text-warning border-warning/30"
    : "bg-muted text-muted-foreground border-border";

const statusChip = (status: "ok" | "missing" | "expired" | "outdated", isNb: boolean) => {
  const map = {
    ok: { label: isNb ? "OK" : "OK", cls: "bg-success/10 text-success border-success/30" },
    missing: { label: isNb ? "Mangler" : "Missing", cls: "bg-destructive/10 text-destructive border-destructive/30" },
    expired: { label: isNb ? "Utløpt" : "Expired", cls: "bg-destructive/10 text-destructive border-destructive/30" },
    outdated: { label: isNb ? "Utdatert" : "Outdated", cls: "bg-warning/10 text-warning border-warning/30" },
  };
  return map[status];
};

interface Props {
  isNb: boolean;
  vendor: VendorGapDetail;
}

export function GapAnalysisVendorRow({ isNb, vendor }: Props) {
  const [open, setOpen] = useState(false);
  const dpa = statusChip(vendor.dpaStatus, isNb);
  const sla = statusChip(vendor.slaStatus, isNb);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 text-left"
      >
        <div
          className={cn(
            "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums ring-2",
            scoreRing(vendor.score)
          )}
        >
          {vendor.score}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{vendor.name}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              {vendor.implemented}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-warning" />
              {vendor.partial}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              {vendor.missing}
            </span>
            {vendor.evidenceAgeDays !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isNb ? `Bevis ${vendor.evidenceAgeDays}d` : `Evidence ${vendor.evidenceAgeDays}d`}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 bg-muted/20">
          {/* Status chips */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={cn("text-[11px]", dpa.cls)}>
              DPA · {dpa.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[11px]", sla.cls)}>
              SLA · {sla.label}
            </Badge>
            {vendor.certifications.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="text-[11px] bg-success/10 text-success border-success/30"
              >
                <ShieldAlert className="h-3 w-3 mr-1" />
                {c}
              </Badge>
            ))}
          </div>

          {/* Top missing controls */}
          {vendor.topMissing.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                {isNb ? "Topp manglende kontroller" : "Top missing controls"}
              </p>
              <ul className="space-y-1">
                {vendor.topMissing.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs p-2 rounded-md bg-background border border-border"
                  >
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] shrink-0", sevBadge(m.severity))}
                    >
                      {m.ref}
                    </Badge>
                    <span className="text-foreground flex-1">{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Triggered articles */}
          {vendor.triggeredArticles.length > 0 && (
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                {isNb ? "Berørte artikler: " : "Triggered articles: "}
                <span className="text-foreground">{vendor.triggeredArticles.join(", ")}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
