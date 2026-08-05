import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkActivateFrameworksDialog } from "./BulkActivateFrameworksDialog";
import { frameworks, type Framework } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";
import { ActiveFrameworksSummary } from "@/components/regulations/ActiveFrameworksSummary";
import { FrameworkChipSelector } from "@/components/regulations/FrameworkChipSelector";
import { FrameworkDetailCard } from "@/components/regulations/FrameworkDetailCard";
import { ComplianceHistoryChart } from "@/components/regulations/ComplianceHistoryChart";
import { FrameworkRequirementsList } from "@/components/regulations/FrameworkRequirementsList";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { FrameworkOrderConfirmDialog, type FrameworkOrderResult } from "./FrameworkOrderConfirmDialog";
import { FrameworkPreviewSheet } from "./FrameworkPreviewSheet";

interface Props {
  customerId: string;
  customerName: string;
  customer?: {
    industry?: string | null;
    employees?: string | null;
    country_code?: string | null;
    active_frameworks?: string[] | null;
    compliance_score?: number | null;
  };
}

const STORAGE_PREFIX = "msp.customer.activatedFrameworks.";

interface ActivatedRecord {
  id: string;
  orderedAt: string;
  method: "upload" | "declaration" | "legacy";
  evidenceName?: string;
  evidenceSize?: number;
  declarationText?: string;
}

function mapActiveFrameworkNames(names: string[] | null | undefined): string[] {
  if (!names?.length) return [];
  const ids: string[] = [];
  for (const n of names) {
    const norm = n.toLowerCase().replace(/[\s/-]/g, "");
    const match = frameworks.find((f) => {
      const fn = f.name.toLowerCase().replace(/[\s/-]/g, "");
      const fid = f.id.toLowerCase().replace(/[\s/-]/g, "");
      return fn.includes(norm) || norm.includes(fid) || fid === norm;
    });
    if (match) ids.push(match.id);
  }
  return ids;
}

function loadActivated(customerId: string, fallbackIds: string[]): ActivatedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === "string") {
          return (parsed as string[]).map((id) => ({
            id,
            orderedAt: new Date(0).toISOString(),
            method: "legacy" as const,
          }));
        }
        return parsed as ActivatedRecord[];
      }
    }
  } catch {}
  return fallbackIds.map((id) => ({
    id,
    orderedAt: new Date(0).toISOString(),
    method: "legacy" as const,
  }));
}

function saveActivated(customerId: string, records: ActivatedRecord[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(records));
  } catch {}
}

function computeRecommendations(customer?: Props["customer"]): Map<string, string> {
  const recs = new Map<string, string>();
  const push = (id: string, reason: string) => {
    if (!recs.has(id)) recs.set(id, reason);
  };

  push("gdpr", "Gjelder alle som behandler personopplysninger");
  push("personopplysningsloven", "Norsk utfyllende lov til GDPR");

  const industry = (customer?.industry || "").toLowerCase();
  const employees = customer?.employees || "";
  const empNum = parseInt(employees.split("-")[0] || employees.replace("+", ""), 10) || 0;

  if (industry.includes("helse")) {
    push("normen", "Obligatorisk bransjenorm for helsesektoren");
    push("iso27701", "Anbefalt for behandling av sensitive helseopplysninger");
  }
  if (industry.includes("finans")) {
    push("dora", "Påkrevd for finanssektoren fra 2025");
    push("hvitvasking", "Rapporteringsplikt for finansforetak");
    push("iso27001", "Forventet standard hos finanskunder");
  }
  if (
    industry.includes("energi") ||
    industry.includes("transport") ||
    industry.includes("offentlig")
  ) {
    push("nis2", "Kritisk sektor – omfattet av NIS2");
    push("nsm", "NSMs grunnprinsipper anbefales for kritisk infrastruktur");
  }
  if (industry.includes("teknologi")) {
    push("iso27001", "Forventet av B2B-kunder i teknologibransjen");
    push("soc2", "Ofte krevd av internasjonale (særlig amerikanske) kunder");
    push("ai-act", "Relevant hvis virksomheten utvikler eller bruker AI-systemer");
    push("cra", "Gjelder produkter med digitale elementer i EU");
  }
  if (industry.includes("bygg") || industry.includes("anlegg")) {
    push("iso45001", "Anbefalt HMS-standard for bygg og anlegg");
    push("internkontroll", "Pålagt for systematisk HMS-arbeid");
  }
  if (industry.includes("handel")) {
    push("apenhetsloven", "Relevant for leverandørkjeder i handel");
    push("bokforingsloven", "Krav til regnskap og dokumentasjon");
  }
  if (industry.includes("utdanning")) {
    push("normen", "Relevant ved behandling av elev-/studentopplysninger");
  }

  if (empNum >= 50) push("apenhetsloven", "Virksomheter over 50 ansatte kan være omfattet");
  if (empNum >= 200) {
    push("csrd", "Store virksomheter omfattes av bærekraftsrapportering");
    push("iso14001", "Anbefalt miljøledelse for større organisasjoner");
  }
  if (empNum >= 10) {
    push("internkontroll", "Lovpålagt systematisk HMS-arbeid");
    push("arbeidsmiljoloven", "Gjelder alle arbeidsgivere");
  }

  push("bokforingsloven", "Lovpålagt for alle registrerte virksomheter");
  push("hms", "Generell HMS-lovgivning gjelder alle arbeidsgivere");

  return recs;
}

function getReqs(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

function getDemoStats(frameworkId: string) {
  const reqs = getReqs(frameworkId);
  let met = 0,
    partial = 0,
    notMet = 0,
    auto = 0;
  reqs.forEach((req, i) => {
    const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 10;
    if (hash < 3) met++;
    else if (hash === 3) partial++;
    else notMet++;
    if (req.agent_capability === "full") auto++;
  });
  return { met, partial, notMet, auto, manual: reqs.length - auto, total: reqs.length };
}

export function MSPCustomerRegulationsTab({ customerId, customerName, customer }: Props) {
  const customerActiveIds = useMemo(
    () => mapActiveFrameworkNames(customer?.active_frameworks),
    [customer?.active_frameworks]
  );

  const [activated, setActivated] = useState<ActivatedRecord[]>(() =>
    loadActivated(customerId, customerActiveIds)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pendingFramework, setPendingFramework] = useState<Framework | null>(null);
  const [previewFramework, setPreviewFramework] = useState<Framework | null>(null);
  const [pickedRecommended, setPickedRecommended] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [liveCounts, setLiveCounts] = useState<
    Record<string, { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }>
  >({});

  useEffect(() => {
    setActivated(loadActivated(customerId, customerActiveIds));
    setSelectedId(null);
  }, [customerId, customerActiveIds]);

  const activatedIds = useMemo(() => new Set(activated.map((a) => a.id)), [activated]);

  const activeFrameworks = useMemo(
    () => frameworks.filter((fw) => activatedIds.has(fw.id)),
    [activatedIds]
  );

  // Auto-select the first active framework when none is selected
  useEffect(() => {
    if (!selectedId && activeFrameworks.length > 0) {
      setSelectedId(activeFrameworks[0].id);
    }
    if (selectedId && !activatedIds.has(selectedId)) {
      setSelectedId(activeFrameworks[0]?.id ?? null);
    }
  }, [activeFrameworks, selectedId, activatedIds]);

  const recommendations = useMemo(() => computeRecommendations(customer), [customer]);

  const recommendedNotActive = useMemo(
    () =>
      Array.from(recommendations.keys())
        .filter((id) => !activatedIds.has(id))
        .map((id) => frameworks.find((f) => f.id === id))
        .filter(Boolean) as Framework[],
    [recommendations, activatedIds],
  );

  const getChipStats = useCallback(
    (fwId: string) => {
      const live = liveCounts[fwId];
      if (live) return { met: live.met, total: live.total };
      const s = getDemoStats(fwId);
      return { met: s.met, total: s.total };
    },
    [liveCounts]
  );

  const currentCounts = useMemo(() => {
    if (!selectedId) return { met: 0, partial: 0, notMet: 0, auto: 0, manual: 0, total: 0 };
    return liveCounts[selectedId] || getDemoStats(selectedId);
  }, [selectedId, liveCounts]);

  const handleCountsChange = useCallback(
    (counts: { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }) => {
      if (!selectedId) return;
      setLiveCounts((prev) => ({ ...prev, [selectedId]: counts }));
    },
    [selectedId]
  );

  const selectedFramework = useMemo(
    () => frameworks.find((f) => f.id === selectedId) || null,
    [selectedId]
  );

  const handleToggle = (frameworkId: string, currentlyActive: boolean) => {
    if (!currentlyActive) {
      // Activating -> open order/confirm dialog
      const fw = frameworks.find((f) => f.id === frameworkId);
      if (fw) setPendingFramework(fw);
      return;
    }
    // Deactivating
    const next = activated.filter((a) => a.id !== frameworkId);
    setActivated(next);
    saveActivated(customerId, next);
    toast.success("Regelverk deaktivert");
  };

  const handleConfirmOrder = (result: FrameworkOrderResult) => {
    if (!pendingFramework) return;
    if (activatedIds.has(pendingFramework.id)) {
      setPendingFramework(null);
      return;
    }
    const record: ActivatedRecord = {
      id: pendingFramework.id,
      orderedAt: new Date().toISOString(),
      method: result.method,
      evidenceName: result.evidenceName,
      evidenceSize: result.evidenceSize,
      declarationText: result.declarationText,
    };
    const next = [...activated, record];
    setActivated(next);
    saveActivated(customerId, next);
    toast.success(`Bestilling registrert — ${pendingFramework.name}`, {
      description: "Regelverket er nå aktivt. Faktureres iht. partneravtalen.",
    });
    setSelectedId(pendingFramework.id);
    setPendingFramework(null);
    setPreviewFramework(null);
  };

  return (
    <div>
      {/* Header with edit button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Regelverk og standarder</h2>
            {activeFrameworks.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {activeFrameworks.length} aktive
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aktive regelverk for {customerName}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditDialog(true)}>
          <Settings2 className="h-4 w-4" />
          Endre regelverk
        </Button>
      </div>

      {recommendedNotActive.length > 0 && (
        <div className="mb-4 rounded-lg border border-recommend/40 bg-recommend/5 p-3">
          <p className="text-xs font-medium text-foreground">Anbefalte regelverk</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Kan aktiveres direkte for {customerName} — 490 kr per regelverk per måned.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {recommendedNotActive.map((fw) => {
              const on = pickedRecommended.includes(fw.id);
              return (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() =>
                    setPickedRecommended((prev) =>
                      prev.includes(fw.id) ? prev.filter((x) => x !== fw.id) : [...prev, fw.id],
                    )
                  }
                  title={recommendations.get(fw.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    on
                      ? "border-recommend bg-recommend text-recommend-foreground"
                      : "border-recommend/60 bg-recommend/15 text-recommend hover:bg-recommend/25",
                  )}
                >
                  <Zap className="h-2.5 w-2.5 shrink-0" />
                  {fw.name}
                </button>
              );
            })}
            {pickedRecommended.length > 0 && (
              <>
                <Button size="sm" className="h-7 text-xs" onClick={() => setBulkOpen(true)}>
                  Aktiver ({pickedRecommended.length})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setShowEditDialog(true)}
                >
                  Legg i tilbud
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {activeFrameworks.length > 0 ? (
        <div className="space-y-4">
          <ActiveFrameworksSummary
            frameworks={activeFrameworks}
            getStats={getChipStats}
            expanded={summaryExpanded}
            onToggle={() => setSummaryExpanded((v) => !v)}
          />

          {summaryExpanded && (
            <FrameworkChipSelector
              frameworks={activeFrameworks}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setSummaryExpanded(false);
              }}
              getStats={getChipStats}
              hideSummary
            />
          )}

          {selectedFramework && (
            <>
              <FrameworkDetailCard framework={selectedFramework} counts={currentCounts} />
              <ComplianceHistoryChart frameworkId={selectedFramework.id} />
              <FrameworkRequirementsList
                frameworkId={selectedFramework.id}
                onCountsChange={handleCountsChange}
              />
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p>Ingen regelverk er aktivert for denne kunden ennå.</p>
          <p className="text-xs mt-1">
            Du kan forhåndsvise en gap-analyse uten å aktivere — klikk «Endre regelverk».
          </p>
          <Button variant="outline" className="mt-3" onClick={() => setShowEditDialog(true)}>
            Endre regelverk
          </Button>
        </div>
      )}

      <BulkActivateFrameworksDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        frameworkNames={pickedRecommended.map((id) => frameworks.find((f) => f.id === id)?.name ?? id)}
        customers={[
          {
            id: customerId,
            name: customerName,
            activeFrameworks: activeFrameworks.map((f) => f.name),
          },
        ]}
        onActivated={() => {
          const next = [
            ...activated,
            ...pickedRecommended
              .filter((id) => !activatedIds.has(id))
              .map((id) => ({ id, orderedAt: new Date().toISOString(), method: "legacy" as const })),
          ];
          setActivated(next);
          saveActivated(customerId, next);
          setPickedRecommended([]);
        }}
      />

      <EditActiveFrameworksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        activeFrameworkIds={activatedIds}
        onToggle={handleToggle}
        updatingId={null}
        recommendations={recommendations}
        onPreview={(fw) => {
          setShowEditDialog(false);
          setPreviewFramework(fw);
        }}
        title={`Endre regelverk — ${customerName}`}
        description="Anbefalinger basert på bransje og størrelse. Forhåndsvis gap-analyse uten å aktivere."
      />

      <FrameworkOrderConfirmDialog
        open={!!pendingFramework}
        onOpenChange={(o) => !o && setPendingFramework(null)}
        framework={pendingFramework}
        customerName={customerName}
        onConfirm={handleConfirmOrder}
      />

      <FrameworkPreviewSheet
        open={!!previewFramework}
        onOpenChange={(o) => !o && setPreviewFramework(null)}
        framework={previewFramework}
        customerName={customerName}
        onActivate={(fw) => {
          setPreviewFramework(null);
          setPendingFramework(fw);
        }}
      />
    </div>
  );
}
