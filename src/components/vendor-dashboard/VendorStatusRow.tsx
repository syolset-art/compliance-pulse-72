import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ArrowRight, Copy, Bell, Send, MessageSquare,
  Clock, Archive, ShieldCheck, LayoutGrid, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  deriveVendorStatus, deriveCriticality,
  type VendorStatusMeta,
} from "@/lib/vendorStatus";

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
  criticality?: string | null;
  lifecycle_status?: string | null;
  org_number?: string | null;
  url?: string | null;
  contact_person?: string | null;
  asset_owner?: string | null;
  work_area_id?: string | null;
  metadata?: any;
  updated_at?: string | null;
  created_at?: string | null;
}

interface Props {
  vendor: VendorRowAsset;
  expiredDocsCount?: number;
  inboxCount?: number;
  ownerName?: string | null;
  /** Frameworks/kategorier vist i meta-linja (f.eks. ["Drift", "IT-tjenester"]) */
  segments?: string[];
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}
function formatShortDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
  } catch { return null; }
}

function VendorDonut({ score, tone, frozen }: { score: number; tone: VendorStatusMeta["tone"]; frozen?: boolean }) {
  const has = score > 0;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const stroke =
    frozen ? "hsl(var(--muted-foreground) / 0.4)" :
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.5)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
        {has && (
          <circle
            cx="32" cy="32" r={radius} fill="none"
            stroke={stroke} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        )}
      </svg>
      <span
        className={cn(
          "absolute text-[13px] font-semibold tabular-nums leading-none",
          frozen ? "text-muted-foreground line-through" :
          tone === "success" ? "text-success" :
          tone === "warning" ? "text-warning" :
          tone === "primary" ? "text-primary" :
          "text-muted-foreground"
        )}
      >
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

export function VendorStatusRow({
  vendor,
  expiredDocsCount = 0,
  inboxCount = 0,
  ownerName,
  segments,
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
  const criticality = deriveCriticality({ criticality: vendor.criticality, risk_level: vendor.risk_level });

  const score = vendor.compliance_score || 0;
  const md = vendor.metadata || {};
  const isLaraMapping = inboxCount > 0 && status.key === "draft";

  // Modenhet-label (under prosent)
  const maturityLabel =
    status.key === "draft"    ? "estimert av Lara" :
    status.key === "invited"  ? "delvis vurdert" :
    status.key === "claimed"  ? "oppdatert av leverandør" :
    status.key === "archived" ? `fryst ${formatShortDate(md.archived_at || vendor.updated_at) || ""}` :
    "";

  // Meta-linje segmenter
  const fallbackSegments = [
    vendor.vendor_category ? (CATEGORY_LABELS[vendor.vendor_category] || vendor.vendor_category) : null,
    vendor.category,
  ].filter(Boolean) as string[];
  const segmentChips = (segments && segments.length > 0) ? segments : fallbackSegments;

  const handleOpen = () => navigate(`/assets/${vendor.id}`);

  // ---- Tilstandsbanner ----
  const renderBanner = () => {
    if (status.key === "draft") {
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 text-warning shrink-0" />
            <span className="text-[13px] text-foreground truncate">
              {isLaraMapping
                ? <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary animate-pulse" />Lara kartlegger profilen…</span>
                : <>Profilen er ikke claimet av leverandøren. Du redigerer på vegne av <strong>{vendor.name}</strong>.</>}
            </span>
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleOpen(); }} className="gap-1.5 shrink-0">
            <Send className="h-3.5 w-3.5" /> Inviter leverandøren
          </Button>
        </div>
      );
    }
    if (status.key === "invited") {
      const sent = formatLongDate(md.invited_at) || formatLongDate(vendor.updated_at);
      const days = typeof md.invitation_days_left === "number" ? md.invitation_days_left : 5;
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[13px] text-foreground truncate">
              Invitasjon sendt {sent ? sent : "—"}. Lenken utløper om {days} dager.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={(e) => { e.stopPropagation(); toast.success("Påminnelse sendt"); }}>
              <Bell className="h-3.5 w-3.5" /> Påminnelse
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={(e) => { e.stopPropagation(); toast.success("Lenke kopiert"); }}>
              <Copy className="h-3.5 w-3.5" /> Kopier lenke
            </Button>
          </div>
        </div>
      );
    }
    if (status.key === "claimed") {
      const claimedOn = formatLongDate(md.claimed_at) || "—";
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span className="text-[13px] text-foreground truncate">
              Leverandøren eier profilen · claimet {claimedOn}. Dere har lese-tilgang som kunde.
            </span>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0"
            onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
            <MessageSquare className="h-3.5 w-3.5" /> Send melding
          </Button>
        </div>
      );
    }
    // archived
    const archivedOn = formatLongDate(md.archived_at) || "—";
    const archivedBy = md.archived_by || "Mynder";
    const reason = md.archive_reason || md.notes;
    return (
      <div className="mt-3 rounded-lg bg-muted/60 border border-border px-3 py-2.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Archive className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] text-foreground">
              <strong>Samarbeidet er avsluttet.</strong> Arkivert {archivedOn} av {archivedBy}.
            </p>
            {reason && <p className="text-[12px] italic text-muted-foreground mt-0.5">"{reason}"</p>}
          </div>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 shrink-0 text-primary hover:text-primary"
          onClick={(e) => { e.stopPropagation(); toast.success("Samarbeid kan gjenåpnes via leverandørprofilen"); }}>
          <RotateCcw className="h-3.5 w-3.5" /> Gjenåpne samarbeid
        </Button>
      </div>
    );
  };

  // ---- Footer-rad ----
  const renderFooter = () => {
    if (status.key === "claimed" || status.key === "draft") {
      const contact = vendor.contact_person;
      return (
        <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Kontakt hos leverandør</p>
            {contact ? (
              <p className="text-[13px] text-foreground mt-1">{contact}</p>
            ) : (
              <p className="text-[13px] italic text-muted-foreground mt-1">Legg til kontaktperson</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ansvarlig hos oss</p>
            {ownerName ? (
              <p className="text-[13px] text-foreground mt-1">{ownerName}</p>
            ) : (
              <p className="text-[13px] italic text-muted-foreground mt-1">Ikke tildelt</p>
            )}
          </div>
        </div>
      );
    }
    if (status.key === "invited") {
      const created = formatShortDate(vendor.created_at);
      const sent = formatShortDate(md.invited_at) || formatShortDate(vendor.updated_at);
      return (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-3 text-[12px] text-muted-foreground">
          {created && (<><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Opprettet {created}</span><span>→</span></>)}
          <span className="inline-flex items-center gap-1.5 text-primary font-medium"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Invitasjon sendt {sent || "—"}</span>
          <span>→</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Claim venter</span>
        </div>
      );
    }
    // archived
    const period = md.partnership_period || `— `;
    const events = md.activity_count;
    const agreements = md.agreements_count;
    const retentionUntil = formatShortDate(md.retention_until);
    return (
      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Periode</p>
          <p className="text-[13px] text-foreground mt-1">{period}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Aktivitetslogg</p>
          <p className="text-[13px] text-foreground mt-1">{events ? `${events} hendelser` : "—"} · bevart</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Avtaler</p>
          <p className="text-[13px] text-foreground mt-1">{agreements ?? "—"} · i Dokumentoversikt</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Oppbevaringsplikt</p>
          <p className="text-[13px] text-foreground mt-1">{retentionUntil ? `Til ${retentionUntil}` : "5 år fra arkivering"}</p>
        </div>
      </div>
    );
  };

  const isArchived = status.key === "archived";

  return (
    <Card
      variant="flat"
      onClick={handleOpen}
      className={cn(
        "relative cursor-pointer hover:shadow-md transition-all hover:border-primary/30 overflow-hidden p-0",
        isArchived && "opacity-90"
      )}
    >
      <div className="flex">
        {/* Vertikal tilstandsstripe */}
        <div className={cn("relative w-7 shrink-0 flex items-center justify-center", status.stripeBg)}>
          {status.hasActiveDot && (
            <span
              className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-success ring-2 ring-success/30"
              aria-hidden
            />
          )}
          <span
            className={cn("absolute text-[10px] font-bold tracking-[0.18em] whitespace-nowrap", status.stripeText)}
            style={{ transform: "rotate(-90deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Hovedinnhold */}
        <div className="flex-1 min-w-0 p-4">
          {/* Topp-rad: ikon + tittel + kritikalitet  ||  donut + label */}
          <div className="flex items-start gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-md bg-muted/60 border border-border flex items-center justify-center shrink-0">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn("text-[16px] font-semibold text-foreground truncate", isArchived && "line-through text-muted-foreground")}>
                    {vendor.name}
                  </h3>
                  {isArchived ? (
                    <Badge variant="outline" className="text-[12px] gap-1 px-2 py-0.5 bg-muted/60 text-muted-foreground border-border font-medium">
                      <Archive className="h-3 w-3" /> Arkivert
                    </Badge>
                  ) : criticality && (
                    <Badge variant="outline" className={cn("text-[12px] gap-1 px-2 py-0.5 font-medium", criticality.pillClass)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", criticality.dotClass)} />
                      {criticality.label}
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1 truncate">
                  {[
                    vendor.org_number ? `Org.nr ${vendor.org_number}` : null,
                    vendor.url ? vendor.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null,
                    segmentChips.length > 0 ? segmentChips.join(" · ") : null,
                  ].filter(Boolean).join("  ·  ")}
                </p>
              </div>
            </div>

            {/* Donut + maturity label */}
            <div className="hidden md:flex items-center gap-3 shrink-0 pl-3 border-l border-border/60">
              <VendorDonut score={score} tone={status.tone} frozen={isArchived} />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isArchived ? "Siste modenhet" : "Modenhet"}
                </p>
                <p className={cn(
                  "text-[12px] mt-0.5",
                  isArchived ? "italic text-muted-foreground" : "text-muted-foreground"
                )}>
                  {maturityLabel || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Tilstandsbanner */}
          {renderBanner()}

          {/* Footer */}
          {renderFooter()}
        </div>
      </div>
    </Card>
  );
}
