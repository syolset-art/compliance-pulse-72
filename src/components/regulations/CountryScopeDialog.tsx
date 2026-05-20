import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Check, ArrowRight, X, MessageCircle, Lightbulb, Search } from "lucide-react";
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
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    if (open) {
      setStep(1);
      setMode(initialScope.mode);
      setSelected(initialScope.countries.length ? initialScope.countries : [DEFAULT_COUNTRY_CODE]);
      setAnswers(initialScope.answers ?? DEFAULT_ANSWERS);
      setChosenFrameworkIds([]);
      setCountrySearch("");
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
                {step === 3 && mode === "multi" && "Et par spørsmål for å filtrere"}
                {step === reviewStep && "Foreslåtte regelverk"}
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
              {step === 3 && mode === "multi" && "Vi bruker svarene til å foreslå riktige regelverk."}
              {step === reviewStep && "Lara har forhåndsvalgt forslagene. Du kan legge til eller fjerne regelverk selv."}
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
              {/* Country search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Søk etter land…"
                  aria-label="Søk etter land"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </div>

              <div
                role={mode === "single" ? "radiogroup" : "group"}
                aria-label={mode === "single" ? "Velg ett land" : "Velg ett eller flere land"}
                className="flex flex-wrap gap-2"
              >
                {SUPPORTED_COUNTRIES.filter((c) => {
                  const q = countrySearch.trim().toLowerCase();
                  if (!q) return true;
                  return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
                }).map((c) => {
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

          {step === 3 && mode === "multi" && (
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

            </div>
          )}

          {step === reviewStep && (
            <FrameworkPicker
              suggestedIds={suggestedIds}
              chosenIds={chosenFrameworkIds}
              onToggle={toggleFramework}
              customFrameworks={answers.specificFrameworks ?? []}
              onCustomFrameworksChange={(v) =>
                setAnswers((a) => ({ ...a, specificFrameworks: v }))
              }
            />
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
              {step === reviewStep ? `Aktiver ${chosenFrameworkIds.length} regelverk` : "Neste"}
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

const CATEGORY_LABELS: Record<string, string> = {
  privacy: "Personvern",
  security: "Informasjonssikkerhet",
  ai: "AI & etikk",
  other: "Øvrige",
};

function FrameworkPicker({
  suggestedIds,
  chosenIds,
  onToggle,
  customFrameworks = [],
  onCustomFrameworksChange,
}: {
  suggestedIds: string[];
  chosenIds: string[];
  onToggle: (id: string) => void;
  customFrameworks?: string[];
  onCustomFrameworksChange?: (v: string[]) => void;
}) {
  const suggestedSet = new Set(suggestedIds);
  const grouped = frameworks.reduce<Record<string, typeof frameworks>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});
  const categoryOrder = ["privacy", "security", "ai", "other"];
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" aria-hidden />
        <p className="text-foreground/80">
          <span className="font-medium text-foreground">Lara foreslår {suggestedIds.length} regelverk</span> basert på land og svar. Du kan justere listen før du aktiverer.
        </p>
      </div>

      {customFrameworks.length > 0 && (
        <section aria-labelledby="cat-custom" className="space-y-2">
          <h4 id="cat-custom" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bestilte regelverk
          </h4>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Disse er ikke i vår katalog enda. Vi sender en støtteforespørsel — typisk levert på noen dager.
            </p>
            <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
              {customFrameworks.map((name) => (
                <li key={name}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs">
                    {name}
                    {onCustomFrameworksChange && (
                      <button
                        type="button"
                        onClick={() => onCustomFrameworksChange(customFrameworks.filter((v) => v !== name))}
                        aria-label={`Fjern ${name}`}
                        className="rounded-full p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="space-y-5">
        {categoryOrder.map((cat) => {
          const list = grouped[cat];
          if (!list?.length) return null;
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`} className="space-y-2">
              <h4 id={`cat-${cat}`} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat] ?? cat}
              </h4>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {list.map((f) => {
                  const isChecked = chosenIds.includes(f.id);
                  const isSuggested = suggestedSet.has(f.id);
                  return (
                    <li key={f.id}>
                      <label
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                          isChecked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggle(f.id)}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                          aria-describedby={`fw-${f.id}-desc`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{f.name}</span>
                            {isSuggested && (
                              <Badge variant="outline" className="gap-1 text-[10px] uppercase tracking-wide border-primary/30 text-primary">
                                <Sparkles className="h-2.5 w-2.5" aria-hidden />
                                Foreslått
                              </Badge>
                            )}
                            {f.isMandatory && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-status-followup/40 text-status-followup">
                                Påkrevd
                              </Badge>
                            )}
                          </div>
                          <p id={`fw-${f.id}-desc`} className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {f.description}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SpecificFrameworksInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputId = "specific-frameworks-input";
  const hintId = "specific-frameworks-hint";

  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  const remove = (name: string) => onChange(values.filter((v) => v !== name));

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-3">
      <div className="space-y-0.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          Er det noen spesifikke regelverk dere allerede vet at dere må følge?
        </label>
        <p id={hintId} className="text-xs text-muted-foreground">
          Valgfritt. Skriv navnet og trykk Enter — f.eks. «HIPAA», «PCI DSS» eller en lokal lov. Vi sjekker om vi støtter dem og kobler dem inn.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs"
          >
            {name}
            <button
              type="button"
              onClick={() => remove(name)}
              aria-label={`Fjern ${name}`}
              className="rounded-full p-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
        <div className="flex flex-1 min-w-[160px] items-center gap-1.5">
          <input
            id={inputId}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addDraft();
              } else if (e.key === "Backspace" && !draft && values.length) {
                onChange(values.slice(0, -1));
              }
            }}
            placeholder="F.eks. HIPAA, PCI DSS…"
            aria-describedby={hintId}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
          />
          {draft.trim() && (
            <Button type="button" size="sm" variant="ghost" onClick={addDraft} className="h-7 px-2 text-xs">
              Legg til
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
