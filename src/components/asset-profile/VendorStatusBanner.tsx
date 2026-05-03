import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Copy, Send, Sparkles, ExternalLink, Building2, UserPlus, MessageSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveVendorStatus, deriveCriticality, type VendorStatusMeta } from "@/lib/vendorStatus";

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
    url?: string | null;
    logo_url?: string | null;
    asset_manager?: string | null;
    org_number?: string | null;
  };
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
    <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-semibold", color)}>
      {initials || "?"}
    </span>
  );
}

export function VendorStatusBanner({ asset }: VendorStatusBannerProps) {
  const { data: expiredDocsCount = 0 } = useQuery({
    queryKey: ["vendor-banner-expired-docs", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("expires_at")
        .eq("asset_id", asset.id);
      if (error) return 0;
      const now = new Date();
      return (data || []).filter((d: any) => d.expires_at && new Date(d.expires_at) < now).length;
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
    compliance_score: asset.compliance_score,
    risk_level: asset.risk_level,
    lifecycle_status: asset.lifecycle_status,
    metadata: asset.metadata,
    expiredDocsCount,
    inboxCount,
  });

  const score = asset.compliance_score || 0;
  const md = asset.metadata || {};
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
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[13px] text-foreground/80 flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-warning" />
            Profilen er ikke claimet av leverandøren. Du redigerer på vegne av {asset.name}.
          </p>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => toast.success("Invitasjon sendt til leverandør")}>
            <Send className="h-3.5 w-3.5" /> Inviter leverandøren
          </Button>
        </div>
      );
    }
    if (status.key === "claimed") {
      const claimDate = md.claimed_at_label || "8. mars 2026";
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
          <p className="text-[13px] text-foreground/80">Claimet {claimDate}</p>
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
    <Card variant="flat" className="relative overflow-hidden p-0">
      <div className="flex items-stretch">
        {/* Vertical stripe */}
        <div className={cn("relative w-9 shrink-0", status.stripeBg)}>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap",
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
                {/* Verified badge removed — claimed state is conveyed by the green card design */}
                {criticality && (
                  <Badge variant="outline" className={cn("text-[11px] gap-1 px-2 py-0.5 font-medium", criticality.pillClass)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", criticality.dotClass)} />
                    {criticality.label}
                  </Badge>
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
                {category && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{category}</span>
                  </>
                )}
              </div>
            </div>

            {/* Donut */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Donut score={score} tone={status.tone} />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Modenhet</span>
                <span className="text-[11px] text-muted-foreground italic">{maturityLabel}</span>
              </div>
            </div>
          </div>

          {/* Action / context banner */}
          {renderContextBanner()}

          {/* Footer: Kontakt hos leverandør · Ansvarlig hos oss */}
          <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Kontakt hos leverandør:</span>
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
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Ansvarlig hos oss:</span>
              {asset.asset_manager ? (
                <span className="inline-flex items-center gap-1.5 text-foreground/90">
                  <InitialAvatar name={asset.asset_manager} color="bg-primary/15 text-primary" />
                  <span className="truncate">{asset.asset_manager}</span>
                </span>
              ) : (
                <span className="text-muted-foreground italic">Ikke tildelt</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
