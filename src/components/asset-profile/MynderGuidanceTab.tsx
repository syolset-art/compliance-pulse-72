import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import {
  generateGuidanceForVendor, recomputeSummary,
  STATUS_CONFIG, LEVEL_CONFIG, LEVEL_DOT, CRITICALITY_CONFIG,
  type SuggestedActivity, type GapStatus,
} from "@/utils/vendorGuidanceData";
import type { VendorActivity } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
}

export function MynderGuidanceTab({ assetId, dismissedSuggestionIds, onActivitySaved }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const visibleSuggestions = useMemo(
    () => guidance.suggestions.filter(s => !dismissedSuggestionIds.includes(s.id)),
    [guidance.suggestions, dismissedSuggestionIds]
  );

  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);
  const [emptyOpen, setEmptyOpen] = useState(false);

  const summary = recomputeSummary(visibleSuggestions, isNb);

  const counts = useMemo(() => ({
    open: visibleSuggestions.filter(s => s.status === "open").length,
    in_progress: visibleSuggestions.filter(s => s.status === "in_progress").length,
    closed: 2, // demo: lukket siste 30 dg
  }), [visibleSuggestions]);

  const handleSubmit = (activity: VendorActivity) => {
    onActivitySaved(activity, activePrefill ?? undefined);
    setActivePrefill(null);
    setEmptyOpen(false);
  };

  const statusKpi = (label: string, value: number, color: string) => (
    <div className="flex-1 rounded-lg border border-border bg-card px-4 py-3">
      <div className={cn("text-2xl font-semibold leading-none", color)}>{value}</div>
      <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="flex items-stretch gap-3">
        {statusKpi(isNb ? "Åpne gap" : "Open gaps", counts.open, "text-destructive")}
        {statusKpi(isNb ? "Under oppfølging" : "In progress", counts.in_progress, "text-amber-600 dark:text-amber-400")}
        {statusKpi(isNb ? "Lukket (30 dg)" : "Closed (30 d)", counts.closed, "text-emerald-600 dark:text-emerald-400")}
      </div>

      {/* Synthesis box */}
      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
        <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground mb-2">
          {isNb ? "Mynder syntetiserer" : "Mynder synthesizes"}
        </span>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </div>

      {/* Section header + level legend */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isNb ? "Gap & foreslåtte aktiviteter" : "Gaps & suggested activities"}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />{isNb ? "Operasjonelt" : "Operational"}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-500" />{isNb ? "Taktisk" : "Tactical"}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />{isNb ? "Strategisk" : "Strategic"}</span>
        </div>
      </div>

      {/* Suggestion cards */}
      {visibleSuggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isNb ? "Ingen åpne gap akkurat nå." : "No open gaps right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleSuggestions.map((s) => {
            const status = STATUS_CONFIG[s.status];
            const lvl = LEVEL_CONFIG[s.level];
            const crit = CRITICALITY_CONFIG[s.criticality];
            const showCritInStatus = s.status === "open"; // f.eks. "HØY · ÅPEN"
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActivePrefill(s)}
                className={cn(
                  "relative w-full text-left rounded-lg border border-border bg-card overflow-hidden",
                  "transition-all hover:border-primary/40 hover:shadow-sm group"
                )}
              >
                {/* level color bar */}
                <span className={cn("absolute left-0 top-0 bottom-0 w-1", LEVEL_DOT[s.level])} aria-hidden />
                <div className="pl-4 pr-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {isNb ? s.titleNb : s.titleEn}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isNb ? s.statusNoteNb : s.statusNoteEn}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                          <span className={cn("h-1.5 w-1.5 rounded-full", LEVEL_DOT[s.level])} />
                          {isNb ? lvl.nb : lvl.en}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                          {isNb ? s.themeNb : s.themeEn}
                        </span>
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap", status.badge)}>
                      {showCritInStatus
                        ? `${isNb ? crit.nb : crit.en} · ${isNb ? status.nb : status.en}`
                        : (isNb ? status.nb : status.en)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty activity CTA */}
      <div className="pt-1">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEmptyOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          {isNb ? "Start tom aktivitet" : "Start empty activity"}
        </Button>
      </div>

      {/* Prefilled dialog (from suggestion) */}
      <RegisterActivityDialog
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={handleSubmit}
        hideTrigger
      />

      {/* Empty dialog */}
      <RegisterActivityDialog
        open={emptyOpen}
        onOpenChange={setEmptyOpen}
        onSubmit={handleSubmit}
        hideTrigger
      />
    </div>
  );
}
