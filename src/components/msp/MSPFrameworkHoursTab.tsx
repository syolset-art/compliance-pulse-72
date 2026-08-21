import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Clock, ChevronRight } from "lucide-react";
import { frameworks as FRAMEWORK_DEFS } from "@/lib/frameworkDefinitions";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { formatPriceRange } from "@/lib/documentDeliverables";
import {
  buildFrameworkTasks,
  resolveTasks,
  summarizePackage,
  loadPackageState,
  type RequirementRow,
} from "@/lib/frameworkTaskPackage";
import {
  MSPFrameworkTaskPackageSheet,
  type SavedFrameworkPackage,
} from "./MSPFrameworkTaskPackageSheet";

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
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [version, setVersion] = useState(0);

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

    return FRAMEWORK_DEFS.map((fw) => {
      const dbReqs = byFramework.get(fw.id) ?? [];
      const estimated = dbReqs.length === 0;
      const reqs = estimated ? baselineRequirementRows(fw.id) : dbReqs;
      const base = buildFrameworkTasks(reqs);
      const resolved = resolveTasks(base, loadPackageState(fw.id), defaultHourlyRate);
      const totals = summarizePackage(resolved);
      return { fw, requirements: reqs.length, totals, estimated };
    })
      .filter((i) => i.requirements > 0 || i.totals.tasks > 0)
      .sort((a, b) => b.requirements - a.requirements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, defaultHourlyRate, version]);

  const totalRequirements = items.reduce((sum, i) => sum + i.requirements, 0);
  const totalPotential = totalRequirements * defaultHourlyRate;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-2.5">
            <Scale className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Timeleveranse per regelverk</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Åpne et regelverk for å se alle oppgaver som må gjøres for å dekke kravene. Juster
                timer, fjern det som ikke er relevant og lagre pakken som en tjeneste. Pris beregnes
                fra timeprisen i innstillingene ({defaultHourlyRate.toLocaleString("nb-NO")}{" "}
                {currency}/time).
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">Totalt salgspotensial</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">
              {totalPotential.toLocaleString("nb-NO")} {currency}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {totalRequirements.toLocaleString("nb-NO")} krav · 1 time per krav · eks. mva
            </p>
          </div>
        </div>
      </Card>


      <div className="grid gap-2">
        {items.map(({ fw, requirements, totals }) => (
          <Card
            key={fw.id}
            className="p-3.5 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => setActive({ id: fw.id, name: fw.name })}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{fw.name}</span>
                  {fw.isMandatory && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Obligatorisk
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {requirements} krav · {totals.tasks} oppgaver
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {totals.hours.min}–{totals.hours.max} t
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatPriceRange(totals.price, currency)}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2">
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
          if (!o) {
            setActive(null);
            setVersion((v) => v + 1);
          }
        }}
        hourlyRate={defaultHourlyRate}
        currency={currency}
        onSaveAsService={onSaveAsService}
      />
    </div>
  );
}
