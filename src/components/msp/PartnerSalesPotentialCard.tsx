import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Package, Clock, Info, ChevronDown, CheckCircle2, ArrowDown } from "lucide-react";
import { MYNDER_PRODUCTS } from "@/lib/mynderProducts";
import { frameworkLicensePrice } from "@/lib/planConstants";
import { frameworks as FRAMEWORK_DEFS } from "@/lib/frameworkDefinitions";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("nb-NO");

const LS_FRAMEWORKS = "msp.salesPotential.frameworks";
const LS_RATE = "msp.salesPotential.hourlyRate";
const LS_HOURS_PER_REQ = "msp.salesPotential.hoursPerRequirement";
const LS_VIEW = "msp.salesPotential.view";

const DEFAULT_FRAMEWORKS = ["gdpr"];
const DEFAULT_HOURLY_RATE = 1500;
const DEFAULT_HOURS_PER_REQ = 1;

type ViewMode = "estimate" | "packages";

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
 *   valgte regelverk og timer pr. krav × timepris.
 * - «Mine aktiverte pakker»: basert på partnerens egne lagrede og aktiverte
 *   regelverkpakker (msp_framework_packages) — reelle timer og priser partneren
 *   selv har satt opp.
 */
export function PartnerSalesPotentialCard({ currency }: { currency: string }) {
  const { defaultHourlyRate } = useServiceDefaults();
  const { packages } = useFrameworkPackages();

  const [view, setView] = useState<ViewMode>(
    () => readJson<ViewMode>(LS_VIEW) ?? "estimate",
  );

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

  const selected = options.filter((o) => selectedIds.includes(o.id));

  const toggleFramework = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((f) => f !== id)));
  };

  // ── Estimert potensial ──
  const productLicense = MYNDER_PRODUCTS.filter((p) => p.id !== "frameworks").reduce(
    (sum, p) => sum + p.fromPrice,
    0,
  );
  const frameworkLicense = selected.reduce((sum, f) => sum + f.priceKr, 0);
  const licensePotential = productLicense + frameworkLicense;

  const totalControlPoints = selected.reduce((sum, f) => sum + f.controlPoints, 0);
  const hoursPerReq = hoursPerReqOverride ?? DEFAULT_HOURS_PER_REQ;
  const advisoryHours = Math.round(totalControlPoints * hoursPerReq);
  const advisoryPotential = advisoryHours * (hourlyRate || 0);

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
            <div className="flex items-center gap-3 flex-wrap">
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
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              {isEstimate
                ? "Hva du kan selge til én kunde — fordelt på lisenser fra Mynder (minstepris) og dine egne rådgivningstimer. Tilpass regelverk og timepris nedenfor."
                : "Basert på regelverkpakkene du selv har aktivert og satt opp — med dine egne timer og priser, ikke estimater."}
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
            <span>Lisenser: {fmt(shownLicense)} {currency}/mnd</span>
            {shownAdvisory > 0 && (
              <span>Rådgivningstimer: {fmt(shownAdvisory)} {currency} (engangs)</span>
            )}
          </div>
        </div>
      </div>

      {isEstimate ? (
        <>
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
                          Basert på minstepris for hvert Mynder-produkt, pluss månedspris for regelverkene
                          du velger. Regelverk kan ha ulik pris — GDPR er standard startpunkt.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minstepris moduler {fmt(productLicense)} {currency} + {selected.length} regelverk{" "}
                    {fmt(frameworkLicense)} {currency}
                  </p>
                </div>
                <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                  {fmt(licensePotential)} {currency}/mnd
                </p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs font-normal"
                  >
                    <span className="truncate">Regelverk i potensialet: {selectedLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  <p className="text-[11px] text-muted-foreground px-2 pb-1.5">
                    Velg hvilke regelverk kunden aktiverer
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
                          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                            {fmt(o.priceKr)} {currency}/mnd
                          </span>
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">Rådgivningstimer</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          Timer per krav × antall krav i de aktiverte regelverkene × timeprisen din.
                          Alle regelverk må aktiveres — antallet følger «Aktiverte produkter».
                          Utgangspunktet er 1 time per krav — juster selv opp eller ned.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selected.length} regelverk · {hoursPerReq} t per krav · totalt {advisoryHours} t
                    {hoursPerReqOverride === null && " (auto)"}
                  </p>
                </div>
                <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
                  {fmt(advisoryPotential)} {currency}
                </p>
              </div>
            </div>
          </div>

          {/* ── Grunnlag for rådgivningstimer ── plassert nederst for bedre balanse i kortet */}
          <div className="mt-4 rounded-md border border-border bg-background p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Grunnlag for rådgivningstimer</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
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
              <div className="flex items-center gap-1.5">
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
            </div>
          </div>
        </>
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
                {fmt(pkgLicense)} {currency}/mnd
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
