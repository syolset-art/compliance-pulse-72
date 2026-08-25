import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Scale, Clock, ChevronRight, CheckCircle2, ChevronDown, Search } from "lucide-react";
import { frameworks as FRAMEWORK_DEFS } from "@/lib/frameworkDefinitions";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { formatPriceRange } from "@/lib/documentDeliverables";
import { EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import {
  buildFrameworkTasks,
  resolveTasks,
  summarizePackage,
  loadPackageState,
  packageHours,
  packagePrice,
  type RequirementRow,
} from "@/lib/frameworkTaskPackage";
import {
  MSPFrameworkTaskPackageSheet,
  type SavedFrameworkPackage,
} from "./MSPFrameworkTaskPackageSheet";

const fmt = (n: number) => n.toLocaleString("nb-NO");

export function MSPFrameworkHoursTab({
  onSaveAsService,
  openFrameworkId = null,
  onOpenedFramework,
}: {
  onSaveAsService?: (pkg: SavedFrameworkPackage) => void;
  openFrameworkId?: string | null;
  onOpenedFramework?: () => void;
}) {
  const { defaultHourlyRate, currency } = useServiceDefaults();
  const { packages, savePackage, setActive: setPackageActive } = useFrameworkPackages();
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!openFrameworkId) return;
    const fw = FRAMEWORK_DEFS.find((f) => f.id === openFrameworkId);
    if (fw) setActive({ id: fw.id, name: fw.name });
    onOpenedFramework?.();
  }, [openFrameworkId, onOpenedFramework]);

  const { data: rows = [] } = useQuery({
    queryKey: ["all-compliance-requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_requirements")
        .select("framework_id, requirement_id, name_no, category");
      if (error) return [] as RequirementRow[];
      return (data ?? []) as unknown as RequirementRow[];
    },
  });

  const items = useMemo(() => {
    const byFramework = new Map<string, RequirementRow[]>();
    rows.forEach((r) => {
      const list = byFramework.get(r.framework_id) ?? [];
      list.push(r);
      byFramework.set(r.framework_id, list);
    });

    // Noen regelverk er definert flere ganger (samme id) — vis kun første forekomst.
    const seen = new Set<string>();
    const defs = FRAMEWORK_DEFS.filter((fw) => {
      if (seen.has(fw.id)) return false;
      seen.add(fw.id);
      return true;
    });

    return defs.map((fw) => {
      const dbReqs = byFramework.get(fw.id) ?? [];
      const estimated = dbReqs.length === 0;
      const reqs = estimated ? baselineRequirementRows(fw.id) : dbReqs;
      const saved = packages[fw.id];
      const base = buildFrameworkTasks(reqs);
      // Bruk lagret pakke fra databasen hvis den finnes, ellers lokal fallback.
      const state = saved?.state ?? loadPackageState(fw.id);
      const resolved = resolveTasks(base, state, defaultHourlyRate);
      const totals = summarizePackage(resolved);
      const advisoryPrice = saved ? saved.total_price : packagePrice(totals);
      const advisoryHours = saved ? saved.total_hours : packageHours(totals);
      return {
        fw,
        requirements: reqs.length,
        totals,
        estimated,
        saved,
        advisoryPrice,
        advisoryHours,
        state,
      };
    })
      .filter((i) => i.requirements > 0 || i.totals.tasks > 0)
      .sort((a, b) => b.requirements - a.requirements);
  }, [rows, defaultHourlyRate, packages]);


  const activeItem = active ? items.find((i) => i.fw.id === active.id) : undefined;

  const query = search.trim().toLowerCase();
  const visibleItems = query
    ? items.filter(
        ({ fw, saved }) =>
          fw.name.toLowerCase().includes(query) ||
          (saved?.state?.customName ?? "").toLowerCase().includes(query),
      )
    : items;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowHowItWorks((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${showHowItWorks ? "rotate-180" : ""}`}
        />
        Slik fungerer det
      </button>

      {showHowItWorks && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="flex items-start gap-2.5">
            <Scale className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Slik fungerer det</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Åpne et regelverk for å aktivere det og sette opp rådgivningspakken: alle krav med
                AI-foreslåtte timer fra Lara. Fjern krav du ikke vil jobbe med, juster timer og
                lagre pakken. Pakken dukker opp som ferdig forslag når du lager tilbud til kunder.
                Timepris hentes fra innstillingene ({fmt(defaultHourlyRate)} {currency}/time).
              </p>
            </div>
          </div>
        </Card>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const first = visibleItems[0];
          if (first) setActive({ id: first.fw.id, name: first.fw.name });
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter regelverk – f.eks. ISO 27001, DORA"
            className="h-9 pl-8 text-sm"
            aria-label="Søk etter regelverk"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-9 shrink-0"
          disabled={visibleItems.length === 0}
        >
          Opprett tjenestepakke
        </Button>
      </form>

      {query && visibleItems.length === 0 && (
        <p className="text-xs text-muted-foreground">Fant ingen regelverk som matcher «{search}».</p>
      )}

      <div className="grid gap-2">

        {visibleItems.map(({ fw, requirements, totals, saved, advisoryPrice }) => (
          <Card
            key={fw.id}
            className="p-3.5 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => setActive({ id: fw.id, name: fw.name })}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {saved?.state?.customName?.trim() || fw.name}
                  </span>
                  {saved?.state?.customName?.trim() && (
                    <span className="text-[11px] text-muted-foreground">({fw.name})</span>
                  )}
                  {fw.isMandatory && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Obligatorisk
                    </Badge>
                  )}
                  {saved?.is_active && (
                    <Badge className="text-[10px] font-normal gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Aktivert
                    </Badge>
                  )}
                  {saved && !saved.is_active && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Pakke lagret
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {requirements} krav · {totals.tasks} oppgaver · Lisens{" "}
                  {fmt(EXTRA_FRAMEWORK_PRICE_KR)} {currency}/mnd
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  Rådgivning {fmt(advisoryPrice)} {currency}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatPriceRange(totals.price, currency)} (estimat)
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2" aria-label={`Åpne ${fw.name}`}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <MSPFrameworkTaskPackageSheet
        frameworkId={active?.id ?? null}
        frameworkName={active?.name ?? ""}
        open={Boolean(active)}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
        hourlyRate={defaultHourlyRate}
        currency={currency}
        initialState={activeItem?.state ?? null}
        isActive={activeItem?.saved?.is_active ?? false}
        isSaved={Boolean(activeItem?.saved)}
        onToggleActive={(isActive) => {
          if (!active || !activeItem) return;
          void setPackageActive({
            frameworkId: active.id,
            frameworkName: active.name,
            isActive,
            state: activeItem.state,
            totalHours: activeItem.advisoryHours,
            totalPrice: activeItem.advisoryPrice,
          });
        }}
        onSavePackage={(pkg, state) => {
          void savePackage({
            frameworkId: pkg.frameworkId,
            frameworkName: pkg.frameworkName,
            state,
            totalHours: pkg.hours,
            totalPrice: pkg.price,
            isActive: true,
          });
        }}
        onSaveAsService={onSaveAsService}
      />
    </div>
  );
}
