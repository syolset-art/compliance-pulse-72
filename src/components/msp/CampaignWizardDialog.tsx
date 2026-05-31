import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Users,
  Mail,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Tag,
  Shield,
  AlertTriangle,
  Activity,
  Crown,
  UserPlus,
} from "lucide-react";
import {
  CAMPAIGN_SEGMENTS,
  SEGMENT_CATEGORY_LABEL,
  DEMO_CAMPAIGN_CUSTOMERS,
  applySegments,
  applySegmentsWithBaseline,
  type CampaignCustomer,
  type CampaignSegment,
} from "@/lib/campaignSegments";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";

type CampaignFocus = "framework" | "maturity" | "service";

const FOCUS_OPTIONS: {
  id: CampaignFocus;
  label: string;
  description: string;
  icon: typeof Shield;
  recommended?: boolean;
}[] = [
  {
    id: "framework",
    label: "Regelverk-gap",
    description: "NIS2, ISO 27001, GDPR, åpenhetsloven, AI Act — kunder som mangler dekning.",
    icon: Shield,
    recommended: true,
  },
  {
    id: "maturity",
    label: "Modenhet og risiko",
    description: "Kunder med lav modenhet eller høy risiko avledet fra Mynder-data.",
    icon: AlertTriangle,
  },
  {
    id: "service",
    label: "Tjeneste-gap",
    description: "Kunder som mangler vCISO, ingen aktiv leveranse, eller Mynder-moduler.",
    icon: Tag,
  },
];

const FOCUS_TO_CATEGORIES: Record<CampaignFocus, CampaignSegment["category"][]> = {
  framework: ["framework"],
  maturity: ["maturity"],
  service: ["service", "product"],
};

export type CampaignKind = "message" | "offer" | "reminder" | "claim";

export interface CampaignDraft {
  name: string;
  kind: CampaignKind;
  serviceId?: string;
  subject: string;
  body: string;
  recipients: CampaignCustomer[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSend: (draft: CampaignDraft) => void;
}

const CATEGORY_ICON: Record<CampaignSegment["category"], typeof Shield> = {
  framework: Shield,
  maturity: AlertTriangle,
  service: Tag,
  activity: Activity,
  criticality: Crown,
  product: Sparkles,
};

const KIND_OPTIONS: { id: CampaignKind; label: string; hint: string; icon: typeof Mail }[] = [
  {
    id: "message",
    label: "Kampanje-melding",
    hint: "Informativ — ingen pris. Egnet for varsler om regelverksendringer.",
    icon: Mail,
  },
  {
    id: "offer",
    label: "Tilbud",
    hint: "Knytt til en tjeneste fra katalogen — pris og sjekkliste arves.",
    icon: Tag,
  },
  {
    id: "reminder",
    label: "Påminnelse / oppfølging",
    hint: "Kort, vennlig oppfølging — egnet for kunder som ikke har svart.",
    icon: Sparkles,
  },
  {
    id: "claim",
    label: "Inviter til å aktivere Trust-profil",
    hint: "Be kunden aktivere og signere sin egen Trust-profil med sikker lenke.",
    icon: UserPlus,
  },
];

export function CampaignWizardDialog({ open, onOpenChange, onSend }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [focus, setFocus] = useState<CampaignFocus | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [combine, setCombine] = useState<"and" | "or">("or");
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [kind, setKind] = useState<CampaignKind>("offer");
  const [serviceId, setServiceId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const segmentSplit = useMemo(
    () => applySegmentsWithBaseline(DEMO_CAMPAIGN_CUSTOMERS, selectedSegments, combine),
    [selectedSegments, combine],
  );

  // Default: bare bekreftede treff er mottakere. Mulige (uten baseline) må aktivt
  // hukes av brukeren via overrides[id] === true.
  const recipients = useMemo(() => {
    const confirmed = segmentSplit.confirmed.filter((c) => manualOverrides[c.id] !== false);
    const optedIn = segmentSplit.possible.filter((c) => manualOverrides[c.id] === true);
    return [...confirmed, ...optedIn];
  }, [segmentSplit, manualOverrides]);

  const selectedService: PartnerService | undefined = useMemo(
    () => PARTNER_SERVICES.find((s) => s.id === serviceId),
    [serviceId],
  );

  const reset = () => {
    setStep(1);
    setFocus(null);
    setSelectedSegments([]);
    setManualOverrides({});
    setName("");
    setKind("offer");
    setServiceId("");
    setSubject("");
    setBody("");
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // Lara genererer utkast basert på segment + kind
  const generateDraft = () => {
    const segLabels = CAMPAIGN_SEGMENTS.filter((s) => selectedSegments.includes(s.id))
      .map((s) => s.label.toLowerCase())
      .join(", ");
    const mentionsNis2 = /nis2/i.test(segLabels);
    const topicLabel = segLabels || "endringer i regelverket";
    const auto =
      kind === "claim"
        ? {
            name: name || `Inviter til Trust-profil — ${segLabels || "alle kunder"}`,
            subject: `Trust-profilen for {{kunde}} er klar — bekreft og publiser`,
            body:
              `Hei {{kontaktperson}},\n\n` +
              `Vi har satt opp en Trust-profil for {{kunde}} — med sertifiseringer, policyer og dokumentasjon samlet på ett sted. ` +
              `Profilen ligger nå klar til at dere overtar eierskapet og publiserer den selv.\n\n` +
              `Det gir dere:\n` +
              `• Full kontroll over hva som vises utad\n` +
              `• Et profesjonelt svar på innsynsforespørsler fra kunder og partnere\n` +
              `• En offentlig Trust-side dere kan dele i salg og anbud\n\n` +
              `Det tar under 2 minutter å bekrefte og signere. Vi følger opp og hjelper dere videre.\n\n` +
              `Mvh\n{{partner}}`,
          }
        : kind === "offer" && selectedService
          ? {
              name: name || `${selectedService.name} — kampanje`,
              subject: `Forslag til {{kunde}}: ${selectedService.name}`,
              body:
                `Hei {{kontaktperson}},\n\n` +
                `Basert på vår siste gjennomgang av {{kunde}} ${segLabels ? `(${segLabels})` : ""} anbefaler vi at vi setter i gang med "${selectedService.name}".\n\n` +
                `Hva leveransen omfatter:\n${selectedService.description}\n\n` +
                `Pris: ${selectedService.price ? `${selectedService.price.toLocaleString("nb-NO")} kr` : selectedService.priceNote || "etter avtale"}.\n` +
                `Oppstart: innen 2 uker fra bestilling.\n\n` +
                `Svar på denne e-posten hvis dere vil sette i gang, eller book en kort gjennomgang så går vi igjennom omfanget sammen.\n\n` +
                `Mvh\n{{partner}}`,
            }
          : kind === "reminder"
            ? {
                name: name || `Oppfølging — ${segLabels || "valgte kunder"}`,
                subject: `Kort oppfølging — venter på tilbakemelding fra {{kunde}}`,
                body:
                  `Hei {{kontaktperson}},\n\n` +
                  `Jeg følger opp saken vi snakket om sist. For å holde fremdrift trenger vi en kort tilbakemelding fra {{kunde}} — gjerne denne uken.\n\n` +
                  `Det holder med et ja/nei eller et spørsmål om noe er uklart, så tar vi det videre derfra.\n\n` +
                  `Mvh\n{{partner}}`,
                }
            : {
                name: name || (mentionsNis2 ? `NIS2-vurdering — ${segLabels}` : `Informasjon — ${segLabels || "valgte kunder"}`),
                subject: mentionsNis2
                  ? `NIS2 trer i kraft — {{kunde}} bør gjennomføre en vurdering`
                  : `Viktig oppdatering for {{kunde}}: ${topicLabel}`,
                body: mentionsNis2
                  ? `Hei {{kontaktperson}},\n\n` +
                    `NIS2-direktivet er nå tatt inn i norsk rett og stiller konkrete krav til styring, ` +
                    `risikohåndtering, hendelsesrapportering og leverandørkontroll for virksomheter som leverer samfunnsviktige tjenester.\n\n` +
                    `Basert på vår oversikt over {{kunde}} ser vi at dere sannsynligvis omfattes — enten direkte eller som leverandør til en virksomhet som gjør det. ` +
                    `Det betyr at dere trenger en NIS2-vurdering for å avklare:\n\n` +
                    `• Om {{kunde}} faller inn under loven, og i så fall som "viktig" eller "vesentlig" virksomhet\n` +
                    `• Hvilke styrings- og sikkerhetstiltak som mangler i forhold til kravene\n` +
                    `• Hva ledelsen er personlig ansvarlig for, og hvilke frister som gjelder\n` +
                    `• Hvilke leverandøravtaler som må oppdateres\n\n` +
                    `Vi tilbyr en strukturert NIS2-vurdering som gir dere en konkret tiltaksplan og dokumentasjon dere kan vise til både styret og tilsynsmyndighet. Vurderingen tar typisk 2–3 uker.\n\n` +
                    `Svar på denne e-posten så booker vi et 20-minutters møte for å gå gjennom hva dette betyr for {{kunde}}.\n\n` +
                    `Mvh\n{{partner}}`
                  : `Hei {{kontaktperson}},\n\n` +
                    `Vi ønsker å informere om at ${topicLabel} kan få direkte konsekvenser for {{kunde}}. ` +
                    `Endringene berører blant annet styringskrav, dokumentasjon og leverandøroppfølging — og det er kort tid til de trer i kraft.\n\n` +
                    `Vi anbefaler at dere:\n` +
                    `• Får en oversikt over hvilke krav som gjelder for {{kunde}}\n` +
                    `• Identifiserer gapet mellom dagens praksis og kravene\n` +
                    `• Setter en konkret plan før fristen\n\n` +
                    `Svar på denne e-posten så tar vi en kort, uforpliktende prat om hva dette betyr for dere.\n\n` +
                    `Mvh\n{{partner}}`,
              };
    setName((prev) => prev || auto.name);
    setSubject(auto.subject);
    setBody(auto.body);
  };

  // Resolve flettetags for preview
  const resolveTags = (text: string, c: CampaignCustomer) =>
    text
      .replace(/\{\{kunde\}\}/g, c.name)
      .replace(/\{\{kontaktperson\}\}/g, c.contactName ?? "der")
      .replace(/\{\{partner\}\}/g, "Partner-navn")
      .replace(/\{\{regelverk\}\}/g, (c.missingFrameworks ?? []).join(", ") || "regelverk")
      .replace(/\{\{frist\}\}/g, "snarest");

  const canNext1 = recipients.length > 0;
  const canNext2 = subject.trim().length > 0 && body.trim().length > 0;

  const handleSend = () => {
    onSend({
      name: name || `Kampanje (${recipients.length} mottakere)`,
      kind,
      serviceId: serviceId || undefined,
      subject,
      body,
      recipients,
    });
    close(false);
  };

  // ── Steps ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">Ny kampanje med Lara</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Send én melding eller ett tilbud til mange kunder samtidig — i tre enkle steg.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0",
                  step >= n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span
                className={cn(
                  "text-sm",
                  step === n ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {n === 1 ? "1. Velg kunder" : n === 2 ? "2. Skriv innhold" : "3. Send"}
              </span>
              {n < 3 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          {step === 1 && (
            <Step1
              focus={focus}
              setFocus={(f) => {
                setFocus(f);
                // når brukeren bytter fokus, fjern segmenter som ikke hører hjemme
                if (f) {
                  const allowed = new Set(
                    CAMPAIGN_SEGMENTS.filter((s) =>
                      FOCUS_TO_CATEGORIES[f].includes(s.category),
                    ).map((s) => s.id),
                  );
                  setSelectedSegments((prev) => prev.filter((id) => allowed.has(id)));
                }
              }}
              selected={selectedSegments}
              onToggle={(id) =>
                setSelectedSegments((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
              combine={combine}
              setCombine={setCombine}
              split={segmentSplit}
              overrides={manualOverrides}
              setOverride={(id, on) =>
                setManualOverrides((prev) => ({ ...prev, [id]: on }))
              }
            />
          )}

          {step === 2 && (
            <Step2
              kind={kind}
              setKind={setKind}
              serviceId={serviceId}
              setServiceId={setServiceId}
              name={name}
              setName={setName}
              subject={subject}
              setSubject={setSubject}
              body={body}
              setBody={setBody}
              onGenerate={generateDraft}
              recipientsCount={recipients.length}
            />
          )}

          {step === 3 && (
            <Step3
              recipients={recipients}
              subject={subject}
              body={body}
              resolveTags={resolveTags}
              onRemove={(id) => setManualOverrides((p) => ({ ...p, [id]: false }))}
            />
          )}
        </ScrollArea>

        <DialogFooter className="flex-row sm:justify-between items-center gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            <Users className="inline h-4 w-4 align-[-3px] mr-1" />
            {recipients.length} mottaker{recipients.length === 1 ? "" : "e"} valgt
          </p>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Tilbake
              </Button>
            )}
            {step < 3 ? (
              <Button
                size="sm"
                disabled={step === 1 ? !canNext1 : !canNext2}
                onClick={() => {
                  if (step === 1) {
                    // Forberedelse til steg 2: hvis subject/body er tom, generer utkast
                    if (!subject && !body) generateDraft();
                  }
                  setStep((s) => (s === 1 ? 2 : 3));
                }}
                className="gap-1"
              >
                Neste
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSend} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Send til {recipients.length}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── STEP 1 ────────────────────────────────────────────────────────────────
function Step1({
  selected,
  onToggle,
  combine,
  setCombine,
  matches,
  overrides,
  setOverride,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  combine: "and" | "or";
  setCombine: (v: "and" | "or") => void;
  matches: CampaignCustomer[];
  overrides: Record<string, boolean>;
  setOverride: (id: string, on: boolean) => void;
}) {
  const grouped = useMemo(() => {
    const out: Record<string, CampaignSegment[]> = {};
    for (const s of CAMPAIGN_SEGMENTS) (out[s.category] ??= []).push(s);
    return out;
  }, []);

  return (
    <div className="space-y-5 py-2">
      {/* Stor, sticky treff-teller */}
      <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 bg-background">
        <Card
          className={cn(
            "p-4 border-2 transition-colors",
            matches.length > 0
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center shrink-0",
                matches.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <span className="text-2xl font-bold tabular-nums">{matches.length}</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">
                {matches.length === 0
                  ? "Ingen kunder valgt ennå"
                  : `${matches.length} kunde${matches.length === 1 ? "" : "r"} treffer kampanjen`}
              </p>
              <p className="text-sm text-muted-foreground">
                {selected.length === 0
                  ? "Hak av ett eller flere kriterier under."
                  : `Av totalt ${DEMO_CAMPAIGN_CUSTOMERS.length} kunder · ${selected.length} kriteri${selected.length === 1 ? "um" : "er"} valgt`}
              </p>
            </div>
          </div>
        </Card>
      </div>


      {/* Segmenter */}
      {Object.entries(grouped).map(([cat, segs]) => {
        const Icon = CATEGORY_ICON[cat as CampaignSegment["category"]];
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              <Icon className="h-3.5 w-3.5" />
              {SEGMENT_CATEGORY_LABEL[cat as CampaignSegment["category"]]}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {segs.map((s) => {
                const isOn = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onToggle(s.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      isOn
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Checkbox checked={isOn} className="mt-0.5 pointer-events-none" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Match-valg — bare synlig når 2+ valg */}
      {selected.length >= 2 && (
        <Card className="p-3 bg-muted/30">
          <p className="text-sm font-medium text-foreground mb-2">
            Du har valgt {selected.length} kriterier. Hvem skal regnes med?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCombine("or")}
              className={cn(
                "text-left p-3 rounded-lg border transition-colors",
                combine === "or"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30",
              )}
            >
              <p className="text-sm font-semibold text-foreground">Kunder med minst ett av valgene</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bredere — flere kunder treffer</p>
            </button>
            <button
              type="button"
              onClick={() => setCombine("and")}
              className={cn(
                "text-left p-3 rounded-lg border transition-colors",
                combine === "and"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30",
              )}
            >
              <p className="text-sm font-semibold text-foreground">Kunder med alle valgene</p>
              <p className="text-xs text-muted-foreground mt-0.5">Smalere — bare de som matcher alt</p>
            </button>
          </div>
        </Card>
      )}

      {/* Live counter + manual list */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">
            {matches.length} av {DEMO_CAMPAIGN_CUSTOMERS.length} kunder treffer
          </p>
          {matches.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Hak av for å hoppe over enkelte
            </span>
          )}
        </div>
        {matches.length === 0 ? (
          selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen kunder ennå — velg ett eller flere kriterier over.
            </p>
          ) : combine === "and" && selected.length >= 2 ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-medium">Ingen kunder matcher alle valgene samtidig.</span>{" "}
                Det er sjelden at samme kunde mangler flere regelverk på én gang.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCombine("or")}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Bytt til «minst ett av valgene»
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ingen kunder matcher kriteriene. Prøv å velge flere segmenter eller andre kategorier.
            </p>
          )
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {matches.map((c) => {
              const isIn = overrides[c.id] !== false;
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={isIn}
                    onCheckedChange={(v) => setOverride(c.id, !!v)}
                  />
                  <span className="text-sm text-foreground">{c.name}</span>
                  {c.contactName && (
                    <span className="text-xs text-muted-foreground">· {c.contactName}</span>
                  )}
                  {c.criticality === "critical" && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      Kritisk
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── STEP 2 ────────────────────────────────────────────────────────────────
function Step2({
  kind,
  setKind,
  serviceId,
  setServiceId,
  name,
  setName,
  subject,
  setSubject,
  body,
  setBody,
  onGenerate,
  recipientsCount,
}: {
  kind: CampaignKind;
  setKind: (k: CampaignKind) => void;
  serviceId: string;
  setServiceId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  onGenerate: () => void;
  recipientsCount: number;
}) {
  return (
    <div className="space-y-5 py-2">
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Hva slags melding?</p>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isOn = kind === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKind(opt.id)}
                className={cn(
                  "text-left p-3 rounded-lg border transition-colors",
                  isOn
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", isOn ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Kampanjenavn (kun internt)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="F.eks. NIS2-kampanje våren 2026"
          className="h-10 text-sm"
        />
      </div>

      <Card className="p-3 bg-primary/5 border-primary/20 flex items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          La Lara skrive et utkast for {recipientsCount} mottaker
          {recipientsCount === 1 ? "" : "e"}.
        </p>
        <Button size="sm" variant="outline" onClick={onGenerate} className="gap-1.5 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
          {subject || body ? "Generer på nytt" : "Skriv utkast"}
        </Button>
      </Card>

      <div className="space-y-1.5">
        <Label className="text-sm">Emne (e-post)</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="F.eks. Tilbud: NIS2-klargjøring for {{kunde}}"
          className="h-10 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Brødtekst</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Bruk flettetags: {{kunde}}, {{kontaktperson}}, {{regelverk}}, {{partner}}"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Flettetags som fylles ut automatisk per kunde:{" "}
          <code className="text-primary">{`{{kunde}}`}</code>{" "}
          <code className="text-primary">{`{{kontaktperson}}`}</code>{" "}
          <code className="text-primary">{`{{regelverk}}`}</code>{" "}
          <code className="text-primary">{`{{partner}}`}</code>
        </p>
      </div>
    </div>
  );
}

// ── STEP 3 ────────────────────────────────────────────────────────────────
function Step3({
  recipients,
  subject,
  body,
  resolveTags,
  onRemove,
}: {
  recipients: CampaignCustomer[];
  subject: string;
  body: string;
  resolveTags: (text: string, c: CampaignCustomer) => string;
  onRemove: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState(recipients[0]?.id);
  const active = recipients.find((c) => c.id === activeId) ?? recipients[0];

  return (
    <div className="grid grid-cols-[200px_1fr] gap-3 py-2">
      <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 border-r">
        {recipients.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-[12px] flex items-center justify-between gap-2",
              active?.id === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
            )}
          >
            <span className="truncate">{c.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(c.id);
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
              title="Hopp over"
            >
              ×
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Forhåndsvisning for <span className="font-semibold text-foreground">{active.name}</span>
            {active.contactEmail && <> · {active.contactEmail}</>}
          </div>
          <Card className="p-3 space-y-2 bg-background">
            <div className="text-[12px]">
              <span className="text-muted-foreground">Emne: </span>
              <span className="font-medium text-foreground">{resolveTags(subject, active)}</span>
            </div>
            <div className="border-t pt-2 text-[12px] whitespace-pre-wrap text-foreground leading-relaxed">
              {resolveTags(body, active)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
