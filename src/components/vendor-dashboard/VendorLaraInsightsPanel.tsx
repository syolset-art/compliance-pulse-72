import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Diamond, ChevronLeft, ChevronRight, AlertTriangle, FileWarning, Inbox, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  vendor_category?: string | null;
  gdpr_role?: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  next_review_date?: string | null;
}

interface Props {
  vendors: Asset[];
  expiredDocVendorIds: string[];
  pendingInboxVendorIds: string[];
  onSendRequest?: (vendorIds: string[], requestType: string, categoryKey: string) => void;
}

type Severity = "critical" | "high" | "medium";

interface Task {
  id: string;
  severity: Severity;
  vendor: Asset;
  meta: string;
  laraSees: string;
  requestType: string;
  categoryKey: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  infrastructure: "Infrastruktur",
  consulting: "Rådgivning",
  it_operations: "IT-drift",
  facilities: "Kontor",
  other: "Annet",
};

const GDPR_LABELS: Record<string, string> = {
  databehandler: "databehandler",
  underdatabehandler: "underdatabehandler",
  ingen: "ingen persondata",
};

const severityMeta: Record<Severity, { label: string; dot: string; text: string }> = {
  critical: { label: "KRITISK", dot: "bg-destructive", text: "text-destructive" },
  high: { label: "HØY", dot: "bg-warning", text: "text-warning" },
  medium: { label: "MIDDELS", dot: "bg-primary", text: "text-primary" },
};

export function VendorLaraInsightsPanel({
  vendors,
  expiredDocVendorIds,
  pendingInboxVendorIds,
  onSendRequest,
}: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  const tasks = useMemo<Task[]>(() => {
    const list: Task[] = [];
    const now = new Date();

    vendors.forEach((v) => {
      const cat = v.vendor_category ? CATEGORY_LABELS[v.vendor_category] || v.vendor_category : null;
      const role = v.gdpr_role ? GDPR_LABELS[v.gdpr_role] || v.gdpr_role : null;
      const meta = [cat, role].filter(Boolean).join(" · ");

      if ((v.compliance_score || 0) < 30) {
        list.push({
          id: `dpa-${v.id}`,
          severity: "critical",
          vendor: v,
          meta,
          laraSees: `Behandler personopplysninger. Ingen DPA registrert. Compliance-score ${v.compliance_score || 0}%.`,
          requestType: "dpa",
          categoryKey: "missing_dpa",
        });
      }
      if (expiredDocVendorIds.includes(v.id)) {
        list.push({
          id: `exp-${v.id}`,
          severity: "high",
          vendor: v,
          meta,
          laraSees: "Sertifikater eller avtaler er utløpt. Trenger oppdatert dokumentasjon fra leverandøren.",
          requestType: "renewal",
          categoryKey: "expired_docs",
        });
      }
      if (v.risk_level === "high" && (v.compliance_score || 0) < 50) {
        list.push({
          id: `risk-${v.id}`,
          severity: "high",
          vendor: v,
          meta,
          laraSees: `Høy risiko og lav compliance (${v.compliance_score || 0}%). Anbefaler strukturert vurdering.`,
          requestType: "assessment",
          categoryKey: "high_risk",
        });
      }
      if (pendingInboxVendorIds.includes(v.id)) {
        list.push({
          id: `inbox-${v.id}`,
          severity: "medium",
          vendor: v,
          meta,
          laraSees: "Nye dokumenter eller svar venter behandling i Lara-innboksen.",
          requestType: "inbox",
          categoryKey: "inbox",
        });
      }
      if (v.next_review_date && new Date(v.next_review_date) < now) {
        list.push({
          id: `rev-${v.id}`,
          severity: "medium",
          vendor: v,
          meta,
          laraSees: "Planlagt periodisk gjennomgang er overskredet. Sett ny dato eller utfør nå.",
          requestType: "review",
          categoryKey: "overdue_review",
        });
      }
    });

    const order: Severity[] = ["critical", "high", "medium"];
    return list.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  }, [vendors, expiredDocVendorIds, pendingInboxVendorIds]);

  if (dismissed || tasks.length === 0) return null;

  const criticalCount = tasks.filter((t) => t.severity === "critical").length;
  const total = tasks.length;
  const topCount = Math.min(3, total);
  const current = tasks[Math.min(index, topCount - 1)];

  // Compact banner
  if (!expanded) {
    return (
      <Card variant="flat" className="px-4 py-3 border-primary/20 bg-primary/[0.03]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Diamond className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Lara har en anbefaling til deg</p>
            <p className="text-[13px] text-muted-foreground">
              Du har {total} oppgaver som krever oppmerksomhet, hvorav {criticalCount} er kritiske. Vil du starte en gjennomgang?
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={() => setExpanded(true)}>
              Vis plan
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setDismissed(true)}>
              Ikke nå
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Expanded plan view
  const sev = severityMeta[current.severity];
  const estMin = Math.max(3, Math.round(total * 0.7));
  const TaskIcon =
    current.categoryKey === "missing_dpa"
      ? FileWarning
      : current.categoryKey === "high_risk"
      ? ShieldCheck
      : current.categoryKey === "inbox"
      ? Inbox
      : AlertTriangle;

  return (
    <Card variant="flat" className="p-4 border-primary/20 bg-primary/[0.03]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Diamond className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Lara har lagt en plan</p>
          <p className="text-[13px] text-muted-foreground">
            {total} oppgaver totalt — starter med de {topCount} mest kritiske · ca. {estMin} min
          </p>
          {/* Progress segments */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: topCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-10 rounded-full transition-colors",
                  i === index ? "bg-primary" : i < index ? "bg-primary/60" : "bg-primary/15"
                )}
              />
            ))}
          </div>
        </div>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setExpanded(false)}>
          Lukk
        </Button>
      </div>

      {/* Task card */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
          <span className={cn("text-[11px] font-bold tracking-wider", sev.text)}>{sev.label}</span>
        </div>
        <h4 className="text-lg font-semibold text-foreground leading-tight">{current.vendor.name}</h4>
        {current.meta && <p className="text-[13px] text-muted-foreground mt-0.5">{current.meta}</p>}

        <div className="mt-3 rounded-lg bg-primary/[0.06] border border-primary/10 px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
            <TaskIcon className="h-3 w-3" />
            LARA SER
          </p>
          <p className="text-[13px] text-foreground/90 leading-relaxed">{current.laraSees}</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            size="sm"
            onClick={() => onSendRequest?.([current.vendor.id], current.requestType, current.categoryKey)}
          >
            Be Lara håndtere det
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/assets/${current.vendor.id}`)}>
            Åpne leverandøren
          </Button>
        </div>
      </div>

      {/* Footer: pagination + view all */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {index + 1} av {topCount}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-muted"
            disabled={index >= topCount - 1}
            onClick={() => setIndex((i) => Math.min(topCount - 1, i + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <button
          className="text-[13px] text-primary hover:underline flex items-center gap-1.5 font-medium"
          onClick={() => navigate("/tasks")}
        >
          Vis alle oppgaver
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
            {total}
          </span>
        </button>
      </div>
    </Card>
  );
}
