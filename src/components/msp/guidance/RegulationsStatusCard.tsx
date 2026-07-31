import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Scale,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Upload,
  FileWarning,
  ListChecks,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { ActivateRegulationDialog } from "./ActivateRegulationDialog";
import { RegulationDetailDrawer } from "./RegulationDetailDrawer";
import { PartnerEvidenceUploadDialog } from "@/components/msp/PartnerEvidenceUploadDialog";
import { PartnerEvidenceSection } from "@/components/msp/PartnerEvidenceSection";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { useBaselineDocuments } from "@/hooks/useBaselineDocuments";
import {
  buildNextActions,
  getDocumentStatus,
  type NextAction,
  type RegulationStatus,
} from "@/lib/maturityNextActions";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import {
  toDeliverables,
  summarizePotential,
  formatPriceRange,
} from "@/lib/documentDeliverables";



interface Props {
  customerId: string;
  customerName: string;
  recommended: FrameworkRecommendation[];
  confirmed: FrameworkRecommendation[];
  activeFrameworkIds: string[];
  onGoToProducts: () => void;
  /** Åpner modenhetsvurderingen (spørreskjemaet). */
  onOpenAssessment?: () => void;
}

const MAX_CHIPS = 3;

export function RegulationsStatusCard({
  customerId,
  customerName,
  recommended,
  confirmed,
  activeFrameworkIds,
  onGoToProducts,
  onOpenAssessment,
}: Props) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activateDialog, setActivateDialog] = useState<{
    open: boolean;
    frameworkId?: string;
    label?: string;
  }>({ open: false });
  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    presetFrameworkIds?: string[];
  }>({ open: false });
  const [detail, setDetail] = useState<{
    open: boolean;
    frameworkId?: string;
    label?: string;
    status?: RegulationStatus;
  }>({ open: false });

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

  const activeSet = useMemo(() => new Set(activeFrameworkIds), [activeFrameworkIds]);

  const products = useMemo(
    () => [
      { key: "core", title: "Mynder Core", activated: true, meta: "21 systemer" },
      {
        key: "regulations",
        title: "Regelverk",
        activated: activeFrameworkIds.length > 0,
        meta:
          activeFrameworkIds.length > 0
            ? `${activeFrameworkIds.length} aktive`
            : undefined,
      },
      { key: "vendors", title: "Leverandørmodul", activated: true },
      { key: "assets", title: "Assets", activated: true },
      { key: "trust-profile", title: "Trust Profile", activated: true },
    ],
    [activeFrameworkIds],
  );




  const DEMO_ROWS: Array<{ rec: FrameworkRecommendation; isConfirmed: boolean }> = [
    {
      isConfirmed: true,
      rec: {
        frameworkId: "gdpr",
        label: "GDPR / Personvernforordningen",
        confidence: "high",
        reason: "Virksomhet i EØS som behandler personopplysninger om kunder og ansatte.",
      },
    },
    {
      isConfirmed: true,
      rec: {
        frameworkId: "nis2",
        label: "NIS2",
        confidence: "high",
        reason: "Bransje klassifisert som viktig enhet under NIS2 (IKT-tjenester).",
      },
    },
    {
      isConfirmed: false,
      rec: {
        frameworkId: "iso27001",
        label: "ISO/IEC 27001",
        confidence: "medium",
        reason: "Anbefalt styringssystem for informasjonssikkerhet basert på kundens tjenester.",
      },
    },
    {
      isConfirmed: false,
      rec: {
        frameworkId: "dora",
        label: "DORA",
        confidence: "medium",
        reason: "Mulig relevant hvis kunden leverer IKT-tjenester til finanssektoren.",
      },
    },
  ];

  const rows = recommended.length === 0 && confirmed.length === 0
    ? DEMO_ROWS
    : [
        ...confirmed.map((rec) => ({ rec, isConfirmed: true as const })),
        ...recommended.map((rec) => ({ rec, isConfirmed: false as const })),
      ].sort((a, b) => Number(b.isConfirmed) - Number(a.isConfirmed));

  const servicesFor = (frameworkId: string) => {
    const inCatalog = PARTNER_SERVICES.filter((s) =>
      ((s as any).frameworkMappings ?? (s as any).mappings ?? []).some((m: any) => m.frameworkId === frameworkId),
    ).map((s) => ({ id: s.id, name: s.name, inCatalog: true }));
    const suggested = SERVICE_LIBRARY.filter(
      (s) =>
        ((s as any).frameworkMappings ?? (s as any).mappings ?? []).some((m: any) => m.frameworkId === frameworkId) &&
        !inCatalog.some((c) => c.name.toLowerCase() === s.name.toLowerCase()),
    ).map((s) => ({ id: s.id, name: s.name, inCatalog: false }));
    return [...inCatalog, ...suggested];
  };

  const persist = async (
    nextConfirmed: FrameworkRecommendation[],
    nextRecommended: FrameworkRecommendation[],
  ) => {
    const { error } = await supabase
      .from("msp_customers" as any)
      .update({
        confirmed_frameworks: nextConfirmed as any,
        recommended_frameworks: nextRecommended as any,
      })
      .eq("id", customerId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] });
  };

  const confirmOne = async (rec: FrameworkRecommendation) => {
    setBusyId(rec.frameworkId);
    try {
      const nextConfirmed = [
        ...confirmed.filter((c) => c.frameworkId !== rec.frameworkId),
        { ...rec, confidence: "high" as const },
      ];
      const nextRecommended = recommended.filter((r) => r.frameworkId !== rec.frameworkId);
      await persist(nextConfirmed, nextRecommended);
      toast.success(`${rec.label} bekreftet`);
    } catch (e: any) {
      toast.error("Kunne ikke bekrefte", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const removeOne = async (rec: FrameworkRecommendation) => {
    setBusyId(rec.frameworkId);
    try {
      const nextConfirmed = confirmed.filter((c) => c.frameworkId !== rec.frameworkId);
      const nextRecommended = recommended.filter((r) => r.frameworkId !== rec.frameworkId);
      await persist(nextConfirmed, nextRecommended);
      toast.success(`${rec.label} fjernet`);
    } catch (e: any) {
      toast.error("Kunne ikke fjerne", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const activateOne = async (frameworkId: string, label: string) => {
    setBusyId(frameworkId);
    try {
      // Persist active frameworks locally (mirrors what MSPCustomerDetail reads).
      const key = `msp.customer.activatedFrameworks.${customerId}`;
      const raw = localStorage.getItem(key);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(parsed);
      set.add(frameworkId);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));

      // Also write to DB (best effort — soft-fail).
      try {
        const { data: cur } = await supabase
          .from("msp_customers" as any)
          .select("active_frameworks")
          .eq("id", customerId)
          .single();
        const existing: string[] = ((cur as any)?.active_frameworks || []) as string[];
        if (!existing.includes(label) && !existing.includes(frameworkId)) {
          await supabase
            .from("msp_customers" as any)
            .update({ active_frameworks: [...existing, label] } as any)
            .eq("id", customerId);
        }
      } catch {
        // ignore, local store is source of truth for demo
      }

      await queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] });
      toast.success(`${label} aktivert i Produkter`, {
        action: {
          label: "Se i Produkter",
          onClick: onGoToProducts,
        },
      });
    } catch (e: any) {
      toast.error("Kunne ikke aktivere", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Scale className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Regelverk anbefalt for denne kunden</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lara har gjort en enkel analyse av virksomhet og bransje.
              Forslagene genereres med AI og kan inneholde feil.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadDialog({ open: true })}
          className="h-7 gap-1.5 text-xs shrink-0"
        >
          <Upload className="h-3.5 w-3.5" />
          Last opp bevis
        </Button>
      </div>


      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Ingen regelverk foreslått ennå. Legg til bransje og land på kunden for at Lara skal foreslå relevante regelverk.
        </p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Regelverk</TableHead>
                <TableHead className="w-[16%]">Status</TableHead>
                <TableHead className="w-[44%]">Anbefalte tiltak for økt modenhet</TableHead>
                <TableHead className="w-[10%] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ rec, isConfirmed }) => {
                const isActive = activeSet.has(rec.frameworkId);
                const status: RegulationStatus = isActive
                  ? "active"
                  : isConfirmed
                    ? "confirmed"
                    : "recommended";
                const services = servicesFor(rec.frameworkId);
                const actions = buildNextActions({
                  frameworkId: rec.frameworkId,
                  label: rec.label,
                  status,
                  answers,
                  documentCountByArea,
                  uploadedFileNames,
                  services,
                });

                // Salgspotensial for dokumentene som mangler på dette regelverket.
                const missingDeliverables = toDeliverables(
                  getDocumentStatus(rec.frameworkId, uploadedFileNames).filter((d) => !d.present),
                  defaultHourlyRate,
                );
                const docPotential = summarizePotential(missingDeliverables);

                const runAction = (a: NextAction) => {
                  switch (a.kind) {
                    case "confirm":
                      confirmOne(rec);
                      break;
                    case "activate":
                      setActivateDialog({
                        open: true,
                        frameworkId: rec.frameworkId,
                        label: rec.label,
                      });
                      break;
                    case "assessment":
                      onOpenAssessment?.();
                      break;
                    case "documentation":
                      // Åpner detaljene der partneren kan generere utkast eller lage tilbud.
                      setDetail({
                        open: true,
                        frameworkId: rec.frameworkId,
                        label: rec.label,
                        status,
                      });
                      break;

                    default:
                      setDetail({
                        open: true,
                        frameworkId: rec.frameworkId,
                        label: rec.label,
                        status,
                      });
                  }
                };

                const openDetail = () =>
                  setDetail({
                    open: true,
                    frameworkId: rec.frameworkId,
                    label: rec.label,
                    status,
                  });

                return (
                  <TableRow
                    key={rec.frameworkId}
                    className="align-top cursor-pointer"
                    onClick={openDetail}
                  >
                    <TableCell className="py-3">
                      {(() => {
                        const [primary, ...aliasParts] = rec.label.split(/\s*[/·]\s*/);
                        const alias = aliasParts.join(" / ");
                        return (
                          <>
                            <div className="text-sm font-medium text-foreground leading-snug">
                              {primary}
                            </div>
                            {alias && (
                              <div className="text-xs text-muted-foreground leading-snug">
                                {alias}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {rec.reason}
                      </p>
                    </TableCell>

                    <TableCell className="py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                          <Check className="h-3.5 w-3.5" /> Aktivert
                        </span>
                      ) : isConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <Check className="h-3.5 w-3.5" /> Bekreftet
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Sparkles className="h-3 w-3" /> AI-anbefalt
                        </span>
                      )}
                      {!isActive && (
                        <div className="mt-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOne(rec);
                            }}
                            disabled={busyId === rec.frameworkId}
                            className="h-6 px-1 text-[11px] text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Ikke relevant
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <ul className="space-y-1">
                        {actions.map((a) => {
                          const Icon =
                            a.kind === "documentation"
                              ? FileWarning
                              : a.kind === "service"
                                ? Wrench
                                : a.kind === "assessment"
                                  ? ListChecks
                                  : Check;
                          return (
                            <li key={a.id}>
                              <button
                                type="button"
                                title={a.detail}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runAction(a);
                                }}
                                className="group flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-xs text-foreground/90 hover:bg-accent hover:text-primary"
                              >
                                <Icon
                                  className={cn(
                                    "h-3.5 w-3.5 mt-[1px] shrink-0",
                                    a.kind === "documentation"
                                      ? "text-warning"
                                      : a.kind === "confirm" || a.kind === "activate"
                                        ? "text-primary"
                                        : "text-muted-foreground",
                                  )}
                                />
                                <span className="leading-snug">
                                  {a.text}
                                  {a.kind === "documentation" && docPotential.count > 0 && (
                                    <span className="ml-1.5 whitespace-nowrap rounded bg-primary/10 px-1.5 py-[1px] text-[10px] font-medium tabular-nums text-primary">
                                      {formatPriceRange(docPotential.price, currency)} i potensial
                                    </span>
                                  )}
                                </span>

                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadDialog({
                              open: true,
                              presetFrameworkIds: [rec.frameworkId],
                            });
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          aria-label={`Last opp bevis for ${rec.label}`}
                          title="Last opp bevis for dette regelverket"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}


      {/* Opplastede bevis for denne kunden — kompakt liste */}
      <div className="mt-3">
        <PartnerEvidenceSection
          customerId={customerId}
          minimal
        />
      </div>

      {detail.frameworkId && (
        <RegulationDetailDrawer
          open={detail.open}
          onOpenChange={(o) => setDetail((s) => ({ ...s, open: o }))}
          customerId={customerId}
          customerName={customerName}

          frameworkId={detail.frameworkId}
          label={detail.label || ""}
          status={detail.status || "recommended"}
          services={servicesFor(detail.frameworkId)}
          products={products}
          onGoToProducts={onGoToProducts}
          onUpload={(fid) => setUploadDialog({ open: true, presetFrameworkIds: [fid] })}
        />
      )}

      <ActivateRegulationDialog
        open={activateDialog.open}
        onOpenChange={(o) => setActivateDialog((s) => ({ ...s, open: o }))}
        frameworkId={activateDialog.frameworkId || ""}
        frameworkLabel={activateDialog.label || ""}
        customerName={customerName}
        onConfirm={async () => {
          if (activateDialog.frameworkId && activateDialog.label) {
            await activateOne(activateDialog.frameworkId, activateDialog.label);
          }
        }}
      />

      <PartnerEvidenceUploadDialog
        open={uploadDialog.open}
        onOpenChange={(o) => setUploadDialog((s) => ({ ...s, open: o }))}
        customerId={customerId}
        presetFrameworkIds={uploadDialog.presetFrameworkIds}
      />
    </Card>
  );
}

