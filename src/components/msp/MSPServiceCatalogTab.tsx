import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  FRAMEWORK_CATALOG,
  type CoverageLevel,
} from "@/lib/frameworkCoverageCatalog";
import {
  FrameworkCoverageCard,
  type FrameworkSelection,
} from "./FrameworkCoverageCard";

type AllSelections = Record<string, FrameworkSelection>;

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

export function MSPServiceCatalogTab() {
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [selections, setSelections] = useState<AllSelections>(() => {
    // Demo-seed: NIS2 valgt med delvis dekning på alle KP
    const init: AllSelections = {};
    const nis2 = FRAMEWORK_CATALOG.find((f) => f.id === "nis2");
    if (nis2) {
      const s: FrameworkSelection = {};
      nis2.controlPoints.forEach((cp) => {
        s[cp.id] = {
          enabled: true,
          level: "partial" as CoverageLevel,
          hours: cp.hoursByLevel.partial,
        };
      });
      init.nis2 = s;
    }
    return init;
  });

  const { grandHours, grandPrice, frameworksActive } = useMemo(() => {
    let h = 0;
    let n = 0;
    FRAMEWORK_CATALOG.forEach((fw) => {
      const sel = selections[fw.id];
      if (!sel) return;
      let fwHours = 0;
      let fwActive = false;
      fw.controlPoints.forEach((cp) => {
        const s = sel[cp.id];
        if (s?.enabled) {
          fwHours += s.hours;
          fwActive = true;
        }
      });
      h += fwHours;
      if (fwActive) n += 1;
    });
    return { grandHours: h, grandPrice: h * hourlyRate, frameworksActive: n };
  }, [selections, hourlyRate]);

  return (
    <div className="space-y-4">
      {/* Toppkort: timepris + samlet inntektspotensial */}
      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="grid items-end gap-4 md:grid-cols-[260px_1fr_auto]">
          {/* Timepris */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Din timepris
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={50}
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(Math.max(0, Number(e.target.value) || 0))
                }
                className="h-11 text-lg font-semibold tabular-nums"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">kr / time</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Brukes som standard for alle regelverk under.
            </p>
          </div>

          {/* Forklaring */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Si hva dere leverer — Lara regner ut inntektspotensialet
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Slå på regelverkene dere leverer på, hak av kontrollpunkter, og velg dekningsnivå:
              <span className="font-medium text-foreground"> Gap-analyse</span>,
              <span className="font-medium text-foreground"> Delvis dekning</span> eller
              <span className="font-medium text-foreground"> Full dekning</span>.
              Lara foreslår timetall — du kan justere fritt.
            </p>
          </div>

          {/* Totalt inntektspotensial */}
          <div className="text-right md:border-l md:border-border md:pl-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-end">
              <TrendingUp className="h-3 w-3" /> Samlet potensial
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formatNOK(grandPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {grandHours} timer · {frameworksActive} regelverk
            </div>
          </div>
        </div>
      </Card>

      {/* Regelverk-liste */}
      <div className="space-y-2">
        {FRAMEWORK_CATALOG.map((fw) => (
          <FrameworkCoverageCard
            key={fw.id}
            framework={fw}
            hourlyRate={hourlyRate}
            selection={selections[fw.id] ?? {}}
            onSelectionChange={(next) =>
              setSelections((prev) => ({ ...prev, [fw.id]: next }))
            }
          />
        ))}
      </div>
    </div>
  );
}
