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
} from "lucide-react";
import {
  CAMPAIGN_SEGMENTS,
  SEGMENT_CATEGORY_LABEL,
  DEMO_CAMPAIGN_CUSTOMERS,
  applySegments,
  type CampaignCustomer,
  type CampaignSegment,
} from "@/lib/campaignSegments";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";

export type CampaignKind = "message" | "offer" | "reminder";

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
];

export function CampaignWizardDialog({ open, onOpenChange, onSend }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [combine, setCombine] = useState<"and" | "or">("or");
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [kind, setKind] = useState<CampaignKind>("offer");
  const [serviceId, setServiceId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const segmentMatches = useMemo(
    () => applySegments(DEMO_CAMPAIGN_CUSTOMERS, selectedSegments, combine),
    [selectedSegments, combine],
  );

  // Recipients = segment matches minus manually unchecked
  const recipients = useMemo(
    () => segmentMatches.filter((c) => manualOverrides[c.id] !== false),
    [segmentMatches, manualOverrides],
  );

  const selectedService: PartnerService | undefined = useMemo(
    () => PARTNER_SERVICES.find((s) => s.id === serviceId),
    [serviceId],
  );

  const reset = () => {
    setStep(1);
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
    const auto =
      kind === "offer" && selectedService
        ? {
            name: name || `${selectedService.name} — kampanje`,
            subject: `Tilbud: ${selectedService.name} for {{kunde}}`,
            body:
              `Hei {{kontaktperson}},\n\n` +
              `Basert på vår siste gjennomgang ser vi at {{kunde}} ${segLabels ? `treffer kriteriene "${segLabels}"` : "har behov i dette området"}. ` +
              `Vi anbefaler vår leveranse "${selectedService.name}":\n\n` +
              `${selectedService.description}\n\n` +
              `Pris: ${selectedService.price ? `${selectedService.price.toLocaleString("nb-NO")} kr` : selectedService.priceNote || "etter avtale"}.\n\n` +
              `Si fra om dere ønsker en kort gjennomgang før dere bestemmer dere.\n\n` +
              `Mvh\n{{partner}}`,
          }
        : kind === "reminder"
          ? {
              name: name || `Oppfølging — ${segLabels || "valgte kunder"}`,
              subject: `Vennlig påminnelse til {{kunde}}`,
              body:
                `Hei {{kontaktperson}},\n\n` +
                `Håper alt vel hos {{kunde}}. Jeg ville bare høre om dere har hatt anledning til å se nærmere på det vi snakket om sist.\n\n` +
                `Si gjerne fra om noe er uklart, eller om dere ønsker en kort prat.\n\n` +
                `Mvh\n{{partner}}`,
            }
          : {
              name: name || `Informasjon — ${segLabels || "valgte kunder"}`,
              subject: `Viktig informasjon til {{kunde}}`,
              body:
                `Hei {{kontaktperson}},\n\n` +
                `Vi ønsker å informere om at ${segLabels || "endringer i regelverket"} kan påvirke {{kunde}}. ` +
                `Vi har samlet en kort oversikt over hva dette betyr og hva dere bør gjøre nå.\n\n` +
                `Ta kontakt om dere ønsker en uforpliktende prat.\n\n` +
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
              selected={selectedSegments}
              onToggle={(id) =>
                setSelectedSegments((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
              combine={combine}
              setCombine={setCombine}
              matches={segmentMatches}
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
          <p className="text-[12px] text-muted-foreground">
            <Users className="inline h-3.5 w-3.5 align-[-2px] mr-1" />
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
      {/* Sub-steg A: hjelpetekst */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Steg 1 av 3 — Hvem skal motta?</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Hak av ett eller flere kriterier under. Lara finner kundene som passer.
            </p>
          </div>
        </div>
      </Card>

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
          <p className="text-sm text-muted-foreground">
            Ingen kunder ennå — velg ett eller flere kriterier over.
          </p>
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
                    <Badge variant="outline" className="text-[10px] ml-auto">
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
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-3 gap-2">
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
                <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{opt.hint}</p>
            </button>
          );
        })}
      </div>

      {kind === "offer" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Tjeneste fra katalogen</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Velg tjeneste å tilby" />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_SERVICES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {PARTNER_SERVICES.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Ingen tjenester i katalogen ennå — gå til Tjenestekatalog først.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Kampanjenavn (intern)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="F.eks. NIS2-kampanje våren 2026"
          className="h-9 text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          Lara kan skrive et utkast for {recipientsCount} mottaker
          {recipientsCount === 1 ? "" : "e"} basert på valgene dine.
        </p>
        <Button size="sm" variant="outline" onClick={onGenerate} className="h-7 gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {subject || body ? "Generer på nytt" : "La Lara skrive utkast"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Emne (e-post)</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="F.eks. Tilbud: NIS2-klargjøring for {{kunde}}"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Brødtekst</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Bruk flettetags: {{kunde}}, {{kontaktperson}}, {{regelverk}}, {{partner}}"
          className="text-[12px] font-mono"
        />
        <p className="text-[11px] text-muted-foreground">
          Tilgjengelige flettetags:{" "}
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
              className="text-[10px] text-muted-foreground hover:text-destructive"
              title="Hopp over"
            >
              ×
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-2">
          <div className="text-[11px] text-muted-foreground">
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
