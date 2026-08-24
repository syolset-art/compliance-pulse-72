import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TrendingUp,
  Package,
  Clock,
  Info,
  ChevronDown,
  CheckCircle2,
  ArrowDown,
  Settings2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { MYNDER_PRODUCTS } from "@/lib/mynderProducts";
import { frameworkLicensePrice } from "@/lib/planConstants";
import { frameworks as FRAMEWORK_DEFS } from "@/lib/frameworkDefinitions";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import {
  estimateRequirementHours,
  readRequirementHoursCache,
  type FrameworkHoursEstimate,
} from "@/lib/laraRequirementHoursEstimate";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("nb-NO");

const LS_FRAMEWORKS = "msp.salesPotential.frameworks";
const LS_RATE = "msp.salesPotential.hourlyRate";
const LS_HOURS_PER_REQ = "msp.salesPotential.hoursPerRequirement";
const LS_VIEW = "msp.salesPotential.view";
const LS_HOURS_MODE = "msp.salesPotential.hoursMode";

const DEFAULT_FRAMEWORKS = ["gdpr"];
const DEFAULT_HOURLY_RATE = 1500;
const DEFAULT_HOURS_PER_REQ = 1;

type ViewMode = "estimate" | "packages";
type HoursMode = "fixed" | "lara";

interface FrameworkOption {
  id: string;
  name: string;
  controlPoints: number;
  priceKr: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function scrollToPackagesSection() {
  document
    .getElementById("regelverk-pakker")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Samlet salgspotensial for partneren — øverst på «Produkter og tjenester».
 *
 * To visninger:
 * - «Estimert potensial»: generelt anslag basert på minstepris på produktene,
 *   valgte regelverk og rådgivningstimer (fast timeantall eller Lara-estimat).
 * - «Mine aktiverte pakker»: basert på partnerens egne lagrede og aktiverte
 *   regelverkpakker (msp_framework_packages) — reelle timer og priser partneren
 *   selv har satt opp.
 *
 * Estimatsinnstillingene (timepris, metode) ligger i tannhjul-popoveren for å
 * holde kortet kompakt.
 */
export function PartnerSalesPotentialCard({ currency }: { currency: string }) {
  const { defaultHourlyRate } = useServiceDefaults();
  const { packages } = useFrameworkPackages();

  const [view, setView] = useState<ViewMode>(
    () => readJson<ViewMode>(LS_VIEW) ?? "estimate",
  );
  const [hoursMode, setHoursMode] = useState<HoursMode>(
    () => readJson<HoursMode>(LS_HOURS_MODE) ?? "fixed",
  );
  const [aiEstimates, setAiEstimates] = useState<Record<string, FrameworkHoursEstimate>>(
    () => readRequirementHoursCache(),
  );
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Tilgjengelige regelverk med kontrollpunkter (dedupe — noen er definert to ganger).
  const options = useMemo<FrameworkOption[]>(() => {
    const seen = new Set<string>();
    return FRAMEWORK_DEFS.filter((fw) => {
      if (seen.has(fw.id)) return false;
      seen.add(fw.id);
      return true;
    })
      .map((fw) => ({
        id: fw.id,
        name: fw.name,
        controlPoints: baselineRequirementRows(fw.id).length,
        priceKr: frameworkLicensePrice(fw.id),
      }))
      .filter((o) => o.controlPoints > 0)
      .sort((a, b) => b.controlPoints - a.controlPoints);
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => readJson<string[]>(LS_FRAMEWORKS) ?? DEFAULT_FRAMEWORKS,
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    () => readJson<number>(LS_RATE) ?? defaultHourlyRate ?? DEFAULT_HOURLY_RATE,
  );
  // null = auto (1 time per krav). Tall = brukerens eget anslag for timer per krav.
  const [hoursPerReqOverride, setHoursPerReqOverride] = useState<number | null>(() =>
    readJson<number>(LS_HOURS_PER_REQ),
  );

  useEffect(() => {
    localStorage.setItem(LS_FRAMEWORKS, JSON.stringify(selectedIds));
  }, [selectedIds]);
  useEffect(() => {
    localStorage.setItem(LS_RATE, JSON.stringify(hourlyRate));
  }, [hourlyRate]);
  useEffect(() => {
    if (hoursPerReqOverride === null) localStorage.removeItem(LS_HOURS_PER_REQ);
    else localStorage.setItem(LS_HOURS_PER_REQ, JSON.stringify(hoursPerReqOverride));
  }, [hoursPerReqOverride]);
  useEffect(() => {
    localStorage.setItem(LS_VIEW, JSON.stringify(view));
  }, [view]);
  useEffect(() => {
    localStorage.setItem(LS_HOURS_MODE, JSON.stringify(hoursMode));
  }, [hoursMode]);

  const selected = options.filter((o) => selectedIds.includes(o.id));

  const toggleFramework = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((f) => f !== id)));
  };

  // ── Estimert potensial ──
  const productLicense = MYNDER_PRODUCTS.filter((p) => p.id !== "frameworks").reduce(
    (sum, p) => sum + p.fromPrice,
    0,
  );
  // Alle produkter fra Mynder inngår i lisenssummen — minstepris (fra-pris) summert,
  // uavhengig av hvilke regelverk som er valgt for rådgivningstimer.
  const allFrameworkLicense = options.reduce((sum, f) => sum + f.priceKr, 0);
  const licensePotential = productLicense + allFrameworkLicense;

  const totalControlPoints = selected.reduce((sum, f) => sum + f.controlPoints, 0);
  const hoursPerReq = hoursPerReqOverride ?? DEFAULT_HOURS_PER_REQ;

  // Gyldige Lara-estimater for valgte regelverk (kravtall må stemme).
  const validAiEstimates = useMemo(() => {
    const map = new Map<string, FrameworkHoursEstimate>();
    for (const fw of selected) {
      const est = aiEstimates[fw.id];
      if (est && est.requirementCount === fw.controlPoints) map.set(fw.id, est);
    }
    return map;
  }, [selected, aiEstimates]);

  const missingAiEstimates = selected.filter((fw) => !validAiEstimates.has(fw.id));
  const aiHoursTotal = selected.reduce(
    (sum, fw) => sum + (validAiEstimates.get(fw.id)?.totalHours ?? 0),
    0,
  );

  const isLara = hoursMode === "lara";
  // I Lara-modus: AI-timer der estimat finnes, fast snitt som fallback for resten.
  const advisoryHours = isLara
    ? Math.round(
        aiHoursTotal +
          missingAiEstimates.reduce((sum, fw) => sum + fw.controlPoints, 0) * DEFAULT_HOURS_PER_REQ,
      )
    : Math.round(totalControlPoints * hoursPerReq);
  const advisoryPotential = advisoryHours * (hourlyRate || 0);
  const laraComplete = isLara && missingAiEstimates.length === 0 && selected.length > 0;

  const runLaraEstimate = async () => {
    const targets = selected.filter((fw) => !validAiEstimates.has(fw.id));
    const toRun = targets.length > 0 ? targets : selected;
    if (toRun.length === 0) return;
    setEstimating(true);
    setEstimateError(null);
    try {
      for (const fw of toRun) {
        const rows = baselineRequirementRows(fw.id).map((r) => ({
          id: r.requirement_id,
          name: r.name_no ?? r.requirement_id,
        }));
        const result = await estimateRequirementHours(fw.id, fw.name, rows);
        setAiEstimates((prev) => ({ ...prev, [fw.id]: result }));
      }
    } catch (e) {
      setEstimateError(e instanceof Error ? e.message : "Estimeringen feilet. Prøv igjen.");
    } finally {
      setEstimating(false);
    }
  };

  const selectedLabel =
    selected.length === 0
      ? "Velg regelverk"
      : selected.length === 1
        ? selected[0].name
        : `${selected[0].name} + ${selected.length - 1} til`;

  // ── Mine aktiverte pakker (partnerens egne data) ──
  const activePackages = useMemo(
    () =>
      Object.values(packages)
        .filter((p) => p.is_active)
        .map((p) => ({
          ...p,
          name: p.framework_name ?? p.framework_id,
          licenseKr: frameworkLicensePrice(p.framework_id),
        })),
    [packages],
  );
  const pkgLicense = activePackages.reduce((sum, p) => sum + p.licenseKr, 0);
  const pkgAdvisory = activePackages.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const pkgHours = activePackages.reduce((sum, p) => sum + (p.total_hours || 0), 0);

  const isEstimate = view === "estimate";
  const shownLicense = isEstimate ? licensePotential : pkgLicense;
  const shownAdvisory = isEstimate ? advisoryPotential : pkgAdvisory;
  // Årlig potensial: 12 × månedlige lisenser + engangs rådgivningstimer.
  // Lisenser og timer kan ikke summeres per måned — derfor årlig total.
  const shownTotal = shownLicense * 12 + shownAdvisory;

  return (
    <Card className="p-5 border-primary/20 bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">Salgspotensial per kunde</h2>
              {/* Visningsvelger: estimat vs. partnerens egne pakker */}
              <div
                className="inline-flex rounded-md border border-border bg-background p-0.5"
                role="tablist"
                aria-label="Velg visning"
              >
                {(
                  [
                    { id: "estimate", label: "Estimert potensial" },
                    { id: "packages", label: "Mine aktiverte pakker" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={view === opt.id}
                    onClick={() => setView(opt.id)}
                    className={cn(
                      "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                      view === opt.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Estimatsinnstillinger (kun relevant i estimat-visningen) */}
              {isEstimate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Estimatsinnstillinger"
                    >
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 p-3 space-y-3">
                    <p className="text-xs font-medium text-foreground">Estimatsinnstillinger</p>

                    <RadioGroup
                      value={hoursMode}
                      onValueChange={(v) => setHoursMode(v as HoursMode)}
                      className="space-y-2"
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <RadioGroupItem value="fixed" className="mt-0.5" />
                        <span className="flex-1">
                          <span className="block text-xs font-medium text-foreground">
                            Fast timeantall per krav
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            Samme antall timer for alle krav — enkelt og forutsigbart.
                          </span>
                        </span>
                      </label>
                      {hoursMode === "fixed" && (
                        <div className="flex items-center gap-1.5 pl-6">
                          <span className="text-[11px] text-muted-foreground">Timer pr. krav</span>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={hoursPerReq}
                            onChange={(e) =>
                              setHoursPerReqOverride(
                                Math.max(0, Math.round((Number(e.target.value) || 0) * 10) / 10),
                              )
                            }
                            className="h-7 w-16 text-xs tabular-nums"
                            aria-label="Timer per krav"
                          />
                          {hoursPerReqOverride !== null && (
                            <button
                              type="button"
                              onClick={() => setHoursPerReqOverride(null)}
                              className="text-[11px] text-primary hover:underline"
                            >
                              Nullstill
                            </button>
                          )}
                        </div>
                      )}

                      <label className="flex items-start gap-2 cursor-pointer">
                        <RadioGroupItem value="lara" className="mt-0.5" />
                        <span className="flex-1">
                          <span className="block text-xs font-medium text-foreground">
                            Lara-estimat (AI)
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            Lara anslår hvor lang tid hvert krav typisk tar å implementere.
                            Veiledende — juster gjerne selv etterpå.
                          </span>
                        </span>
                      </label>
                      {hoursMode === "lara" && (
                        <div className="pl-6 space-y-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={runLaraEstimate}
                            disabled={estimating || selected.length === 0}
                          >
                            {estimating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                            {estimating
                              ? "Lara estimerer…"
                              : missingAiEstimates.length > 0
                                ? "Generer estimat"
                                : "Regenerer estimat"}
                          </Button>
                          {laraComplete && (
                            <p className="text-[11px] text-muted-foreground">
                              Estimert for {validAiEstimates.size} regelverk —{" "}
                              {fmt(Math.round(aiHoursTotal))} t totalt.
                            </p>
                          )}
                          {estimateError && (
                            <p className="text-[11px] text-destructive">{estimateError}</p>
                          )}
                        </div>
                      )}
                    </RadioGroup>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                      <span className="text-[11px] text-muted-foreground">Timepris</span>
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
                        className="h-7 w-20 text-xs tabular-nums"
                        aria-label="Timepris"
                      />
                      <span className="text-[11px] text-muted-foreground">{currency}/t</span>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              {isEstimate
                ? "Lisenser fra Mynder (minstepris) + dine rådgivningstimer per kunde."
                : "Basert på dine egne aktiverte regelverkpakker — ikke estimater."}
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-muted-foreground">Årlig salgspotensial</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Lisenser er løpende (12 × månedspris), rådgivningstimer er engangsinntekter.
                  Derfor vises totalen som årlig potensial — fordelingen ser du under.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {fmt(shownTotal)} {currency}
          </p>
          <div className="flex flex-col items-end text-xs text-muted-foreground mt-0.5">
            <span>Lisenser: {fmt(shownLicense * 12)} {currency}/år</span>
            {shownAdvisory > 0 && (
              <span>Rådgivningstimer: {fmt(shownAdvisory)} {currency} (engangs)</span>
            )}
          </div>
        </div>
      </div>

      {isEstimate ? (
        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          {/* ── Aktiverte produkter (lisenser) ── */}
          <div className="rounded-md border border-border bg-background p-3 flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Aktiverte produkter</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        Basert på minstepris for alle Mynder-produkter (moduler og regelverk)
                        summert per år (12 × månedspris). Rådgivningstimer regnes ut fra regelverkene du velger under.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alle Mynder-produkter — minstepris moduler {fmt(productLicense)} {currency} +{" "}
                  {options.length} regelverk {fmt(allFrameworkLicense)} {currency}
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                {fmt(licensePotential * 12)} {currency}/år
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs font-normal"
                >
                  <span className="truncate">Regelverk for rådgivningstimer: {selectedLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-2">
                <p className="text-[11px] text-muted-foreground px-2 pb-1.5">
                  Velg hvilke regelverk som inngår i rådgivningstimer-estimatet
                </p>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {options.map((o) => {
                    const checked = selectedIds.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => toggleFramework(o.id, c === true)}
                        />
                        <span className="flex-1 text-xs text-foreground truncate">{o.name}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Rådgivningstimer ── */}
          <div className="rounded-md border border-border bg-background p-3 flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-foreground">Rådgivningstimer</p>
                  {isLara && laraComplete && (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[10px] px-1.5 py-0 h-4 font-medium"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      Estimert av Lara
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        {isLara ? (
                          laraComplete ? (
                            <span className="block space-y-1">
                              <span className="block">
                                Lara har anslått tid per krav ut fra typisk gjennomføringstid:
                              </span>
                              {selected.map((fw) => (
                                <span key={fw.id} className="block tabular-nums">
                                  {fw.name}: {fmt(Math.round(validAiEstimates.get(fw.id)?.totalHours ?? 0))} t
                                </span>
                              ))}
                            </span>
                          ) : (
                            "Lara anslår tid per krav. Noen regelverk mangler estimat ennå — de regnes med 1 t per krav inntil du genererer estimatet."
                          )
                        ) : (
                          "Timer per krav × antall krav i de valgte regelverkene × timeprisen din. Utgangspunktet er 1 time per krav — juster i estimatsinnstillingene (tannhjulet)."
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLara
                    ? laraComplete
                      ? `${selected.length} regelverk · totalt ${fmt(advisoryHours)} t`
                      : `${validAiEstimates.size} av ${selected.length} regelverk estimert · totalt ${fmt(advisoryHours)} t`
                    : `${selected.length} regelverk · ${hoursPerReq} t per krav · totalt ${advisoryHours} t${hoursPerReqOverride === null ? " (auto)" : ""}`}
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                {fmt(advisoryPotential)} {currency}
              </p>
            </div>

            {isLara && !laraComplete && selected.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={runLaraEstimate}
                disabled={estimating}
              >
                {estimating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                )}
                {estimating ? "Lara estimerer…" : "Estimer med Lara"}
              </Button>
            )}
            {estimateError && !estimating && (
              <p className="text-[11px] text-destructive">{estimateError}</p>
            )}
          </div>
        </div>
      ) : activePackages.length === 0 ? (
        /* ── Tom tilstand: ingen aktiverte pakker ── */
        <div className="mt-4 rounded-md border border-dashed border-border bg-background p-6 flex flex-col items-center text-center gap-2">
          <Package className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Du har ikke aktivert noen regelverkpakker ennå
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            Aktiver et regelverk og sett opp rådgivningspakken med dine egne timer og priser — da
            vises det reelle salgspotensialet ditt her.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 gap-1.5"
            onClick={scrollToPackagesSection}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Gå til regelverk og rådgivningspakker
          </Button>
        </div>
      ) : (
        /* ── Mine aktiverte pakker ── */
        <>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div className="rounded-md border border-border bg-background p-3 flex items-start gap-3">
              <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Lisenser</p>
                <p className="text-xs text-muted-foreground">
                  {activePackages.length} aktivert{activePackages.length === 1 ? "" : "e"} regelverk
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                {fmt(pkgLicense * 12)} {currency}/år
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-3 flex items-start gap-3">
              <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Rådgivningstimer</p>
                <p className="text-xs text-muted-foreground">
                  {pkgHours} t totalt — dine egne timer og priser
                </p>
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                {fmt(pkgAdvisory)} {currency}
              </p>
            </div>
          </div>

          {/* Liste over aktiverte pakker */}
          <div className="mt-3 rounded-md border border-border bg-background divide-y divide-border">
            {activePackages.map((p) => (
              <div key={p.framework_id} className="flex items-center gap-3 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                  {p.name}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  Lisens {fmt(p.licenseKr)} {currency}/mnd
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                  {p.total_hours || 0} t · {fmt(p.total_price || 0)} {currency}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={scrollToPackagesSection}
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Rediger pakkene dine
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
