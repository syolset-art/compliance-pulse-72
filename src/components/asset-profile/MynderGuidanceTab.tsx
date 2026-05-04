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
