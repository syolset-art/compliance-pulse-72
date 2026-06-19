import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ExternalLink,
  UserPlus,
  EyeOff,
  FileBadge,
  FileText,
  Check,
  AlertCircle,
  Lock,
  ShieldCheck,
  Activity,
  Users,
  Sparkles,
  KeyRound,
  Info,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { SendTrustHandoverEmailDialog } from "./SendTrustHandoverEmailDialog";
import { PartnerEvidenceSection } from "./PartnerEvidenceSection";
import { ControlAreaBreakdownDrawer } from "./ControlAreaBreakdownDrawer";
import { toast } from "sonner";
import {
  CONTROL_AREAS,
  AREA_WEIGHTS,
  calculateTrustScore,
  type ControlAreaKey,
} from "@/lib/controlAreas";
import { getActiveControlPointsByArea } from "@/lib/controlAreaRequirements";

type ControlDomain = {
  key: ControlAreaKey;
  name: string;
  description: string;
  /** Demo-modenhet 0-4 — i produksjon avledet fra msp_customer_assessments. */
  level: number;
  source: "lara" | "self";
};

// Demo-modenhet per område (samme verdier som tidligere — viser variasjon).
const DEMO_LEVELS: Record<ControlAreaKey, { level: number; source: "lara" | "self" }> = {
  governance: { level: 3, source: "lara" },
  operations: { level: 2, source: "self" },
  identityAccess: { level: 2, source: "lara" },
  vendor: { level: 2, source: "lara" },
  privacy: { level: 3, source: "lara" },
};

// Rekkefølge: governance → operations → identityAccess → vendor → privacy
// Personvern (privacy) plasseres sist slik at den får full bredde i 2×2-grid.
const AREA_ORDER: ControlAreaKey[] = [
  "governance",
  "operations",
  "identityAccess",
  "vendor",
  "privacy",
];

function levelTone(level: number) {
  const pct = (level / 4) * 100;
  if (pct >= 75) return { bar: "bg-success", text: "text-success", badge: "bg-success/10 text-success border-success/30" };
  if (pct >= 50) return { bar: "bg-warning", text: "text-warning", badge: "bg-warning/10 text-warning border-warning/30" };
  return { bar: "bg-destructive", text: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/30" };
}

interface Props {
  customerId?: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  /** Aktiverte regelverk for kunden — driver kontrollpunktene per område. */
  activeFrameworkIds?: string[];
}


const certifications = [
  { name: "ISO 27001:2022", meta: "Gyldig til 14. mars 2027 · BSI", status: "active" as const },
  { name: "PCI DSS v4.0", meta: "Nivå 1 · Gyldig til 8. juli 2026", status: "active" as const },
  { name: "SOC 2 Type II", meta: "Utløpt 31. desember 2025", status: "expired" as const },
];

const policies = [
  { name: "Personvernerklæring", published: true },
  { name: "Informasjonssikkerhetspolicy", published: true },
  { name: "Hendelseshåndtering", published: true },
  { name: "Leverandørstyring", published: false },
];

const accessRequests = [
  { initials: "SB", color: "bg-blue-100 text-blue-700", title: "Sparebank 1 ba om SOC 2-rapport", meta: "22. april 2026 · Avventer svar", status: "open" as const },
  { initials: "VP", color: "bg-purple-100 text-purple-700", title: "Vipps MobilePay ba om personvernerklæring", meta: "10. april 2026 · Besvart", status: "closed" as const },
];

export function MSPCustomerTrustProfileCard({
  customerId,
  customerName = "Kunden",
  contactName = "Truls",
  contactEmail,
  activeFrameworkIds = [],
}: Props) {
  // MVP: profilen er ikke claimet/publisert ennå
  const isPublished = false;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [openArea, setOpenArea] = useState<ControlAreaKey | null>(null);
  const [showBannerDetails, setShowBannerDetails] = useState(false);

  // Bygg domeneliste fra de kanoniske 5 kontrollområdene
  const controlDomains: ControlDomain[] = useMemo(
    () =>
      AREA_ORDER.map((key) => {
        const def = CONTROL_AREAS.find((a) => a.key === key)!;
        const demo = DEMO_LEVELS[key];
        return {
          key,
          name: def.labelNb,
          description: def.descriptionNb,
          level: demo.level,
          source: demo.source,
        };
      }),
    []
  );

  // Antall kontrollpunkter per område fra aktive regelverk
  const pointsByArea = useMemo(
    () => getActiveControlPointsByArea(activeFrameworkIds),
    [activeFrameworkIds]
  );

  // Områdescore: modenhet/4 × 100 (per-punkt-vekt er likt 1.0 i MVP)
  const areaScores: Partial<Record<ControlAreaKey, number>> = useMemo(() => {
    const out: Partial<Record<ControlAreaKey, number>> = {};
    for (const d of controlDomains) {
      out[d.key] = Math.round((d.level / 4) * 100);
    }
    return out;
  }, [controlDomains]);

  const trustScore = useMemo(() => calculateTrustScore(areaScores), [areaScores]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">Kundens visningskort utad</h2>
            <span className="text-muted-foreground/30 text-xs">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Ikke publisert
            </span>
            <span className="text-muted-foreground/30 text-xs">•</span>
            <button
              onClick={() => setShowBannerDetails(!showBannerDetails)}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 focus:outline-none"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
              {invited ? `Invitasjon sendt til ${contactName}` : "Ikke aktivert"}
              <span className="text-muted-foreground/60">({showBannerDetails ? "Skjul info" : "Les mer / Inviter"})</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{customerName} · Trust Profile</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isPublished}
                    className="gap-1.5 h-8 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPublished ? (
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isPublished ? "Se offentlig visning" : "Visningskort"}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isPublished && (
                <TooltipContent side="bottom" className="max-w-[260px] text-sm">
                  Profilen blir offentlig først når kunden har aktivert profilen og publisert den selv.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Aktiverings-banner (kun synlig når utvidet) */}
      {showBannerDetails && (
        <Card className={`p-3.5 animate-in fade-in duration-200 ${invited ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              {invited ? (
                <Check className="h-5 w-5 text-success mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <UserPlus className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <div className="space-y-0.5 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {invited ? `Invitasjon sendt til ${contactName}` : "Kunden har ikke aktivert profilen ennå"}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed max-w-3xl">
                  {invited ? (
                    "Du kan bygge og redigere denne Trust Profilen, og du fortsetter å administrere den også etter at den er publisert. Men den kan ikke publiseres herfra. Først når kunden claimer profilen, blir den én unik Trust Profile som kunden eier - og publisering kan ikke skje før det."
                  ) : (
                    "Du administrerer denne Trust Profilen på vegne av kunden, også etter publisering. Publisering låses opp når kunden claimer profilen - da blir den én unik profil som kunden eier. Inviter kontaktpersonen for å fullføre."
                  )}
                </p>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center self-end sm:self-center">
              {!invited ? (
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Inviter til å aktivere
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setInviteOpen(true)}
                >
                  Send påminnelse
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}


      {/* Kontrollområder per regelverk */}
      {(() => {
        const scoreTone = levelTone(trustScore >= 75 ? 4 : trustScore >= 50 ? 2 : 1);
        const r = 26;
        const c = 2 * Math.PI * r;
        const dash = (trustScore / 100) * c;
        return (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Kontrollområder per regelverk</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Modenhet 0–4 · 5 kontrollområder · vektet snitt
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Trust score</p>
                  <p className="text-sm text-muted-foreground">Vektet av områdene</p>
                </div>
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90" aria-hidden="true">
                    <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r={r}
                      className={`fill-none ${scoreTone.text}`}
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${c}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-semibold ${scoreTone.text}`}>{trustScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {controlDomains.map((d, idx) => {
                const tone = levelTone(d.level);
                const pct = (d.level / 4) * 100;
                const isLastOdd = idx === controlDomains.length - 1 && controlDomains.length % 2 === 1;
                const def = CONTROL_AREAS.find((a) => a.key === d.key)!;
                const Icon = def.icon;
                const pointCount = pointsByArea[d.key]?.total ?? 0;
                const fwCount = pointsByArea[d.key]
                  ? Object.keys(pointsByArea[d.key].byFramework).length
                  : 0;
                const weightPct = Math.round(AREA_WEIGHTS[d.key] * 100);
                return (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => setOpenArea(d.key)}
                    className={`text-left rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors group ${isLastOdd ? "sm:col-span-2" : ""}`}
                    aria-label={`Se hvordan ${d.name} beregnes`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-foreground/70 shrink-0" aria-hidden="true" />
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {d.name}
                        </p>
                        {d.source === "lara" ? (
                          <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            Lara
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-muted text-foreground/80 border-border">
                            Selvrapportert
                          </Badge>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${tone.text} shrink-0`}>
                        {d.level}<span className="text-muted-foreground font-normal">/4</span>
                      </span>
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed mb-2">{d.description}</p>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${tone.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Info className="h-3 w-3" aria-hidden="true" />
                        {pointCount > 0
                          ? `${pointCount} kontrollpunkter fra ${fwCount} regelverk`
                          : "Ingen aktive regelverk dekker dette området"}
                        {" · "}
                        Vekt {weightPct}%
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })()}

      <ControlAreaBreakdownDrawer
        open={openArea !== null}
        onOpenChange={(o) => { if (!o) setOpenArea(null); }}
        area={openArea}
        areaScore={openArea ? (areaScores[openArea] ?? 0) : 0}
        activeFrameworkIds={activeFrameworkIds}
      />


      {/* Ressurser */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Ressurser</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" 
              onClick={() => setEvidenceOpen(true)}
              title="Last opp partner-bevis"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">{certifications.length + policies.filter(p => p.published).length} publisert · {policies.filter(p => !p.published).length} mangler</span>
        </div>

        {/* Sertifiseringer og attesteringer */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Sertifiseringer og attesteringer</p>
          {certifications.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${c.status === "active" ? "bg-success/10" : "bg-destructive/10"}`}>
                <FileBadge className={`h-4 w-4 ${c.status === "active" ? "text-success" : "text-destructive"}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-sm text-muted-foreground truncate">{c.meta}</p>
              </div>
              <Badge variant="outline" className={c.status === "active"
                ? "text-xs px-2 py-0.5 bg-success/10 text-success border-success/30"
                : "text-xs px-2 py-0.5 bg-destructive/10 text-destructive border-destructive/30"}>
                {c.status === "active" ? "Aktiv" : "Utløpt"}
              </Badge>
            </div>
          ))}
        </div>

        {/* POLICYER */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">POLICYER</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {policies.map(p => (
              <div key={p.name} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${p.published ? "border-border/60" : "border-dashed border-border bg-muted/20"}`}>
                <FileText className={`h-4 w-4 shrink-0 ${p.published ? "text-foreground/70" : "text-muted-foreground/60"}`} aria-hidden="true" />
                <span className={`text-sm flex-1 truncate ${p.published ? "text-foreground" : "text-foreground/70"}`}>{p.name}</span>
                {p.published ? (
                  <Check className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <span className="text-sm text-muted-foreground">Mangler</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Access requests */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Innsynsforespørsler fra tredjepart</h3>
          <span className="text-sm text-muted-foreground">Siste 90 dager</span>
        </div>
        <div className="space-y-2">
          {accessRequests.map(r => (
            <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${r.color}`}>
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                <p className="text-sm text-muted-foreground truncate">{r.meta}</p>
              </div>
              <Badge variant="outline" className={r.status === "open"
                ? "text-xs px-2 py-0.5 bg-warning/10 text-warning border-warning/30"
                : "text-xs px-2 py-0.5 bg-success/10 text-success border-success/30"}>
                {r.status === "open" ? "Åpen" : "Lukket"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <SendTrustHandoverEmailDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        recipientEmail={contactEmail}
        recipientName={contactName}
        customerName={customerName}
        onSend={() => {
          setInviteOpen(false);
          setInvited(true);
          toast.success("Invitasjon sendt", {
            description: `${contactName} har fått en e-post med lenke for å aktivere Trust Profile.`,
          });
        }}
      />
    </div>
  );
}
