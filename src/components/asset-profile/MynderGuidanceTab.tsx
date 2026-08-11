import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import { AssetMaturityByDomainCard } from "@/components/asset-profile/AssetMaturityByDomainCard";
import { VendorActivityTab } from "@/components/asset-profile/tabs/VendorActivityTab";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";
import { DocumentRequestsSection } from "@/components/asset-profile/tabs/DocumentRequestsSection";
import { VendorFrameworkCard } from "@/components/asset-profile/guidance/VendorFrameworkCard";
import { VendorRecommendedActionsCard } from "@/components/asset-profile/guidance/VendorRecommendedActionsCard";
import { AddFrameworkDialog } from "@/components/msp/guidance/AddFrameworkDialog";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import type { LaraPlanTask } from "@/components/lara/types";
import {
  generateGuidanceForVendor,
  type SuggestedActivity,
} from "@/utils/vendorGuidanceData";
import {
  deriveVendorActions,
  deriveVendorFrameworks,
  fallbackActionFor,
  frameworkById,
  readFrameworkState,
  writeFrameworkState,
  type VendorFramework,
  type VendorFrameworkAction,
} from "@/lib/vendorFrameworkSuggestions";
import type { VendorActivity } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  assetName?: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
  externalActivities?: VendorActivity[];
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
  /** Kontekst Lara bruker for å foreslå regelverk. */
  vendorType?: string | null;
  industry?: string | null;
  country?: string | null;
  criticality?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
}

export function MynderGuidanceTab({
  assetId,
  assetName,
  baselinePercent,
  enrichmentPercent,
  externalActivities,
  dismissedSuggestionIds,
  onActivitySaved,
  vendorType,
  industry,
  country,
  criticality,
  contactPerson,
  contactEmail,
}: Props) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [locallyDismissed, setLocallyDismissed] = useState<string[]>([]);
  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);

  // ── Regelverk leverandøren skal etterleve ──

  const laraFrameworks = useMemo(
    () =>
      deriveVendorFrameworks({
        id: assetId,
        name: assetName,
        vendorType,
        industry,
        country,
        criticality,
      }),
    [assetId, assetName, vendorType, industry, country, criticality],
  );

  const [fwState, setFwState] = useState(() => readFrameworkState(assetId));
  useEffect(() => setFwState(readFrameworkState(assetId)), [assetId]);

  const updateFwState = (next: typeof fwState) => {
    setFwState(next);
    writeFrameworkState(assetId, next);
  };

  const frameworks: VendorFramework[] = useMemo(() => {
    const base = laraFrameworks.filter((f) => !fwState.removed.includes(f.id));
    const extra = fwState.added.filter((f) => !base.some((b) => b.id === f.id));
    return [...base, ...extra];
  }, [laraFrameworks, fwState]);

  const actions: VendorFrameworkAction[] = useMemo(() => {
    const known = frameworks.filter((f) => frameworkById(f.id));
    const unknown = frameworks.filter((f) => !frameworkById(f.id));
    return [...deriveVendorActions(known), ...unknown.map(fallbackActionFor)];
  }, [frameworks]);

  const [addFrameworkOpen, setAddFrameworkOpen] = useState(false);
  const [docRequestType, setDocRequestType] = useState<string | null>(null);

  const openDocRequest = (action: VendorFrameworkAction) =>
    setDocRequestType(action.documentType ?? "general");

  const createActivityFromAction = (action: VendorFrameworkAction) => {
    setActivePrefill({
      id: `fw-${action.id}`,
      gapId: action.frameworkId,
      titleNb: action.titleNb,
      titleEn: action.titleEn,
      descriptionNb: action.reasonNb,
      descriptionEn: action.reasonEn,
      reasonNb: action.reasonNb,
      reasonEn: action.reasonEn,
      statusNoteNb: `Dekker ${action.requirement}`,
      statusNoteEn: `Covers ${action.requirement}`,
      status: "open",
      criticality: action.criticality,
      level: "taktisk",
      themeNb: action.frameworkLabel,
      themeEn: action.frameworkLabel,
      suggestedType: action.documentType ? "document" : "review",
      suggestedPhase: "ongoing",
    });
  };


  const [showActivityLog, setShowActivityLog] = useState(() => {
    try {
      return localStorage.getItem('mynder_show_activity_log') === 'true';
    } catch {
      return false;
    }
  });

  const toggleActivityLog = () => {
    const next = !showActivityLog;
    setShowActivityLog(next);
    try {
      localStorage.setItem('mynder_show_activity_log', String(next));
    } catch {}
  };

  const allDismissed = useMemo(
    () => [...dismissedSuggestionIds, ...locallyDismissed],
    [dismissedSuggestionIds, locallyDismissed]
  );

  const visibleSuggestions = useMemo(
    () => guidance.suggestions.filter(s => !allDismissed.includes(s.id)),
    [guidance.suggestions, allDismissed]
  );

  // Plan-tasks for Lara-banneret — beholdes som inngangspunkt til neste handling.
  const planTasks: LaraPlanTask[] = useMemo(() => {
    return visibleSuggestions.map(s => {
      const sev: LaraPlanTask["severity"] =
        s.criticality === "kritisk" ? "critical" :
        s.criticality === "hoy" ? "high" : "medium";
      return {
        id: s.id,
        severity: sev,
        title: isNb ? s.titleNb : s.titleEn,
        category: isNb ? s.themeNb : s.themeEn,
        insight: isNb ? s.statusNoteNb : s.statusNoteEn,
        primaryCtaLabelNb: "Opprett aktivitet",
        primaryCtaLabelEn: "Create activity",
      };
    });
  }, [visibleSuggestions, isNb]);

  const planCriticalCount = planTasks.filter(t => t.severity === "critical").length;

  const handleSubmit = (activity: VendorActivity) => {
    onActivitySaved(activity, activePrefill ?? undefined);
    setActivePrefill(null);
    if (activePrefill) {
      setLocallyDismissed(prev => [...prev, activePrefill.id]);
      toast({
        title: isNb ? "Aktivitet opprettet" : "Activity created",
        description: isNb ? "Lagt til i aktivitetsloggen under." : "Added to the activity log below.",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Lara-anbefalingsbanner — samme komponent som dashbordet */}
      {planTasks.length > 0 && (
        <LaraRecommendationBanner
          totalCount={planTasks.length}
          criticalCount={planCriticalCount}
          tasks={planTasks}
          hideDismiss
          onPrimaryAction={(t) => {
            const s = visibleSuggestions.find(x => x.id === t.id);
            if (s) setActivePrefill(s);
          }}
        />
      )}

      {/* Standard Trust Profile-blokk: modenhet per kontrollområde */}
      <AssetMaturityByDomainCard assetId={assetId} />

      {/* Tidslinje: aktiviteter over tid og påvirkning på modenhet */}
      <Card className="border-primary/20">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Modenhetsutvikling drevet av aktiviteter" : "Maturity driven by activities"}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {isNb
                  ? "Hver markør på linjen er en aktivitet fra loggen under. Tiltak hever modenhet, hendelser senker den."
                  : "Each marker on the line is an activity from the log below. Actions raise maturity, incidents lower it."}
              </p>
            </div>
          </div>

          <MaturityHistoryChart
            assetId={assetId}
            baselinePercent={baselinePercent ?? 40}
            enrichmentPercent={enrichmentPercent ?? 20}
          />

          <div className="flex items-center gap-2 pt-3 border-t border-border/60 text-[12px] text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            <span>
              {isNb
                ? "Se detaljer i aktivitetsloggen."
                : "See details in the activity log."}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Aktivitetslogg — skjult som standard, brukeren velger selv */}
      <div className="border rounded-lg bg-card">
        <button
          type="button"
          onClick={toggleActivityLog}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            {isNb ? "Aktivitetslogg" : "Activity log"}
          </div>
          {showActivityLog ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showActivityLog && (
          <div className="px-4 pb-4">
            <VendorActivityTab
              assetId={assetId}
              assetName={assetName ?? ""}
              baselinePercent={baselinePercent}
              enrichmentPercent={enrichmentPercent}
              externalActivities={externalActivities}
            />
          </div>
        )}
      </div>

      {/* Manuell aktivitetsdialog — åpnes fra Lara-banneret */}
      <RegisterActivityDialog
        assetId={assetId}
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={handleSubmit}
        hideTrigger
      />
    </div>
  );
}
