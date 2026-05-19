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
import { toast } from "sonner";

interface Props {
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
  customerName = "Kunden",
  contactName = "Truls",
  contactEmail,
}: Props) {
  // MVP: profilen er ikke claimet/publisert ennå
  const isPublished = false;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{customerName} · Trust Profile</p>
          <h2 className="text-lg font-semibold text-foreground">Kundens visningskort utad</h2>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isPublished}
                  className="gap-1.5 h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublished ? (
                    <ExternalLink className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {isPublished ? "Se offentlig visning" : "Ikke publisert ennå"}
                </Button>
              </span>
            </TooltipTrigger>
            {!isPublished && (
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                Profilen blir offentlig først når kunden har overtatt (claimet) profilen og publisert den selv.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Claim banner */}
      <Card className={`p-4 space-y-3 ${invited ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-start gap-2.5">
          {invited ? (
            <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
          ) : (
            <UserPlus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          )}
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {invited ? `Invitasjon sendt til ${contactName}` : "Profilen er ikke claimet av kunden"}
            </p>
            <p className="text-[13px] text-muted-foreground leading-snug">
              {invited
                ? `${contactName} har fått en e-post med en sikker lenke for å overta og signere profilen. Du får varsel når det er gjort. Inntil da kan du fortsatt redigere innholdet.`
                : `Du administrerer profilen på vegne av ${customerName}. Når kunden claimer profilen tar de over redigering — du beholder innsynet, men kan ikke lenger endre innhold direkte.`}
            </p>
          </div>
        </div>
        {!invited && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Inviter {contactName} til å claime
            </Button>
          </div>
        )}
        {invited && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setInviteOpen(true)}
          >
            Send påminnelse
          </Button>
        )}
      </Card>


      {/* Kontrollpunkter — 4 kjernedomener */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Kontrollpunkter</h3>
          <span className="text-[11px] text-muted-foreground">Modenhet 0–4 · 4 kjernedomener</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {controlDomains.map(d => {
            const tone = levelTone(d.level);
            const pct = (d.level / 4) * 100;
            const r = 26;
            const c = 2 * Math.PI * r;
            const dash = (pct / 100) * c;
            return (
              <div key={d.key} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                    <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r={r}
                      className={`fill-none ${tone.text}`}
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${c}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className={`text-base font-semibold ${tone.text}`}>{d.level}</span>
                    <span className="text-[9px] text-muted-foreground">/ 4</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <d.Icon className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                    <p className="text-[13px] font-medium text-foreground truncate">{d.name}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{d.description}</p>
                  {d.source === "lara" ? (
                    <Badge variant="outline" className="mt-1.5 text-[10px] gap-1 px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                      <Sparkles className="h-2.5 w-2.5" />
                      Lara
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border">
                      Selvrapportert
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Dokumenter og bevis */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Dokumenter og bevis</h3>
          <span className="text-[11px] text-muted-foreground">{certifications.length + policies.filter(p => p.published).length} publisert · {policies.filter(p => !p.published).length} mangler</span>
        </div>

        {/* Sertifiseringer og attesteringer */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Sertifiseringer og attesteringer</p>
          {certifications.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${c.status === "active" ? "bg-success/10" : "bg-destructive/10"}`}>
                <FileBadge className={`h-4 w-4 ${c.status === "active" ? "text-success" : "text-destructive"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.meta}</p>
              </div>
              <Badge variant="outline" className={c.status === "active"
                ? "text-[10px] bg-success/10 text-success border-success/30"
                : "text-[10px] bg-destructive/10 text-destructive border-destructive/30"}>
                {c.status === "active" ? "Aktiv" : "Utløpt"}
              </Badge>
            </div>
          ))}
        </div>

        {/* Policyer og dokumenter */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Policyer og dokumenter</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {policies.map(p => (
              <div key={p.name} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${p.published ? "border-border/60" : "border-dashed border-border bg-muted/20"}`}>
                <FileText className={`h-3.5 w-3.5 shrink-0 ${p.published ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                <span className={`text-[13px] flex-1 truncate ${p.published ? "text-foreground" : "text-muted-foreground"}`}>{p.name}</span>
                {p.published ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">Mangler</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Access requests */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Innsynsforespørsler fra tredjepart</h3>
          <span className="text-[11px] text-muted-foreground">Siste 90 dager</span>
        </div>
        <div className="space-y-2">
          {accessRequests.map(r => (
            <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${r.color}`}>
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{r.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.meta}</p>
              </div>
              <Badge variant="outline" className={r.status === "open"
                ? "text-[10px] bg-warning/10 text-warning border-warning/30"
                : "text-[10px] bg-success/10 text-success border-success/30"}>
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
            description: `${contactName} har fått en e-post med lenke for å claime Trust Profile.`,
          });
        }}
      />
    </div>
  );
}
