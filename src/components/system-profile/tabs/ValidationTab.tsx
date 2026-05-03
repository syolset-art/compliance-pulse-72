import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Info } from "lucide-react";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import { AssetMaturityByDomainCard } from "@/components/asset-profile/AssetMaturityByDomainCard";
import { FrameworkMaturityGrid } from "@/components/system-profile/FrameworkMaturityGrid";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { useToast } from "@/hooks/use-toast";
import { generateGuidanceForVendor, type SuggestedActivity } from "@/utils/vendorGuidanceData";
import type { LaraPlanTask } from "@/components/lara/types";

interface ValidationTabProps {
  systemId: string;
  systemAsAsset?: {
    id: string;
    name: string;
    vendor?: string | null;
  } & Record<string, any>;
  tasksCount?: number;
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
}

export const ValidationTab = ({ systemId, systemAsAsset }: ValidationTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { toast } = useToast();

  const guidance = useMemo(() => generateGuidanceForVendor(systemId), [systemId]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);

  const visibleSuggestions = useMemo(
    () => guidance.suggestions.filter(s => !dismissed.includes(s.id)),
    [guidance.suggestions, dismissed]
  );

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

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return (data || []).map((fw: any) => ({
        framework_id: fw.framework_id,
        framework_name: fw.framework_name,
      }));
    },
  });

  const vendorName = systemAsAsset?.vendor || systemAsAsset?.name || (isNb ? "leverandøren" : "the vendor");

  return (
    <div className="space-y-6">
      {/* 1. Lara-anbefalingsbanner — samme som dashboard og leverandørkort */}
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

      {/* 2. Modenhet per kontrollområde */}
      <AssetMaturityByDomainCard assetId={systemId} />

      {/* 3. Modenhet per regelverk — knyttet til systemleverandøren */}
      {frameworks.length > 0 && (
        <section className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {isNb ? "Modenhet per regelverk — leverandøren" : "Maturity per framework — vendor"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1.5 max-w-2xl">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                {isNb
                  ? `Viser hvordan ${vendorName} oppfyller kravene i hvert regelverk. Virksomhetens egen modenhet beregnes per krav i de regelverkene dere har valgt.`
                  : `Shows how ${vendorName} meets the requirements of each framework. Your organization's own maturity is calculated per requirement in the frameworks you have selected.`}
              </span>
            </p>
          </div>
          <FrameworkMaturityGrid frameworks={frameworks} />
        </section>
      )}

      {/* Aktivitetsdialog — åpnes fra Lara-banneret */}
      <RegisterActivityDialog
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={() => {
          if (activePrefill) {
            setDismissed(prev => [...prev, activePrefill.id]);
            toast({
              title: isNb ? "Aktivitet opprettet" : "Activity created",
              description: isNb ? "Lagt til i aktivitetsloggen." : "Added to the activity log.",
            });
          }
          setActivePrefill(null);
        }}
        hideTrigger
      />
    </div>
  );
};
