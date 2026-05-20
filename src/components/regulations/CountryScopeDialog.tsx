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

type Step = 1 | 2 | 3 | 4;

const DEFAULT_ANSWERS: ScopeAnswers = { health: "no", finance: "no", criticalInfra: "no", dataOutsideEU: "no" };

export function CountryScopeDialog({ open, onOpenChange, initialScope, onApply }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<ScopeMode>(initialScope.mode);
  const [selected, setSelected] = useState<string[]>(initialScope.countries);
  const [answers, setAnswers] = useState<ScopeAnswers>(initialScope.answers ?? DEFAULT_ANSWERS);
  const [chosenFrameworkIds, setChosenFrameworkIds] = useState<string[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMode(initialScope.mode);
      setSelected(initialScope.countries.length ? initialScope.countries : [DEFAULT_COUNTRY_CODE]);
      setAnswers(initialScope.answers ?? DEFAULT_ANSWERS);
      setChosenFrameworkIds([]);
    }
  }, [open, initialScope]);

  // Single mode: 1 mode → 2 countries → 3 review/pick.
  // Multi mode:  1 mode → 2 countries → 3 questions → 4 review/pick.
  const totalSteps = mode === "multi" ? 4 : 3;
  const reviewStep: Step = mode === "multi" ? 4 : 3;

  const toggleCountry = (code: string) => {
    if (mode === "single") {
      setSelected([code]);
      return;
    }
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const suggestedIds = suggestFrameworks(selected, mode === "multi" ? answers : undefined);
  const suggestedFrameworks = frameworks.filter((f) => suggestedIds.includes(f.id));

  // When entering review step, preselect Lara's suggestions.
  useEffect(() => {
    if (step === reviewStep) {
      setChosenFrameworkIds((prev) => (prev.length === 0 ? suggestedIds : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reviewStep]);

  const toggleFramework = (id: string) => {
    setChosenFrameworkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const finalIds = chosenFrameworkIds.length ? chosenFrameworkIds : suggestedIds;
    onApply({ mode, countries: selected, answers: mode === "multi" ? answers : undefined }, finalIds);
    onOpenChange(false);
  };

  const goNext = () => {
    if (step === reviewStep) {
      handleApply();
      return;
    }
    setStep((s) => ((s + 1) as Step));
  };

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0"
          aria-labelledby="country-scope-title"
          aria-describedby="country-scope-desc"
        >
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle id="country-scope-title" className="flex items-center gap-2">
                {mode === "multi" && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Ekspansjon</Badge>}
                {step === 1 && "Hvilke land gjelder dette for?"}
                {step === 2 && (mode === "multi" ? "Hvor opererer dere nå?" : "Velg land")}
                {step === 3 && "Et par spørsmål for å filtrere"}
              </DialogTitle>
              <span
                className="text-xs text-muted-foreground whitespace-nowrap"
                aria-label={`Steg ${step} av ${totalSteps}`}
              >
                Steg {step} av {totalSteps}
              </span>
            </div>
            <DialogDescription id="country-scope-desc">
              {step === 1 && "Som standard viser vi regelverk for ett land. Velg flere hvis dere ekspanderer eller opererer på tvers."}
              {step === 2 && "Lara foreslår regelverk basert på valgene."}
              {step === 3 && "Vi bruker svarene til å foreslå riktige regelverk."}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-5 flex-1">
          {step === 1 && (
            <div
              role="radiogroup"
              aria-label="Velg om du opererer i ett eller flere land"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
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
              <div
                role={mode === "single" ? "radiogroup" : "group"}
                aria-label={mode === "single" ? "Velg ett land" : "Velg ett eller flere land"}
                className="flex flex-wrap gap-2"
              >
                {SUPPORTED_COUNTRIES.map((c) => {
                  const isSel = selected.includes(c.code);
                  const commonProps =
                    mode === "single"
                      ? { role: "radio" as const, "aria-checked": isSel }
                      : { "aria-pressed": isSel };
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggleCountry(c.code)}
                      aria-label={`${c.name} (${c.code})${isSel ? ", valgt" : ""}`}
                      {...commonProps}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isSel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      <span aria-hidden>{c.flag}</span>
                      <span className="text-[10px] uppercase tracking-wide opacity-70" aria-hidden>{c.code}</span>
                      <span>{c.name}</span>
                      {isSel && mode === "multi" && <X className="h-3 w-3 ml-0.5 opacity-70" aria-hidden />}
                      {isSel && mode === "single" && <Check className="h-3 w-3 ml-0.5" aria-hidden />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Legg til land
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {selected.length} land valgt.
              </p>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <MessageCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" aria-hidden />
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
                  <Sparkles className="h-3 w-3" aria-hidden /> Lara spør
                </div>
                <h3 className="text-base font-semibold text-foreground">Hvem leverer dere til?</h3>
                <p className="text-sm text-muted-foreground">
                  Som programvareleverandør blir dere ofte indirekte underlagt kundens regelverk. Vi spør derfor om sektorene dere betjener.
                </p>
              </div>

              <div className="space-y-4">
                <TriQuestion
                  id="q-health"
                  label="Leverer dere til helsesektoren?"
                  hint="Aktiverer databehandleravtale-krav og Pasientjournalloven-tilknytning."
                  value={answers.health}
                  onChange={(v) => setAnswers((a) => ({ ...a, health: v }))}
                />
                <TriQuestion
                  id="q-finance"
                  label="Leverer dere til finansforetak eller forsikring?"
                  hint="Trigger DORA (EU) og Finanstilsynets IKT-forskrift."
                  value={answers.finance}
                  onChange={(v) => setAnswers((a) => ({ ...a, finance: v }))}
                />
                <TriQuestion
                  id="q-infra"
                  label="Leverer dere til kritisk infrastruktur eller offentlig sektor?"
                  hint="Energi, telekom, transport, vannforsyning, kommune/stat. Trigger NIS2-tilknytning."
                  value={answers.criticalInfra}
                  onChange={(v) => setAnswers((a) => ({ ...a, criticalInfra: v }))}
                />
                <TriQuestion
                  id="q-data"
                  label="Lagrer dere kundedata utenfor EU/EØS?"
                  hint="Aktiverer kontroller for overføringsmekanismer (SCC, adequacy)."
                  value={answers.dataOutsideEU}
                  onChange={(v) => setAnswers((a) => ({ ...a, dataOutsideEU: v }))}
                  unsureLabel="Usikker"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <Lightbulb className="mt-0.5 h-4 w-4 text-primary shrink-0" aria-hidden />
                <p className="text-foreground/80">
                  <span className="font-medium text-foreground">Lara hopper over</span> spørsmål om barn under 16 (lite relevant for B2B-SaaS) og om dere driver kritisk infrastruktur selv (dere er IT-leverandør, ikke operatør). Kan utvides manuelt hvis aktuelt.
                </p>
              </div>

              <div
                className="rounded-lg border bg-muted/30 p-3 space-y-2"
                aria-live="polite"
                aria-atomic="true"
              >
                {suggestedFrameworks.length > 0 ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Foreslåtte regelverk ({suggestedFrameworks.length})
                    </div>
                    <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                      {suggestedFrameworks.map((f) => (
                        <li key={f.id}>
                          <Badge variant="secondary" className="font-normal">{f.name}</Badge>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Ingen forslag enda — svar på spørsmålene over.</p>
                )}
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 px-6 py-4 border-t bg-background">
            <Button variant="ghost" onClick={step === 1 ? () => onOpenChange(false) : goBack}>
              {step === 1 ? "Hopp over" : "Tilbake"}
            </Button>
            <Button
              onClick={goNext}
              disabled={step === 2 && selected.length === 0}
              aria-describedby={step === 2 && selected.length === 0 ? "next-disabled-hint" : undefined}
              className="gap-1.5"
            >
              {step === totalSteps ? "Vis forslag" : "Neste"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
            {step === 2 && selected.length === 0 && (
              <span id="next-disabled-hint" className="sr-only">
                Velg minst ett land for å gå videre.
              </span>
            )}
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
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border p-4 transition-all hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
  id,
  label,
  hint,
  value,
  onChange,
  unsureLabel = "Vurderer det",
}: {
  id: string;
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
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const order: TriAnswer[] = ["yes", "no", "maybe"];
    const idx = order.indexOf(value);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(order[(idx + 1) % order.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(order[(idx - 1 + order.length) % order.length]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <p id={labelId} className="text-sm font-medium text-foreground">{label}</p>
        {hint && (
          <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onKeyDown={handleKey}
        className="flex flex-wrap items-center gap-1.5"
      >
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(o.v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
