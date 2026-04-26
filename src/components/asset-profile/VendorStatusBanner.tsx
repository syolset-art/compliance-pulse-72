import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Copy, Send, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveVendorStatus, type VendorStatusMeta } from "@/lib/vendorStatus";

interface VendorStatusBannerProps {
  asset: {
    id: string;
    name: string;
    compliance_score?: number | null;
    risk_level?: string | null;
    lifecycle_status?: string | null;
    metadata?: any;
    contact_person?: string | null;
    updated_at?: string | null;
    vendor_category?: string | null;
    category?: string | null;
  };
}

const CRITICALITY: Record<string, { label: string; dot: string; text: string; pill: string }> = {
  high: { label: "Høy kritikalitet", dot: "bg-destructive", text: "text-destructive", pill: "bg-destructive/10 border-destructive/20" },
  medium: { label: "Middels kritikalitet", dot: "bg-warning", text: "text-warning", pill: "bg-warning/10 border-warning/20" },
  low: { label: "Lav kritikalitet", dot: "bg-success", text: "text-success", pill: "bg-success/10 border-success/20" },
};

function Donut({ score, tone }: { score: number; tone: VendorStatusMeta["tone"] }) {
  const has = score > 0;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const strokeColor =
    tone === "success" ? "hsl(var(--success))" :
    tone === "destructive" ? "hsl(var(--destructive))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.3)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        {has && (
          <circle
            cx="32" cy="32" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        )}
      </svg>
      <span
        className={cn(
          "absolute text-[13px] font-semibold tabular-nums leading-none",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
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

export function VendorStatusBanner({ asset }: VendorStatusBannerProps) {
  // Hent utløpte dokumenter (matcher logikken i listevisningen)
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
  const criticality = CRITICALITY[(asset.risk_level || "medium").toLowerCase()] || CRITICALITY.medium;

  const stripeBg =
    status.tone === "success" ? "bg-success" :
    status.tone === "destructive" ? "bg-destructive" :
    status.tone === "warning" ? "bg-warning" :
    status.tone === "primary" ? "bg-primary" : "bg-muted";

  const stripeLabelText =
    status.key === "draft" ? "LEVERANDØR · UTKAST" :
    status.key === "invited" ? "LEVERANDØR · INVITERT" :
    status.key === "approved" ? "LEVERANDØR · GODKJENT" :
    status.key === "needs_action" ? "LEVERANDØR · KREVER TILTAK" :
    "LEVERANDØR · OPPFØLGING";

  // Kontekstbanner basert på status
  const renderContext = () => {
    if (status.key === "needs_action") {
      const parts: string[] = [];
      const openGaps = md.open_gaps ?? 2;
      if (openGaps > 0) parts.push(`${openGaps} åpne gap`);
      if (md.dpa_expired_on) parts.push(`DPA utløpt ${md.dpa_expired_on}`);
      if (parts.length === 0 && expiredDocsCount > 0) parts.push(`${expiredDocsCount} utløpte dokument`);
      return (
        <div className="flex items-center gap-1.5 text-[13px] text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{parts.join(" · ") || "Manglende dokumentasjon"}</span>
        </div>
      );
    }
    if (status.key === "invited") {
      const days = typeof md.invitation_days_left === "number" ? md.invitation_days_left : 7;
      return (
        <p className="text-[13px] text-muted-foreground">
          Invitasjon sendt – utløper om {days} dager. Venter på respons fra leverandør.
        </p>
      );
    }
    if (status.key === "draft") {
      if (inboxCount > 0) {
        return (
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[13px] gap-1 px-2 py-0.5 w-fit">
            <Sparkles className="h-3 w-3 animate-pulse" />
            Lara kartlegger… modenhet estimert av Mynder
          </Badge>
        );
      }
      return <p className="text-[13px] text-muted-foreground">Utkast – ikke krevd inn fra leverandøren ennå.</p>;
    }
    if (status.key === "approved") {
      return <p className="text-[13px] text-muted-foreground">Profil eid og oppdatert av leverandør.</p>;
    }
    return <p className="text-[13px] text-muted-foreground">Under oppfølging – pågående arbeid med gap.</p>;
  };

  const renderActions = () => {
    if (status.key === "invited") {
      return (
        <>
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => toast.success("Påminnelse sendt")}>
            <Bell className="h-3.5 w-3.5" /> Påminnelse
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => toast.success("Lenke kopiert")}>
            <Copy className="h-3.5 w-3.5" /> Kopier lenke
          </Button>
        </>
      );
    }
    if (status.key === "draft") {
      return (
        <Button size="sm" className="gap-1.5"
          onClick={() => toast.success("Invitasjon sendt til leverandør")}>
          <Send className="h-3.5 w-3.5" /> Inviter leverandør
        </Button>
      );
    }
    if (status.key === "needs_action") {
      return (
        <Button size="sm" variant="destructive" className="gap-1.5">
          Åpne gap <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );
    }
    return null;
  };

  return (
    <Card variant="flat" className="relative overflow-hidden p-0">
      <div className="flex items-stretch">
        {/* Vertikal stripe med rotert label */}
        <div className={cn("relative w-9 shrink-0", stripeBg)}>
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-white whitespace-nowrap"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {stripeLabelText}
          </span>
        </div>

        <div className="flex-1 px-5 py-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-[12px] gap-1 px-2 py-0.5 font-medium", status.pillClass, status.textClass)}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                {status.label}
              </Badge>
              <Badge variant="outline" className={cn("text-[12px] gap-1 px-2 py-0.5 font-medium", criticality.pill, criticality.text)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", criticality.dot)} />
                {criticality.label}
              </Badge>
            </div>
            <div className="mt-2">{renderContext()}</div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-1 shrink-0">
            <Donut score={score} tone={status.tone} />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Modenhet</span>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {renderActions()}
          </div>
        </div>
      </div>
    </Card>
  );
}
