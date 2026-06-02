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
  Upload,
} from "lucide-react";

type ControlDomain = {
  key: string;
  name: string;
  description: string;
  level: number; // 0-4
  source: "lara" | "self";
  Icon: typeof ShieldCheck;
};

const controlDomains: ControlDomain[] = [
  { key: "governance", name: "Styring", description: "Policy, roller og ledelsesforankring", level: 3, source: "lara", Icon: ShieldCheck },
  { key: "operations", name: "Drift og sikkerhet", description: "Tilgang, logging, hendelseshåndtering", level: 4, source: "self", Icon: Activity },
  { key: "privacy", name: "Personvern", description: "GDPR-etterlevelse og datahåndtering", level: 2, source: "lara", Icon: Lock },
  { key: "third_party", name: "Tredjepart", description: "Leverandørstyring og verdikjede", level: 3, source: "lara", Icon: Users },
];

function levelTone(level: number) {
  const pct = (level / 4) * 100;
  if (pct >= 75) return { bar: "bg-success", text: "text-success", badge: "bg-success/10 text-success border-success/30" };
  if (pct >= 50) return { bar: "bg-warning", text: "text-warning", badge: "bg-warning/10 text-warning border-warning/30" };
  return { bar: "bg-destructive", text: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/30" };
}

import { useState } from "react";
import { SendTrustHandoverEmailDialog } from "./SendTrustHandoverEmailDialog";
import { PartnerEvidenceSection } from "./PartnerEvidenceSection";
import { toast } from "sonner";

interface Props {
  customerId?: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
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
}: Props) {
  // MVP: profilen er ikke claimet/publisert ennå
  const isPublished = false;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{customerName} · Trust Profile</p>
          <h2 className="text-xl font-semibold text-foreground">Kundens visningskort utad</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {customerId && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-9 text-sm"
              onClick={() => setEvidenceOpen(true)}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Last opp partner-bevis
            </Button>
          )}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isPublished}
                    className="gap-1.5 h-9 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPublished ? (
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isPublished ? "Se offentlig visning" : "Ikke publisert ennå"}
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

      {/* Aktiverings-banner */}
      <Card className={`p-4 space-y-3 ${invited ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-start gap-2.5">
          {invited ? (
            <Check className="h-5 w-5 text-success mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <UserPlus className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <div className="space-y-1 flex-1">
            <p className="text-base font-semibold text-foreground">
              {invited ? `Invitasjon sendt til ${contactName}` : "Kunden har ikke aktivert profilen ennå"}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {invited
                ? `${contactName} har fått en e-post med en sikker lenke for å aktivere og signere profilen. Du får varsel når det er gjort. Inntil da kan du fortsatt redigere innholdet.`
                : `Du administrerer profilen på vegne av ${customerName}. Når kunden aktiverer profilen tar de over redigering — du beholder innsynet, men kan ikke lenger endre innhold direkte.`}
            </p>
          </div>
        </div>
        {!invited && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-9 text-sm gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Inviter {contactName} til å aktivere
            </Button>
          </div>
        )}
        {invited && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm"
            onClick={() => setInviteOpen(true)}
          >
            Send påminnelse
          </Button>
        )}
      </Card>


      {/* Kontrollområder per regelverk */}
      {(() => {
        const totalLevel = controlDomains.reduce((s, d) => s + d.level, 0);
        const maxLevel = controlDomains.length * 4;
        const trustScore = Math.round((totalLevel / maxLevel) * 100);
        const scoreTone = levelTone(trustScore >= 75 ? 4 : trustScore >= 50 ? 2 : 1);
        const r = 26;
        const c = 2 * Math.PI * r;
        const dash = (trustScore / 100) * c;
        return (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Kontrollområder per regelverk</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Modenhet 0–4 · 4 kjernedomener</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Trust score</p>
                  <p className="text-sm text-muted-foreground">Snittet av områdene</p>
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
            <div className="space-y-2.5">
              {controlDomains.map(d => {
                const tone = levelTone(d.level);
                const pct = (d.level / 4) * 100;
                return (
                  <div key={d.key} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <d.Icon className="h-4 w-4 text-foreground/70 shrink-0" aria-hidden="true" />
                        <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
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
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Partner-bevis — opplastet av MSP */}
      {customerId && (
        <PartnerEvidenceSection customerId={customerId} />
      )}

      {/* Dokumenter og bevis */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Dokumenter og bevis</h3>
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

        {/* Policyer og dokumenter */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Policyer og dokumenter</p>
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
