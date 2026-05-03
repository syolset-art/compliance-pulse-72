import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, ShieldCheck, FileText, Mail, Building2,
  Loader2, CheckCircle2, ArrowRight, Link2, Bell, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InviteVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: {
    id: string;
    name: string;
    contact_person?: string | null;
    contact_email?: string | null;
    org_number?: string | null;
    description?: string | null;
  };
}

type Phase = "preparing" | "review" | "sending" | "sent";

interface AgentStep {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
}

const STEPS: AgentStep[] = [
  { key: "context",  icon: Building2, label: "Henter leverandørkontekst", detail: "Org.nr., kontaktperson, kategori og tidligere dialog" },
  { key: "scope",    icon: Brain,     label: "Bestemmer informasjonsbehov", detail: "Velger relevante spørsmål basert på kritikalitet og rammeverk" },
  { key: "draft",    icon: FileText,  label: "Utkaster invitasjon",          detail: "Personlig e-post med engangslenke til Trust Profile" },
  { key: "secure",   icon: ShieldCheck, label: "Genererer sikker claim-lenke", detail: "Engangslenke som utløper om 14 dager" },
];

export function InviteVendorDialog({ open, onOpenChange, vendor }: InviteVendorDialogProps) {
  const [phase, setPhase] = useState<Phase>("preparing");
  const [activeStep, setActiveStep] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const claimLink = useMemo(
    () => `https://trust.lovable.app/claim/${vendor.id.slice(0, 8)}-xyz`,
    [vendor.id],
  );

  // Reset & run agentic preparation when dialog opens
  useEffect(() => {
    if (!open) return;
    setPhase("preparing");
    setActiveStep(0);
    setRecipient(vendor.contact_email || `kontakt@${slugify(vendor.name)}.no`);
    setRecipientName(vendor.contact_person || "Kontaktperson");
    setSubject(`${vendor.name}: Bekreft Trust Profile på ${"din organisasjon"}`);
    setMessage(buildDraft(vendor));

    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setActiveStep(i);
        await wait(650);
      }
      if (cancelled) return;
      setActiveStep(STEPS.length);
      await wait(250);
      if (!cancelled) setPhase("review");
    };
    run();
    return () => { cancelled = true; };
  }, [open, vendor]);

  const handleSend = async () => {
    setPhase("sending");
    await wait(900);
    setPhase("sent");
    toast.success("Invitasjon sendt", { description: `Lara følger opp ${vendor.name} automatisk.` });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        {/* Lara header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent">
          <div className="relative h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className={cn("h-4 w-4 text-primary", phase === "preparing" && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-[15px] font-semibold leading-tight">
                Lara forbereder invitasjon til {vendor.name}
              </DialogTitle>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                Agenten klargjør innhold og en sikker claim-lenke. Du godkjenner før utsendelse.
              </p>
            </DialogHeader>
          </div>
          <PhasePill phase={phase} />
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Agent timeline */}
          <ol className="space-y-2.5 mb-5" aria-label="Lara prosess">
            {STEPS.map((step, idx) => {
              const state: "done" | "active" | "todo" =
                phase === "preparing"
                  ? idx < activeStep ? "done" : idx === activeStep ? "active" : "todo"
                  : "done";
              const Icon = step.icon;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      state === "done" && "bg-success/10 text-success",
                      state === "active" && "bg-primary/10 text-primary",
                      state === "todo" && "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {state === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : state === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className={cn(
                      "text-[14px] font-medium",
                      state === "todo" ? "text-muted-foreground" : "text-foreground",
                    )}>
                      {step.label}
                    </div>
                    <div className="text-[12.5px] text-muted-foreground leading-snug">
                      {step.detail}
                    </div>
                  </div>
                  {state === "done" && (
                    <span className="text-[11px] text-muted-foreground shrink-0 mt-1">Ferdig</span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Review form (after preparation) */}
          {(phase === "review" || phase === "sending") && (
            <div className="space-y-4 rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Foreslått av Lara
                </Badge>
                <span className="text-[12px] text-muted-foreground">Du kan justere alt før sending</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-[12.5px]">Mottaker</Label>
                  <Input
                    id="invite-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Navn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-[12.5px]">E-postadresse</Label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invite-email"
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-subject" className="text-[12.5px]">Emne</Label>
                <Input
                  id="invite-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-message" className="text-[12.5px]">Melding</Label>
                <Textarea
                  id="invite-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  className="resize-none text-[13.5px] leading-relaxed"
                />
              </div>

              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[12.5px] text-foreground/80 truncate">
                  Sikker claim-lenke: <span className="font-mono">{claimLink}</span>
                </span>
                <Badge variant="outline" className="ml-auto text-[10.5px]">Utløper om 14 dager</Badge>
              </div>

              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Bell className="h-3.5 w-3.5 text-primary" />
                Lara sender automatisk påminnelse etter 5 og 10 dager hvis leverandøren ikke svarer.
              </div>
            </div>
          )}

          {/* Sent confirmation */}
          {phase === "sent" && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-[15px] font-semibold">Invitasjon sendt til {recipientName}</div>
                <div className="text-[13px] text-muted-foreground mt-1">
                  Lara overvåker innboksen og oppdaterer profilen automatisk når leverandøren svarer.
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {recipient}
                <span className="opacity-40">·</span>
                <Bell className="h-3.5 w-3.5" /> Påminnelser planlagt
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Drevet av Lara · agentisk arbeidsflyt
          </span>
          <div className="flex items-center gap-2">
            {phase === "review" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>Avbryt</Button>
                <Button size="sm" className="gap-1.5" onClick={handleSend}>
                  <Send className="h-3.5 w-3.5" /> Godkjenn og send
                </Button>
              </>
            )}
            {phase === "preparing" && (
              <Button variant="ghost" size="sm" onClick={handleClose}>Avbryt</Button>
            )}
            {phase === "sending" && (
              <Button size="sm" disabled className="gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sender…
              </Button>
            )}
            {phase === "sent" && (
              <Button size="sm" className="gap-1.5" onClick={handleClose}>
                Ferdig <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhasePill({ phase }: { phase: Phase }) {
  const map: Record<Phase, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    preparing: { label: "Forbereder",  cls: "bg-primary/10 text-primary border-primary/20",     icon: Loader2 },
    review:    { label: "Til gjennomsyn", cls: "bg-warning/10 text-warning border-warning/30", icon: FileText },
    sending:   { label: "Sender",       cls: "bg-primary/10 text-primary border-primary/20",   icon: Send },
    sent:      { label: "Sendt",        cls: "bg-success/10 text-success border-success/30",   icon: CheckCircle2 },
  };
  const { label, cls, icon: Icon } = map[phase];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium shrink-0", cls)}>
      <Icon className={cn("h-3 w-3", phase === "preparing" && "animate-spin")} />
      {label}
    </span>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "leverandor";
}

function buildDraft(vendor: { name: string; description?: string | null }) {
  const what = vendor.description?.trim() || "tjenester til vår organisasjon";
  return [
    `Hei,`,
    ``,
    `Vi bruker en Trust Profile for å holde dokumentasjonen om ${vendor.name} oppdatert. Profilen inneholder allerede et utkast basert på offentlig tilgjengelig informasjon, og dere leverer i dag ${what}.`,
    ``,
    `Vi vil gjerne at dere claimer profilen slik at dere selv kan verifisere og vedlikeholde opplysningene (sikkerhet, personvern, sertifiseringer og kontaktpersoner). Det tar typisk 10–15 minutter.`,
    ``,
    `Lenken under er personlig og utløper om 14 dager.`,
    ``,
    `Takk for samarbeidet.`,
  ].join("\n");
}
