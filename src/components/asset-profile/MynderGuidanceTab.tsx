import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { InlineStatusEditor } from "@/components/asset-profile/InlineStatusEditor";
import {
  generateGuidanceForVendor, recomputeSummary,
  STATUS_CONFIG, LEVEL_CONFIG, LEVEL_DOT, CRITICALITY_CONFIG,
  type SuggestedActivity, type GapStatus,
} from "@/utils/vendorGuidanceData";
import type { ActivityStatus, VendorActivity } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
}

interface GapOverride {
  status: GapStatus;
  comment?: string;
  changedAt: Date;
}

export function MynderGuidanceTab({ assetId, dismissedSuggestionIds, onActivitySaved }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [gapStatusOverrides, setGapStatusOverrides] = useState<Record<string, GapOverride>>({});
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const visibleSuggestions = useMemo(
    () => guidance.suggestions
      .filter(s => !dismissedSuggestionIds.includes(s.id))
      .map(s => gapStatusOverrides[s.id] ? { ...s, status: gapStatusOverrides[s.id].status } : s),
    [guidance.suggestions, dismissedSuggestionIds, gapStatusOverrides]
  );

  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);
  const [emptyOpen, setEmptyOpen] = useState(false);

  const summary = recomputeSummary(visibleSuggestions, isNb);

  const handleSubmit = (activity: VendorActivity) => {
    onActivitySaved(activity, activePrefill ?? undefined);
    setActivePrefill(null);
    setEmptyOpen(false);
  };

  const handleStatusSave = (suggestionId: string, next: ActivityStatus, comment?: string) => {
    setGapStatusOverrides(prev => ({
      ...prev,
      [suggestionId]: { status: next as GapStatus, comment, changedAt: new Date() },
    }));
    setEditingStatusId(null);
  };


  return (
    <div className="space-y-5">
      {/* Synthesis box */}
      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {isNb ? "Veiledning fra Mynder" : "Guidance from Mynder"}
            </h2>
          </div>
          <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap mt-1.5">
            {isNb ? "Oppdatert nå" : "Updated just now"}
          </span>
        </div>
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
            const isEditing = editingStatusId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "relative rounded-lg border border-border bg-card overflow-hidden",
                  "transition-all hover:border-primary/40 hover:shadow-sm group"
                )}
              >
                {/* level color bar */}
                <span className={cn("absolute left-0 top-0 bottom-0 w-1 z-[1]", LEVEL_DOT[s.level])} aria-hidden />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActivePrefill(s)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivePrefill(s); } }}
                  className="w-full text-left pl-4 pr-4 py-3.5 cursor-pointer"
                >
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
                        {s.status === "open" && (
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", CRITICALITY_CONFIG[s.criticality].badge)}>
                            {isNb ? crit.nb : crit.en}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStatusId(isEditing ? null : s.id);
                      }}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all hover:ring-2 hover:ring-current/20 hover:ring-offset-1 hover:ring-offset-background",
                        status.badge
                      )}
                      aria-label={isNb ? "Endre status" : "Change status"}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {isNb ? status.nb : status.en}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
                    </button>
                  </div>
                </button>

                {isEditing && (
                  <div className="border-t border-dashed border-border">
                    <InlineStatusEditor
                      currentStatus={s.status as ActivityStatus}
                      onSave={(next, comment) => handleStatusSave(s.id, next, comment)}
                      onCancel={() => setEditingStatusId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tip line */}
      {visibleSuggestions.length > 0 && !editingStatusId && (
        <p className="text-[11px] text-muted-foreground italic px-1">
          {isNb
            ? "Tips: klikk på statuspillen til høyre på et kort for å endre status."
            : "Tip: click the status pill on the right of a card to change its status."}
        </p>
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
