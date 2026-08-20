import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Copy, Send, Sparkles, ExternalLink, Building2, UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveVendorStatus, deriveCriticality, type VendorStatusMeta } from "@/lib/vendorStatus";
import { VendorInlinePillSelect } from "@/components/vendor-dashboard/VendorInlinePillSelect";
import { InviteVendorDialog } from "@/components/vendor-dashboard/InviteVendorDialog";
import { useState } from "react";
import {
  NOT_REQUESTED_LABEL,
  SOURCING_METHOD_META,
  inferVendorSignals,
  readSourcingState,
  recommendSourcingMethod,
  writeSourcingState,
  type SourcingMethod,
} from "@/lib/vendorSourcingMethod";


interface VendorStatusBannerProps {
  asset: {
    id: string;
    name: string;
    compliance_score?: number | null;
    risk_level?: string | null;
    lifecycle_status?: string | null;
    metadata?: any;
    contact_person?: string | null;
    contact_email?: string | null;
    updated_at?: string | null;
    vendor_category?: string | null;
    category?: string | null;
    description?: string | null;
    url?: string | null;
    logo_url?: string | null;
    asset_manager?: string | null;
    org_number?: string | null;
    criticality?: string | null;
    priority?: string | null;
    access_members?: string[];
  };
  accessMembers?: string[];
}

function Donut({ score, tone }: { score: number; tone: VendorStatusMeta["tone"] }) {
  const has = score > 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const strokeColor =
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.3)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        {has && (
          <circle
            cx="36" cy="36" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        )}
      </svg>
      <span
        className={cn(
          "absolute text-[15px] font-bold tabular-nums leading-none",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary",
          !has && "text-muted-foreground",
        )}
      >
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

// Initials avatar
function InitialAvatar({ name, color = "bg-primary/15 text-primary" }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-semibold", color)}>
      {initials || "?"}
    </span>
  );
}

export function VendorStatusBanner({ asset, accessMembers }: VendorStatusBannerProps) {
  const { t } = useTranslation();
  const members = accessMembers || asset.access_members || [];

  const { data: expiredDocsCount = 0 } = useQuery({
    queryKey: ["vendor-banner-expired-docs", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("expires_at, valid_to")
        .eq("asset_id", asset.id);
      if (error) return 0;
      const now = new Date();
      return (data || []).filter((d: any) => {
        const expiry = d.expires_at || d.valid_to;
        return expiry && new Date(expiry) < now;
      }).length;

    },
  });

  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["vendor-banner-inbox", asset.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lara_inbox")
        .select("*", { count: "exact", head: true })
        .eq("matched_asset_id", asset.id)
        .in("status", ["new", "auto_matched"]);
      if (error) return 0;
      return count || 0;
    },
  });

  const status = deriveVendorStatus({
    id: asset.id,
    compliance_score: asset.compliance_score,
    risk_level: asset.risk_level,
    lifecycle_status: asset.lifecycle_status,
    metadata: asset.metadata,
    expiredDocsCount,
    inboxCount,
  });

  // Innhentingsmetode — Laras anbefaling avhenger av mandat og offentlig fotavtrykk.
  const [sourcing, setSourcing] = useState(() => readSourcingState(asset.id));
  const recommendation = recommendSourcingMethod(
    inferVendorSignals({
      name: asset.name,
      vendorType: asset.vendor_category ?? asset.category,
      criticality: asset.criticality ?? asset.risk_level,
    }).signals,
  );
  const startSourcing = (method: SourcingMethod) => {
    if (method === "vendor_agentic") {
      setInviteOpen(true);
      return;
    }
    const next = { ...sourcing, method, startedAt: new Date().toISOString() };
    setSourcing(next);
    writeSourcingState(asset.id, next);
    toast.success(
      method === "public_harvest"
        ? "Lara kartlegger offentlige kilder"
        : "Forespørsel sendt på e-post",
    );
  };

  const score = asset.compliance_score || 0;

  const md = asset.metadata || {};
  const [inviteOpen, setInviteOpen] = useState(false);
  const criticality = deriveCriticality({ risk_level: asset.risk_level });
  const hostname = (() => {
    if (!asset.url) return null;
    try { return new URL(asset.url).hostname; } catch { return asset.url; }
  })();
  const category = asset.vendor_category || asset.category || null;

  // Verified badge for claimed
  const isClaimed = status.key === "claimed";

  // Maturity sub-label
  const maturityLabel = (() => {
    if (status.key === "claimed") return "oppdatert av leverandør";
    if (status.key === "invited") return "delvis vurdert";
    if (status.key === "draft") return "estimert av Lara";
    return "data fryst";
  })();

  // Qualitative maturity level — mirrors Donut tone
  const maturityLevel = (() => {
    if (score >= 75) return { label: "Høy", cls: "bg-success/10 text-success border-success/20" };
    if (score >= 50) return { label: "Moderat", cls: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Lav", cls: "bg-destructive/10 text-destructive border-destructive/20" };
  })();

  // Context banner (action row)
  const renderContextBanner = () => {
    if (status.key === "invited") {
      const days = typeof md.invitation_days_left === "number" ? md.invitation_days_left : 5;
      const sentDate = md.invitation_sent_label || "14. april";
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[13px] text-foreground/80 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Invitasjon sendt {sentDate}. Lenken utløper om {days} dager.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => toast.success("Påminnelse sendt")}>
              <Bell className="h-3.5 w-3.5" /> Påminnelse
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => toast.success("Lenke kopiert")}>
              <Copy className="h-3.5 w-3.5" /> Kopier lenke
            </Button>
          </div>
        </div>
      );
    }
    if (status.key === "draft") {
      const mapped = md.lara_mapped_at_label || md.lara_mapped_at;

      // Ingen innhenting startet — grunnlaget er ikke etterspurt ennå.
      if (!sourcing.method) {
        const primary = SOURCING_METHOD_META[recommendation.primary];
        return (
          <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 space-y-2">
            <p className="text-[13px] text-foreground/80 flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                {NOT_REQUESTED_LABEL.nb}{" "}
                <span className="text-muted-foreground">{recommendation.rationale.nb}</span>
              </span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" className="gap-1.5 h-8" onClick={() => startSourcing(recommendation.primary)}>
                <Send className="h-3.5 w-3.5" /> {primary.cta.nb}
              </Button>
              {recommendation.alternative && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => startSourcing(recommendation.alternative!)}
                >
                  {SOURCING_METHOD_META[recommendation.alternative].cta.nb}
                </Button>
              )}
            </div>
          </div>
        );
      }

      const method = SOURCING_METHOD_META[sourcing.method];
      const isMapping = sourcing.method === "public_harvest" && !mapped;
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[13px] text-foreground/80 flex items-center gap-2">
            <Sparkles className={cn("h-3.5 w-3.5 text-primary", isMapping && "animate-pulse")} />
            {isMapping ? (
              "Lara kartlegger offentlige kilder…"
            ) : (
              <>
                {method.label.nb} · {method.evidenceLabel.nb}
              </>
            )}
          </p>
          {sourcing.method !== "vendor_agentic" && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setInviteOpen(true)}>
              <Send className="h-3.5 w-3.5" /> Inviter leverandøren
            </Button>
          )}
        </div>
      );
    }
    if (status.key === "claimed") {
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              {t("vendorStatusBanner.claimed.title")}
            </p>
            <p className="text-[12px] text-muted-foreground max-w-xl">
              {t("vendorStatusBanner.claimed.description")}
            </p>
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setInviteOpen(true)}>
            <Send className="h-3.5 w-3.5" />
            {t("vendorStatusBanner.claimed.cta")}
          </Button>
        </div>
      );
    }


    return (
      <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5">
        <p className="text-[13px] text-muted-foreground">Arkivert leverandør – data fryst.</p>
      </div>
    );
  };

  return (
    <>
    <Card variant="flat" className="relative overflow-hidden p-0">
      <div className="flex items-stretch">
        {/* Vertical stripe */}
        <div className={cn("relative w-9 shrink-0", status.stripeBg)}>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.18em] whitespace-nowrap",
              status.stripeText,
            )}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-3 min-w-0">
          {/* Top row: logo + name/meta + donut */}
          <div className="flex items-start gap-4">
            {/* Logo / icon */}
            <div className="shrink-0">
              {asset.logo_url ? (
                <div className="h-11 w-11 rounded-lg overflow-hidden border border-border bg-background">
                  <img src={asset.logo_url} alt={`${asset.name} logo`} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            {/* Name + badges + org meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{asset.name}</h1>
              </div>

              {/* Kritikalitet (objektiv) + Prioritet (subjektiv, valgfri) */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <VendorInlinePillSelect
                  assetId={asset.id}
                  field="criticality"
                  value={asset.criticality ?? asset.risk_level ?? null}
                />
                <VendorInlinePillSelect
                  assetId={asset.id}
                  field="priority"
                  value={asset.priority ?? null}
                />
                {!(asset.criticality || asset.risk_level) && !asset.priority && (
                  <button
                    onClick={() => toast.info("Lara analyserer leverandøren og foreslår kritikalitet…")}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[12px] text-primary hover:bg-primary/10 transition-colors"
                    title="La Lara foreslå kritikalitet basert på det vi vet om leverandøren"
                  >
                    <Sparkles className="h-3 w-3" />
                    Lara foreslår
                  </button>
                )}
              </div>

              {/* Org meta line */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
                {asset.org_number && (
                  <span>
                    <span className="text-muted-foreground/70">Org.nr</span>{" "}
                    <span className="tabular-nums text-foreground/80 font-medium">{asset.org_number}</span>
                  </span>
                )}
                {hostname && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <a href={asset.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>

              {/* Short description about the vendor */}
              {asset.description && (
                <p className="mt-1.5 text-[13px] text-foreground/75 leading-relaxed line-clamp-2">
                  {asset.description}
                </p>
              )}
            </div>

            {/* Modenhet — tekst venstre, donut høyre */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end text-right">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Modenhet</span>
                <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-semibold ${maturityLevel.cls}`}>
                  {maturityLevel.label}
                </span>
                <span className="mt-1 text-[12px] text-muted-foreground italic">{maturityLabel}</span>
              </div>
              <Donut score={score} tone={status.tone} />
            </div>
          </div>

          {/* Action / context banner */}
          {renderContextBanner()}

          {/* Footer: Kontakt hos leverandør · Ansvarlig hos oss */}
          <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Kontakt hos leverandør:</span>
              {asset.contact_person ? (
                <span className="inline-flex items-center gap-1.5 text-foreground/90">
                  <InitialAvatar name={asset.contact_person} color="bg-warning/15 text-warning" />
                  <span className="truncate">{asset.contact_person}</span>
                </span>
              ) : (
                <button
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => toast.info("Åpner kontaktperson-redigering")}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Legg til kontaktperson
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">Tilgang til leverandørmodulen:</span>
              {asset.access_members && asset.access_members.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  {asset.access_members.map((member, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-foreground/90">
                      <InitialAvatar name={member} color="bg-primary/15 text-primary" />
                      <span className="truncate">{member}</span>
                      {idx < asset.access_members!.length - 1 && <span className="text-muted-foreground">·</span>}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Ikke tildelt</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    <InviteVendorDialog
      open={inviteOpen}
      onOpenChange={setInviteOpen}
      vendor={{
        id: asset.id,
        name: asset.name,
        contact_person: asset.contact_person,
        contact_email: asset.contact_email,
        org_number: asset.org_number,
        description: asset.description,
      }}
    />
    </>
  );
}
