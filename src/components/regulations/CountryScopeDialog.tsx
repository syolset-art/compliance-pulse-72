import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Check, ArrowRight, X, MessageCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  type CountryScope,
  type ScopeAnswers,
  type ScopeMode,
  type TriAnswer,
  suggestFrameworks,
} from "./countryScopeData";
import { frameworks } from "@/lib/frameworkDefinitions";
import { RequestCountrySupportDialog } from "./RequestCountrySupportDialog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialScope: CountryScope;
  /** Called with the resulting scope and the suggested framework ids the user wants to consider. */
  onApply: (scope: CountryScope, suggestedFrameworkIds: string[]) => void;
}

type Step = 1 | 2 | 3;

const DEFAULT_ANSWERS: ScopeAnswers = { health: "no", finance: "no", criticalInfra: "no", dataOutsideEU: "no" };

export function CountryScopeDialog({ open, onOpenChange, initialScope, onApply }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<ScopeMode>(initialScope.mode);
  const [selected, setSelected] = useState<string[]>(initialScope.countries);
  const [answers, setAnswers] = useState<ScopeAnswers>(initialScope.answers ?? DEFAULT_ANSWERS);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMode(initialScope.mode);
      setSelected(initialScope.countries.length ? initialScope.countries : [DEFAULT_COUNTRY_CODE]);
      setAnswers(initialScope.answers ?? DEFAULT_ANSWERS);
    }
  }, [open, initialScope]);

  const totalSteps = mode === "multi" ? 3 : 2;

  const toggleCountry = (code: string) => {
    if (mode === "single") {
      setSelected([code]);
      return;
    }
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleApply = () => {
    const suggested = suggestFrameworks(selected, mode === "multi" ? answers : undefined);
    onApply({ mode, countries: selected, answers: mode === "multi" ? answers : undefined }, suggested);
    onOpenChange(false);
  };

  const suggestedIds = suggestFrameworks(selected, mode === "multi" ? answers : undefined);
  const suggestedFrameworks = frameworks.filter((f) => suggestedIds.includes(f.id));

  const goNext = () => {
    if (step === 1) {
      setStep(mode === "multi" ? 2 : 2);
    } else if (step === 2) {
      if (mode === "multi") setStep(3);
      else handleApply();
    } else {
      handleApply();
    }
  };

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                {mode === "multi" && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Ekspansjon</Badge>}
                {step === 1 && "Hvilke land gjelder dette for?"}
                {step === 2 && (mode === "multi" ? "Hvor opererer dere nå?" : "Velg land")}
                {step === 3 && "Et par spørsmål for å filtrere"}
              </DialogTitle>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Steg {step} av {totalSteps}</span>
            </div>
            <DialogDescription>
              {step === 1 && "Som standard viser vi regelverk for ett land. Velg flere hvis dere ekspanderer eller opererer på tvers."}
              {step === 2 && "Lara foreslår regelverk basert på valgene."}
              {step === 3 && "Vi bruker svarene til å foreslå riktige regelverk."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard
                active={mode === "single"}
                title="Kun ett land"
                description="Default. Vis regelverk som gjelder ett primært marked."
                onClick={() => setMode("single")}
              />
              <ModeCard
                active={mode === "multi"}
                title="Flere land"
                description="For selskaper som ekspanderer eller opererer i flere markeder."
                onClick={() => setMode("multi")}
                accent
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_COUNTRIES.map((c) => {
                  const isSel = selected.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggleCountry(c.code)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        isSel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      <span aria-hidden>{c.flag}</span>
                      <span className="text-[10px] uppercase tracking-wide opacity-70">{c.code}</span>
                      <span>{c.name}</span>
                      {isSel && mode === "multi" && <X className="h-3 w-3 ml-0.5 opacity-70" />}
                      {isSel && mode === "single" && <Check className="h-3 w-3 ml-0.5" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Legg til land
                </button>
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <MessageCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-muted-foreground">
                  Lara foreslår regelverk basert på valgte land
                  {mode === "multi" && " – neste steg stiller noen spørsmål for å filtrere ytterligere"}.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" /> Lara spør
                </div>
                <h3 className="text-base font-semibold text-foreground">Hvem leverer dere til?</h3>
                <p className="text-sm text-muted-foreground">
                  Som programvareleverandør blir dere ofte indirekte underlagt kundens regelverk. Vi spør derfor om sektorene dere betjener.
                </p>
              </div>

              <div className="space-y-4">
                <TriQuestion
                  label="Leverer dere til helsesektoren?"
                  hint="Aktiverer databehandleravtale-krav og Pasientjournalloven-tilknytning."
                  value={answers.health}
                  onChange={(v) => setAnswers((a) => ({ ...a, health: v }))}
                />
                <TriQuestion
                  label="Leverer dere til finansforetak eller forsikring?"
                  hint="Trigger DORA (EU) og Finanstilsynets IKT-forskrift."
                  value={answers.finance}
                  onChange={(v) => setAnswers((a) => ({ ...a, finance: v }))}
                />
                <TriQuestion
                  label="Leverer dere til kritisk infrastruktur eller offentlig sektor?"
                  hint="Energi, telekom, transport, vannforsyning, kommune/stat. Trigger NIS2-tilknytning."
                  value={answers.criticalInfra}
                  onChange={(v) => setAnswers((a) => ({ ...a, criticalInfra: v }))}
                />
                <TriQuestion
                  label="Lagrer dere kundedata utenfor EU/EØS?"
                  hint="Aktiverer kontroller for overføringsmekanismer (SCC, adequacy)."
                  value={answers.dataOutsideEU}
                  onChange={(v) => setAnswers((a) => ({ ...a, dataOutsideEU: v }))}
                  unsureLabel="Usikker"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <Lightbulb className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-foreground/80">
                  <span className="font-medium text-foreground">Lara hopper over</span> spørsmål om barn under 16 (lite relevant for B2B-SaaS) og om dere driver kritisk infrastruktur selv (dere er IT-leverandør, ikke operatør). Kan utvides manuelt hvis aktuelt.
                </p>
              </div>

              {suggestedFrameworks.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Foreslåtte regelverk ({suggestedFrameworks.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedFrameworks.map((f) => (
                      <Badge key={f.id} variant="secondary" className="font-normal">{f.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={step === 1 ? () => onOpenChange(false) : goBack}>
              {step === 1 ? "Hopp over" : "Tilbake"}
            </Button>
            <Button onClick={goNext} disabled={step === 2 && selected.length === 0} className="gap-1.5">
              {step === totalSteps ? "Vis forslag" : "Neste"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RequestCountrySupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
  accent,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border p-4 transition-all hover:shadow-sm",
        active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border bg-background"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-foreground">{title}</span>
        {accent && <Badge variant="outline" className="text-[10px] uppercase">Ekspansjon</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function TriQuestion({
  label,
  hint,
  value,
  onChange,
  unsureLabel = "Vurderer det",
}: {
  label: string;
  hint?: string;
  value: TriAnswer;
  onChange: (v: TriAnswer) => void;
  unsureLabel?: string;
}) {
  const opts: { v: TriAnswer; l: string }[] = [
    { v: "yes", l: "Ja" },
    { v: "no", l: "Nei" },
    { v: "maybe", l: unsureLabel },
  ];
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
