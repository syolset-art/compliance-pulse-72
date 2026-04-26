import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, AlertTriangle, Copy, Bell, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveVendorStatus, type VendorStatusMeta } from "@/lib/vendorStatus";

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  infrastructure: "Skyinfrastruktur",
  consulting: "Konsulent",
  it_operations: "IT-drift",
  facilities: "Kontor",
  other: "Annet",
};

interface VendorRowAsset {
  id: string;
  name: string;
  category?: string | null;
  vendor_category?: string | null;
  compliance_score?: number | null;
  risk_level?: string | null;
  lifecycle_status?: string | null;
  org_number?: string | null;
  url?: string | null;
  contact_person?: string | null;
  asset_owner?: string | null;
  work_area_id?: string | null;
  metadata?: any;
  updated_at?: string | null;
}

interface Props {
  vendor: VendorRowAsset;
  expiredDocsCount?: number;
  inboxCount?: number;
  ownerName?: string | null;
  /** Frameworks som denne leverandøren omfattes av (visningsstrenger) */
  frameworks?: string[];
}

function formatShortDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

function VendorDonut({ score, tone }: { score: number; tone: VendorStatusMeta["tone"] }) {
  const has = score > 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const strokeColor =
    tone === "success" ? "hsl(var(--success))" :
    tone === "destructive" ? "hsl(var(--destructive))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.3)";

  if (!has) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        </svg>
        <span className="absolute text-muted-foreground text-sm leading-none">—</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span
        className={cn(
          "absolute text-[12px] font-semibold tabular-nums leading-none",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary",
        )}
      >
        {score}%
      </span>
    </div>
  );
}

export function VendorStatusRow({
  vendor,
  expiredDocsCount = 0,
  inboxCount = 0,
  ownerName,
  frameworks = [],
}: Props) {
  const navigate = useNavigate();
  const status = deriveVendorStatus({
    compliance_score: vendor.compliance_score,
    risk_level: vendor.risk_level,
    lifecycle_status: vendor.lifecycle_status,
    metadata: vendor.metadata,
    expiredDocsCount,
    inboxCount,
  });

  const score = vendor.compliance_score || 0;
  const categoryLabel = vendor.vendor_category
    ? (CATEGORY_LABELS[vendor.vendor_category] || vendor.vendor_category)
    : (vendor.category || null);

  // Avledede informasjonsbiter for tredje linje
  const md = vendor.metadata || {};
  const openGaps: number = md.open_gaps ?? (status.key === "needs_action" ? 2 : status.key === "in_followup" ? 1 : 0);
  const dpaExpiredOn: string | null = md.dpa_expired_on || null;
  const invitationSentOn = formatShortDate(md.invited_at);
  const invitationDaysLeft: number | null = typeof md.invitation_days_left === "number" ? md.invitation_days_left : null;
  const lastActivity = formatShortDate(vendor.updated_at);
  const isLaraMapping = inboxCount > 0 && status.key === "draft";

  const handleOpen = () => navigate(`/assets/${vendor.id}`);

  // Linje 3 — kontekstuell tekst
  const renderContextLine = () => {
    if (status.key === "needs_action") {
      const parts: string[] = [];
      if (openGaps > 0) parts.push(`${openGaps} åpne gap`);
      if (dpaExpiredOn) parts.push(`DPA utløpt ${dpaExpiredOn}`);
      if (parts.length === 0 && expiredDocsCount > 0) parts.push(`${expiredDocsCount} utløpte dokument`);
      if (parts.length === 0) parts.push("Manglende dokumentasjon");
      return (
        <div className="flex items-center gap-1.5 text-[13px] text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>{parts.join(" · ")}</span>
        </div>
      );
    }
    if (status.key === "in_followup") {
      const parts: string[] = [];
      if (openGaps > 0) parts.push(`${openGaps} gap under oppfølging`);
      if (vendor.contact_person) parts.push(`Kontakt: ${vendor.contact_person}`);
      return <p className="text-[13px] text-muted-foreground">{parts.join(" · ")}</p>;
    }
    if (status.key === "invited") {
      const parts: string[] = [];
      if (invitationSentOn) parts.push(`Invitasjon sendt ${invitationSentOn}`);
      if (invitationDaysLeft !== null) parts.push(`utløper om ${invitationDaysLeft} dager`);
      if (parts.length === 0) parts.push("Venter på respons fra leverandør");
      return <p className="text-[13px] text-muted-foreground">{parts.join(" · ")}</p>;
    }
    if (status.key === "draft") {
      if (isLaraMapping) {
        return (
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[13px] gap-1 px-2 py-0.5">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Lara kartlegger…
          </Badge>
        );
      }
      return <p className="text-[13px] text-muted-foreground">Utkast – mangler kjernedata</p>;
    }
    // approved
    const parts: string[] = [];
    if (vendor.contact_person) parts.push(`Kontakt: ${vendor.contact_person}`);
    if (ownerName) parts.push(`Ansvarlig hos oss: ${ownerName}`);
    return parts.length > 0 ? <p className="text-[13px] text-muted-foreground">{parts.join(" · ")}</p> : null;
  };

  // Høyre side — handlinger
  const renderActions = () => {
    if (status.key === "needs_action") {
      return (
        <Button size="sm" variant="destructive" onClick={handleOpen} className="gap-1.5">
          Åpne gap <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );
    }
    if (status.key === "invited") {
      return (
        <div className="flex flex-col gap-1.5 items-stretch">
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); toast.success("Påminnelse sendt"); }}>
            <Bell className="h-3 w-3" /> Påminnelse
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); toast.success("Lenke kopiert"); }}>
            <Copy className="h-3 w-3" /> Kopier lenke
          </Button>
        </div>
      );
    }
    if (status.key === "draft") {
      return (
        <Button size="sm" onClick={handleOpen} className="gap-1.5">
          <Send className="h-3.5 w-3.5" /> Inviter leverandør
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline" onClick={handleOpen} className="gap-1.5">
        Åpne <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    );
  };

  // Datolabel øverst til høyre
  const topRightLabel = () => {
    if (status.key === "approved") {
      const md = vendor.metadata || {};
      const agreements = md.agreements_count;
      const gapsClosed = md.gaps_closed;
      return (
        <div className="text-[13px] text-muted-foreground text-right">
          {(agreements || gapsClosed) && (
            <div>{agreements ? `${agreements} avtaler` : ""}{agreements && gapsClosed ? " · " : ""}{gapsClosed ? `${gapsClosed} gap lukket` : ""}</div>
          )}
          {lastActivity && <div>Sist oppdatert {lastActivity}</div>}
        </div>
      );
    }
    if (status.key === "invited") return null; // vises på linje 3
    if (lastActivity) return <p className="text-[13px] text-muted-foreground">Sist aktivitet {lastActivity}</p>;
    return null;
  };

  return (
    <Card
      variant="flat"
      onClick={handleOpen}
      className="relative cursor-pointer hover:shadow-md transition-all hover:border-primary/30 px-5 py-4"
    >
      {/* Statusprikk i venstre marg */}
      <span
        className={cn("absolute left-2 top-5 h-1.5 w-1.5 rounded-full", status.dotClass)}
        aria-hidden
      />

      <div className="flex items-start gap-4">
        {/* Hovedinnhold */}
        <div className="flex-1 min-w-0">
          {/* Linje 1 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{vendor.name}</h3>
            <Badge
              variant="outline"
              className={cn("text-[12px] gap-1 px-2 py-0.5 font-medium", status.pillClass, status.textClass)}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
              {status.label}
            </Badge>
            {categoryLabel && (
              <Badge variant="outline" className="text-[12px] px-2 py-0.5 bg-primary/5 border-primary/15 text-primary font-medium">
                {categoryLabel}
              </Badge>
            )}
          </div>

          {/* Linje 2 — meta */}
          <p className="text-[13px] text-muted-foreground mt-1.5 truncate">
            {[
              vendor.org_number ? `Org. ${vendor.org_number}` : null,
              vendor.url ? vendor.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null,
              frameworks.length > 0 ? frameworks.join(" + ") : null,
            ].filter(Boolean).join(" · ")}
          </p>

          {/* Linje 3 — kontekst */}
          <div className="mt-1.5">{renderContextLine()}</div>
        </div>

        {/* Donut */}
        <div className="hidden md:flex flex-col items-center justify-center gap-1 shrink-0 pt-0.5">
          <VendorDonut score={score} tone={status.tone} />
          <span className="text-[11px] text-muted-foreground">Modenhet</span>
        </div>

        {/* Handlinger og datolabel */}
        <div className="flex flex-col items-end gap-2 shrink-0 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
          {topRightLabel()}
          {renderActions()}
        </div>
      </div>
    </Card>
  );
}
