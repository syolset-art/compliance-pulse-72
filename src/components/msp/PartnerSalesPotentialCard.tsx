import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Package, Clock, Info, ChevronDown } from "lucide-react";
import { MYNDER_PRODUCTS } from "@/lib/mynderProducts";
import { frameworkLicensePrice } from "@/lib/planConstants";
import { frameworks as FRAMEWORK_DEFS } from "@/lib/frameworkDefinitions";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";

const fmt = (n: number) => n.toLocaleString("nb-NO");

const LS_FRAMEWORKS = "msp.salesPotential.frameworks";
const LS_RATE = "msp.salesPotential.hourlyRate";
const LS_HOURS_PER_REQ = "msp.salesPotential.hoursPerRequirement";

const DEFAULT_FRAMEWORKS = ["gdpr"];
const DEFAULT_HOURLY_RATE = 1500;
const DEFAULT_HOURS_PER_REQ = 1;

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

/**
 * Samlet salgspotensial for partneren — øverst på «Produkter og tjenester».
 *
 * Lisenspotensial: minstepris på Mynder-produktene + valgte regelverk
 * (regelverk kan ha ulik pris — GDPR er standardutgangspunkt, partneren kan
 * legge til flere selv).
 *
 * Rådgivningspotensial: timer per krav (standard 1, redigerbart) × antall krav
 * i de aktiverte regelverkene × timepris (redigerbar). Antall regelverk i
 * rådgivningspakken følger alltid de aktiverte regelverkene over.
 */
export function PartnerSalesPotentialCard({ currency }: { currency: string }) {
  const { defaultHourlyRate } = useServiceDefaults();

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

  const selected = options.filter((o) => selectedIds.includes(o.id));

  const toggleFramework = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((f) => f !== id)));
  };

  // Lisens: minstepris på produktene + pris per valgt regelverk.
  const productLicense = MYNDER_PRODUCTS.filter((p) => p.id !== "frameworks").reduce(
    (sum, p) => sum + p.fromPrice,
    0,
  );
  const frameworkLicense = selected.reduce((sum, f) => sum + f.priceKr, 0);
  const licensePotential = productLicense + frameworkLicense;

  // Rådgivning: timer per krav (auto = 1 t per krav, kan overstyres) × antall
  // krav i de aktiverte regelverkene × timepris. Antall regelverk følger
  // alltid «Aktiverte produkter» — alle regelverk må aktiveres.
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

  return (
    <Card className="p-5 border-primary/20 bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Salgspotensial per kunde</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              Hva du kan selge til én kunde — fordelt på lisenser fra Mynder (minstepris) og dine
              egne rådgivningstimer. Tilpass regelverk og timepris nedenfor.
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-0.5">
          <p className="text-[11px] text-muted-foreground">Totalt potensial</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {fmt(licensePotential)} {currency}/mnd
            {advisoryPotential > 0 && (
              <span className="text-base font-semibold text-muted-foreground">
                {" "}+ {fmt(advisoryPotential)} {currency}
              </span>
            )}
          </p>
          <div className="flex flex-col items-end text-xs text-muted-foreground mt-0.5">
            <span>Lisenser: {fmt(licensePotential)} {currency}/mnd</span>
            {advisoryPotential > 0 && (
              <span>Rådgivningstimer: {fmt(advisoryPotential)} {currency}</span>
            )}
          </div>
        </div>
      </div>

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
    </Card>
  );
}
