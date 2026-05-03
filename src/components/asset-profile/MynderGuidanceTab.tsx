import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Check, X, Sliders, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
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
  const { toast } = useToast();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [gapStatusOverrides, setGapStatusOverrides] = useState<Record<string, GapOverride>>({});
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [locallyDismissed, setLocallyDismissed] = useState<string[]>([]);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date>(new Date());

  const allDismissed = useMemo(
    () => [...dismissedSuggestionIds, ...locallyDismissed],
    [dismissedSuggestionIds, locallyDismissed]
  );

  const visibleSuggestions = useMemo(
    () => guidance.suggestions
      .filter(s => !allDismissed.includes(s.id))
      .map(s => gapStatusOverrides[s.id] ? { ...s, status: gapStatusOverrides[s.id].status } : s),
    [guidance.suggestions, allDismissed, gapStatusOverrides]
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

  const handleDismiss = (id: string, title: string) => {
    setLocallyDismissed(prev => [...prev, id]);
    toast({
      title: isNb ? "Forslag avvist" : "Suggestion dismissed",
      description: isNb ? `Lara vil ikke foreslå "${title}" igjen.` : `Lara won't suggest "${title}" again.`,
    });
  };

  const handleReanalyze = () => {
    setReanalyzing(true);
    setTimeout(() => {
      setReanalyzing(false);
      setLastAnalyzed(new Date());
      toast({
        title: isNb ? "Lara har analysert på nytt" : "Lara re-analyzed",
        description: isNb ? "Ingen nye gap funnet." : "No new gaps found.",
      });
    }, 1200);
  };

  const lastAnalyzedLabel = useMemo(() => {
    const diffMin = Math.max(0, Math.round((Date.now() - lastAnalyzed.getTime()) / 60000));
    if (diffMin < 1) return isNb ? "akkurat nå" : "just now";
    if (diffMin === 1) return isNb ? "1 minutt siden" : "1 minute ago";
    if (diffMin < 60) return isNb ? `${diffMin} minutter siden` : `${diffMin} minutes ago`;
    const h = Math.round(diffMin / 60);
    return isNb ? `${h} t siden` : `${h}h ago`;
  }, [lastAnalyzed, isNb]);

  return (
    <div className="space-y-5">
      {/* Agent header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <LaraAvatar size={36} pulse={reanalyzing} />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight font-sans">
              {isNb ? "Lara – din veileder" : "Lara – your guide"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb ? "Sist analysert" : "Last analyzed"}: {reanalyzing ? (isNb ? "analyserer…" : "analyzing…") : lastAnalyzedLabel}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-pill gap-1.5"
          onClick={handleReanalyze}
          disabled={reanalyzing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", reanalyzing && "animate-spin")} />
          {isNb ? "Analyser på nytt" : "Re-analyze"}
        </Button>
      </div>

      {/* Lara summary bubble */}
      {!summaryDismissed && (
        <div className="rounded-2xl bg-purple-100 p-4 relative">
          <div className="flex items-start gap-3">
            <LaraAvatar size={28} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70 mb-1">
                {isNb ? "Lara foreslår" : "Lara suggests"}
              </p>
              <p className="text-sm leading-relaxed text-purple-900">{summary}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="rounded-pill bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-1.5 h-8"
                  onClick={() => {
                    toast({
                      title: isNb ? "Takk – Lara fortsetter" : "Thanks – Lara continues",
                      description: isNb ? "Forslagene er prioritert nedenfor." : "Suggestions are prioritized below.",
                    });
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isNb ? "Godta sammendrag" : "Accept summary"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-pill gap-1.5 h-8 border-purple-900/20 text-purple-900 hover:bg-white"
                  onClick={() => setSummaryDismissed(true)}
                >
                  <X className="h-3.5 w-3.5" />
                  {isNb ? "Avvis" : "Dismiss"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isNb ? `Foreslåtte handlinger (${visibleSuggestions.length})` : `Suggested actions (${visibleSuggestions.length})`}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-status-closed" />{isNb ? "Operasjonelt" : "Operational"}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning" />{isNb ? "Taktisk" : "Tactical"}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />{isNb ? "Strategisk" : "Strategic"}</span>
        </div>
      </div>

      {/* Suggestion cards */}
      {visibleSuggestions.length === 0 ? (
        <div className="rounded-2xl bg-purple-100 p-6 flex items-start gap-3">
          <LaraAvatar size={32} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70 mb-1">
              {isNb ? "Lara" : "Lara"}
            </p>
            <p className="text-sm text-purple-900">
              {isNb
                ? "Ingen åpne gap akkurat nå. Jeg fortsetter å overvåke leverandøren og varsler deg hvis noe endrer seg."
                : "No open gaps right now. I'll keep monitoring the vendor and alert you if anything changes."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSuggestions.map((s) => {
            const status = STATUS_CONFIG[s.status];
            const lvl = LEVEL_CONFIG[s.level];
            const crit = CRITICALITY_CONFIG[s.criticality];
            const isEditing = editingStatusId === s.id;
            const title = isNb ? s.titleNb : s.titleEn;
            return (
              <div
                key={s.id}
                className={cn(
                  "relative rounded-xl border border-border bg-card overflow-hidden",
                  "transition-all hover:border-primary/40 hover:shadow-sm"
                )}
              >
                {/* level color bar */}
                <span className={cn("absolute left-0 top-0 bottom-0 w-1 z-[1]", LEVEL_DOT[s.level])} aria-hidden />

                <div className="pl-4 pr-4 py-4">
                  {/* Top row: Lara label + status/criticality */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <LaraAvatar size={22} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/80">
                        {isNb ? "Lara foreslår" : "Lara suggests"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.status === "open" && (
                        <span className={cn("inline-flex items-center rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", crit.badge)}>
                          {isNb ? crit.nb : crit.en}
                        </span>
                      )}
                      <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", status.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                        {isNb ? status.nb : status.en}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>

                  {/* Lara quote bubble */}
                  <div className="rounded-lg bg-purple-100 px-3 py-2 mb-3">
                    <p className="text-xs text-purple-900 leading-relaxed">
                      "{isNb ? s.statusNoteNb : s.statusNoteEn}"
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="inline-flex items-center gap-1 rounded-pill bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                      <span className={cn("h-1.5 w-1.5 rounded-full", LEVEL_DOT[s.level])} />
                      {isNb ? lvl.nb : lvl.en}
                    </span>
                    <span className="inline-flex items-center rounded-pill bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                      {isNb ? s.themeNb : s.themeEn}
                    </span>
                  </div>

                  {/* Explicit accept / reject / change */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className="rounded-pill bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-1.5 h-8"
                      onClick={() => setActivePrefill(s)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isNb ? "Godta og start aktivitet" : "Accept and start activity"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-pill gap-1.5 h-8"
                      onClick={() => handleDismiss(s.id, title)}
                    >
                      <X className="h-3.5 w-3.5" />
                      {isNb ? "Avvis" : "Dismiss"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-pill gap-1.5 h-8 ml-auto text-muted-foreground"
                      onClick={() => setEditingStatusId(isEditing ? null : s.id)}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      {isNb ? "Endre status" : "Change status"}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", isEditing && "rotate-180")} />
                    </Button>
                  </div>
                </div>

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

      {/* Empty activity CTA */}
      <div className="pt-1">
        <Button variant="outline" size="sm" className="rounded-pill gap-1.5" onClick={() => setEmptyOpen(true)}>
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
