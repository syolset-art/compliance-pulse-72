import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanSearch, ClipboardCheck, ArrowRight, Sparkles } from "lucide-react";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";

export interface GapAnalysisRecord {
  frameworkId: string;
  ranAt: string;
  totalGaps: number;
  criticalGaps: number;
  linkedQuestionnaireServiceId?: string;
}

const STORAGE_PREFIX = "msp.customer.gapAnalysis.";
const FW_STORAGE_PREFIX = "msp.customer.activatedFrameworks.";

function loadGapRecords(customerId: string): Record<string, GapAnalysisRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveGapRecords(customerId: string, records: Record<string, GapAnalysisRecord>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(records));
  } catch {}
}

function loadActivatedIds(customerId: string, fallbackIds: string[]): string[] {
  try {
    const raw = localStorage.getItem(FW_STORAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === "string") return parsed as string[];
        return (parsed as Array<{ id: string }>).map((r) => r.id);
      }
    }
  } catch {}
  return fallbackIds;
}

function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "i dag";
  if (days === 1) return "1 dag siden";
  return `${days} dager siden`;
}

function findQuestionnaireServiceForFramework(frameworkId: string) {
  return PARTNER_SERVICES.find(
    (s) =>
      s.deliveryType === "questionnaire" &&
      !!s.questionnaireId &&
      s.frameworkMappings.some((m) => m.frameworkId === frameworkId),
  );
}

interface Props {
  customerId: string;
  activeFrameworkIds: string[];
  onVerifyWithQuestionnaire: (frameworkId: string, frameworkName: string, serviceId: string) => void;
  /** Optional ref so parent can trigger first available framework dialog */
  registerStartHandler?: (handler: () => void) => void;
}

export function RegulationGapAnalysisCard({
  customerId,
  activeFrameworkIds,
  onVerifyWithQuestionnaire,
  registerStartHandler,
}: Props) {
  const fallbackIds = useMemo(
    () => loadActivatedIds(customerId, activeFrameworkIds),
    [customerId, activeFrameworkIds],
  );
  const items = useMemo(
    () => ALL_FRAMEWORKS.filter((f) => fallbackIds.includes(f.id)),
    [fallbackIds],
  );

  const [records, setRecords] = useState<Record<string, GapAnalysisRecord>>(() =>
    loadGapRecords(customerId),
  );
  const [openFrameworkId, setOpenFrameworkId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(loadGapRecords(customerId));
  }, [customerId]);

  useEffect(() => {
    registerStartHandler?.(() => {
      if (items.length > 0) setOpenFrameworkId(items[0].id);
    });
  }, [registerStartHandler, items]);

  const handleDialogClose = (open: boolean) => {
    if (open || !openFrameworkId) {
      if (!open) setOpenFrameworkId(null);
      return;
    }
    // Persist a synthetic record so the row shows "fullført".
    const next: Record<string, GapAnalysisRecord> = {
      ...records,
      [openFrameworkId]: {
        frameworkId: openFrameworkId,
        ranAt: new Date().toISOString(),
        totalGaps: records[openFrameworkId]?.totalGaps ?? 9,
        criticalGaps: records[openFrameworkId]?.criticalGaps ?? 3,
        linkedQuestionnaireServiceId: records[openFrameworkId]?.linkedQuestionnaireServiceId,
      },
    };
    setRecords(next);
    saveGapRecords(customerId, next);
    setOpenFrameworkId(null);
  };

  if (items.length === 0) return null;

  return (
    <>
      <Card className="p-5 border-border">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ScanSearch className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Lara gap-analyse</h3>
            <p className="text-sm text-muted-foreground">
              Kjør gap-analyse pr aktivert regelverk. Resultatet kan verifiseres med spørreskjema til kunden.
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {items.map((f) => {
            const rec = records[f.id];
            const service = findQuestionnaireServiceForFramework(f.id);
            return (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                    {rec ? (
                      <Badge variant="outline" className="text-sm gap-1">
                        <Sparkles className="h-3 w-3" />
                        {rec.totalGaps} gap
                        {rec.criticalGaps > 0 && <> · {rec.criticalGaps} kritiske</>}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-sm text-muted-foreground">
                        Ikke kjørt
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {rec ? `Sist kjørt ${formatRelative(rec.ranAt)}` : "Klar for kjøring"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rec && service && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => onVerifyWithQuestionnaire(f.id, f.name, service.id)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Verifiser
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={rec ? "outline" : "default"}
                    className="gap-1.5"
                    onClick={() => setOpenFrameworkId(f.id)}
                  >
                    {rec ? "Kjør på nytt" : "Kjør gap-analyse"}
                    {!rec && <ArrowRight className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <MSPGapAnalysisDialog
        open={!!openFrameworkId}
        onOpenChange={handleDialogClose}
        initialFrameworkId={openFrameworkId ?? undefined}
      />
    </>
  );
}
