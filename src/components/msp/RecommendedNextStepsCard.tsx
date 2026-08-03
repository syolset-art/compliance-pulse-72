import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Shield,
  FileWarning,
  ListChecks,
  Wrench,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { useBaselineDocuments } from "@/hooks/useBaselineDocuments";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import {
  buildNextActions,
  getDocumentStatus,
  type NextAction,
  type NextActionKind,
  type RegulationStatus,
} from "@/lib/maturityNextActions";
import {
  toDeliverables,
  summarizePotential,
  formatPriceRange,
} from "@/lib/documentDeliverables";

interface Props {
  customerId: string;
  activeFrameworkIds: string[];
  recommended: FrameworkRecommendation[];
  confirmed: FrameworkRecommendation[];
  /** Åpner den fulle listen med produkter og tjenester. */
  onShowAll?: () => void;
}

const KIND_ICON: Record<NextActionKind, typeof Shield> = {
  confirm: Shield,
  activate: Shield,
  assessment: ListChecks,
  documentation: FileWarning,
  service: Wrench,
};

const KIND_LABEL: Record<NextActionKind, string> = {
  confirm: "Produkt",
  activate: "Produkt",
  assessment: "Aktivitet",
  documentation: "Dokumentasjon",
  service: "Tjeneste",
};

interface Row {
  frameworkId: string;
  label: string;
  status: RegulationStatus;
  action: NextAction;
  potential?: string;
  /** Sorteringsvekt — lavere først. */
  weight: number;
}

const STATUS_WEIGHT: Record<RegulationStatus, number> = {
  recommended: 0,
  confirmed: 1,
  active: 2,
};

const KIND_WEIGHT: Record<NextActionKind, number> = {
  confirm: 0,
  activate: 0,
  documentation: 1,
  assessment: 2,
  service: 3,
};

export function RecommendedNextStepsCard({
  customerId,
  activeFrameworkIds,
  recommended,
  confirmed,
  onShowAll,
}: Props) {
  const { answers } = useCustomerBaseline(customerId);
  const { documents } = useBaselineDocuments(customerId);
  const { defaultHourlyRate, currency } = useServiceDefaults();

  const documentCountByArea = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach((d) => {
      map[d.areaId] = (map[d.areaId] ?? 0) + 1;
    });
    return map;
  }, [documents]);

  const uploadedFileNames = useMemo(() => documents.map((d) => d.fileName), [documents]);

  const servicesFor = (frameworkId: string) => {
    const inCatalog = PARTNER_SERVICES.filter((s) =>
      ((s as any).frameworkMappings ?? (s as any).mappings ?? []).some(
        (m: any) => m.frameworkId === frameworkId,
      ),
    ).map((s) => ({ id: s.id, name: s.name, inCatalog: true }));
    const suggested = SERVICE_LIBRARY.filter(
      (s) =>
        ((s as any).frameworkMappings ?? (s as any).mappings ?? []).some(
          (m: any) => m.frameworkId === frameworkId,
        ) && !inCatalog.some((c) => c.name.toLowerCase() === s.name.toLowerCase()),
    ).map((s) => ({ id: s.id, name: s.name, inCatalog: false }));
    return [...inCatalog, ...suggested];
  };

  const rows = useMemo<Row[]>(() => {
    const entries: { frameworkId: string; label: string; status: RegulationStatus }[] = [
      ...activeFrameworkIds.map((id) => ({
        frameworkId: id,
        label: ALL_FRAMEWORKS.find((f) => f.id === id)?.name || id.toUpperCase(),
        status: "active" as RegulationStatus,
      })),
      ...confirmed
        .filter((c) => !activeFrameworkIds.includes(c.frameworkId))
        .map((c) => ({
          frameworkId: c.frameworkId,
          label: c.label,
          status: "confirmed" as RegulationStatus,
        })),
      ...recommended
        .filter((r) => !activeFrameworkIds.includes(r.frameworkId))
        .map((r) => ({
          frameworkId: r.frameworkId,
          label: r.label,
          status: "recommended" as RegulationStatus,
        })),
    ];

    const out: Row[] = [];
    entries.forEach((e) => {
      const actions = buildNextActions({
        frameworkId: e.frameworkId,
        label: e.label,
        status: e.status,
        answers,
        documentCountByArea,
        uploadedFileNames,
        services: servicesFor(e.frameworkId),
        limit: 2,
      });

      const missing = toDeliverables(
        getDocumentStatus(e.frameworkId, uploadedFileNames).filter((d) => !d.present),
        defaultHourlyRate,
      );
      const potential = summarizePotential(missing);

      actions
        .filter((a) => a.id !== `${e.frameworkId}:ok`)
        .forEach((a) => {
          out.push({
            frameworkId: e.frameworkId,
            label: e.label,
            status: e.status,
            action: a,
            potential:
              a.kind === "documentation" && potential.count > 0
                ? formatPriceRange(potential.price, currency)
                : undefined,
            weight: STATUS_WEIGHT[e.status] * 10 + KIND_WEIGHT[a.kind],
          });
        });
    });

    return out.sort((a, b) => a.weight - b.weight).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeFrameworkIds,
    confirmed,
    recommended,
    answers,
    documentCountByArea,
    uploadedFileNames,
    defaultHourlyRate,
    currency,
  ]);

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Anbefalt for økt modenhet</h2>
        <span className="text-xs text-muted-foreground">{rows.length} forslag fra Lara</span>
        {onShowAll && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={onShowAll}
          >
            Vis alle tilgjengelige
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-success" />
          Ingen åpne tiltak — kunden er i god rute.
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {rows.map((r) => {
            const Icon = KIND_ICON[r.action.kind];
            return (
              <div
                key={`${r.frameworkId}-${r.action.id}`}
                className="flex items-start justify-between gap-3 px-3 py-2.5"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{r.action.text}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {r.label}
                      {r.action.detail ? ` · ${r.action.detail}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.potential && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {r.potential}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] font-medium",
                      r.action.kind === "service" && "bg-primary/10 text-primary border-primary/30",
                    )}
                  >
                    {KIND_LABEL[r.action.kind]}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
