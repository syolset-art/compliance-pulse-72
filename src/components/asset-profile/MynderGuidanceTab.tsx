import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import { AssetMaturityByDomainCard } from "@/components/asset-profile/AssetMaturityByDomainCard";
import { VendorActivityTab } from "@/components/asset-profile/tabs/VendorActivityTab";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { Card, CardContent } from "@/components/ui/card";
import type { LaraPlanTask } from "@/components/lara/types";
import {
  generateGuidanceForVendor,
  type SuggestedActivity,
} from "@/utils/vendorGuidanceData";
import type { VendorActivity } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  assetName?: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
  externalActivities?: VendorActivity[];
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
}

interface Props {
  assetId: string;
  assetName?: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
  externalActivities?: VendorActivity[];
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
}

export function MynderGuidanceTab({
  assetId,
  assetName,
  baselinePercent,
  enrichmentPercent,
  externalActivities,
  dismissedSuggestionIds,
  onActivitySaved,
}: Props) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [locallyDismissed, setLocallyDismissed] = useState<string[]>([]);
  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);

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
                ? "Se hver enkelt aktivitet i aktivitetsloggen under."
                : "See each individual activity in the activity log below."}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Aktivitetslogg — flyttet hit fra egen fane */}
      <VendorActivityTab
        assetId={assetId}
        assetName={assetName ?? ""}
        baselinePercent={baselinePercent}
        enrichmentPercent={enrichmentPercent}
        externalActivities={externalActivities}
      />

      {/* Manuell aktivitetsdialog — åpnes fra Lara-banneret */}
      <RegisterActivityDialog
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={handleSubmit}
        hideTrigger
      />
    </div>
  );
}
