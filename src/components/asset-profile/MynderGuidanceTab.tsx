import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Plus, ChevronRight, Mail, Phone, Users, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import {
  generateGuidanceForVendor, recomputeSummary,
  CRITICALITY_CONFIG, LEVEL_CONFIG, TYPE_LABEL,
  type SuggestedActivity,
} from "@/utils/vendorGuidanceData";
import type { VendorActivity, ActivityType } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
}

const TYPE_ICON: Record<ActivityType, typeof Mail> = {
  email: Mail, phone: Phone, meeting: Users, manual: PenLine,
  document: PenLine, risk: PenLine, incident: PenLine, assignment: PenLine,
  review: PenLine, delivery: PenLine, maturity: PenLine, setting: PenLine,
  upload: PenLine, view: PenLine,
};

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

  const summary = recomputeSummary(visibleSuggestions.length, isNb);

  const handleSubmit = (activity: VendorActivity) => {
    onActivitySaved(activity, activePrefill ?? undefined);
    setActivePrefill(null);
    setEmptyOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Synthesis box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            <Sparkles className="h-3 w-3" />
            {isNb ? "Mynder syntetiserer" : "Mynder synthesizes"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </div>

      {/* Suggestions header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isNb ? `Foreslåtte aktiviteter (${visibleSuggestions.length})` : `Suggested activities (${visibleSuggestions.length})`}
        </h3>
      </div>

      {/* Suggestion cards */}
      {visibleSuggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isNb ? "Ingen åpne anbefalinger akkurat nå." : "No open recommendations right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSuggestions.map((s) => {
            const crit = CRITICALITY_CONFIG[s.criticality];
            const lvl = LEVEL_CONFIG[s.level];
            const typeLabel = TYPE_LABEL[s.suggestedType];
            const TypeIcon = TYPE_ICON[s.suggestedType];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActivePrefill(s)}
                className={cn(
                  "w-full text-left rounded-xl border border-border bg-card p-5 transition-all",
                  "hover:border-primary/40 hover:shadow-md group"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {isNb ? s.titleNb : s.titleEn}
                  </h4>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", crit.badge)}>
                    {isNb ? crit.nb : crit.en}
                  </span>
                </div>
                <p className="text-sm text-primary/90 mb-3">
                  {isNb ? s.reasonNb : s.reasonEn}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {isNb ? lvl.nb : lvl.en}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {isNb ? s.themeNb : s.themeEn}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <TypeIcon className="h-3 w-3" />
                      {isNb ? typeLabel.nb : typeLabel.en}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty activity CTA */}
      <div className="pt-2">
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
