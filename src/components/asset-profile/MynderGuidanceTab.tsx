import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Check, X, Sliders, ChevronDown, CheckCircle2, Send, CalendarPlus, ClipboardList, Edit3, SkipForward, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { LevelChip } from "@/components/asset-profile/LevelChip";
import { LaraActionPreviewDialog } from "@/components/asset-profile/LaraActionPreviewDialog";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { InlineStatusEditor } from "@/components/asset-profile/InlineStatusEditor";
import {
  generateGuidanceForVendor, recomputeSummary,
  STATUS_CONFIG, CRITICALITY_CONFIG,
  type SuggestedActivity, type GapStatus, type NextActionDraft,
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

/** Per-kort tilstand i den agentiske flyten. */
type CardStep =
  | { kind: "suggested" }                                  // før brukeren har "akseptert"
  | { kind: "created" }                                    // aktivitet opprettet, ikke påbegynt
  | { kind: "sent"; whenNb: string; whenEn: string };       // Lara's neste handling utført

export function MynderGuidanceTab({ assetId, dismissedSuggestionIds, onActivitySaved }: Props) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [gapStatusOverrides, setGapStatusOverrides] = useState<Record<string, GapOverride>>({});
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [locallyDismissed, setLocallyDismissed] = useState<string[]>([]);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const [summaryAccepted, setSummaryAccepted] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date>(new Date());

  /** Per-kort steg-tilstand. */
  const [cardSteps, setCardSteps] = useState<Record<string, CardStep>>({});

  /** Filter for "Pågående aktiviteter"-listen nederst. */
  const [ongoingFilter, setOngoingFilter] = useState<"all" | "operasjonelt" | "taktisk" | "strategisk">("all");

  /** Aktiv preview-dialog (forhåndsvisning av e-post / møte / oppgave). */
  const [previewDraft, setPreviewDraft] = useState<{ suggestionId: string; draft: NextActionDraft } | null>(null);

  /** Manuell aktivitetsdialog (gammel flyt — fortsatt tilgjengelig via "Endre forslag"). */
  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);
  const [emptyOpen, setEmptyOpen] = useState(false);

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

  const summary = recomputeSummary(visibleSuggestions, isNb);
  const createdCount = Object.values(cardSteps).filter(s => s.kind !== "suggested").length;

  const stepOf = (id: string): CardStep => cardSteps[id] ?? { kind: "suggested" };

  const handleAcceptSummary = () => {
    // Opprett alle synlige forslag som "Opprettet, ikke påbegynt".
    const next: Record<string, CardStep> = { ...cardSteps };
    visibleSuggestions.forEach(s => { if (!next[s.id]) next[s.id] = { kind: "created" }; });
    setCardSteps(next);
    setSummaryAccepted(true);
    toast({
      title: isNb ? `${visibleSuggestions.length} aktiviteter opprettet` : `${visibleSuggestions.length} activities created`,
      description: isNb ? "Ikke påbegynt — Lara foreslår neste handling for hver enkelt." : "Not started — Lara suggests the next action for each one.",
    });
  };

  const handleAcceptOne = (s: SuggestedActivity) => {
    setCardSteps(prev => ({ ...prev, [s.id]: { kind: "created" } }));
    toast({
      title: isNb ? "Aktivitet opprettet" : "Activity created",
      description: isNb ? "Lara foreslår neste handling under." : "Lara suggests the next action below.",
    });
  };

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

  const handleSendAction = (final: { recipient?: string; subject: string; body: string }) => {
    if (!previewDraft) return;
    const today = new Date().toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    setCardSteps(prev => ({
      ...prev,
      [previewDraft.suggestionId]: {
        kind: "sent",
        whenNb: `Sendt ${today} — venter på svar`,
        whenEn: `Sent ${today} — awaiting reply`,
      },
    }));
    setGapStatusOverrides(prev => ({
      ...prev,
      [previewDraft.suggestionId]: { status: "in_progress", changedAt: new Date() },
    }));
    toast({
      title: isNb ? "Sendt" : "Sent",
      description: isNb ? `Til ${final.recipient ?? ""} · ${final.subject}` : `To ${final.recipient ?? ""} · ${final.subject}`,
    });
    setPreviewDraft(null);
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

      {/* Steg 1 / 2 — sammendrags-boble */}
      {!summaryDismissed && !summaryAccepted && (
        <div className="rounded-2xl bg-purple-100 p-4">
          <div className="flex items-start gap-3">
            <LaraAvatar size={28} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70 mb-1">
                {isNb ? "Lara foreslår" : "Lara suggests"}
              </p>
              <p className="text-sm leading-relaxed text-purple-900">{summary}</p>
              <p className="text-[12px] text-purple-900/70 mt-1.5 leading-snug">
                {isNb
                  ? "Aktivitetene blir opprettet — men ikke påbegynt. Du bestemmer når og hvordan vi følger opp."
                  : "Activities will be created — not started. You decide when and how to follow up."}
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="rounded-pill bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-1.5 h-8"
                  onClick={handleAcceptSummary}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isNb
                    ? `Opprett ${visibleSuggestions.length} aktivitet${visibleSuggestions.length === 1 ? "" : "er"}`
                    : `Create ${visibleSuggestions.length} activit${visibleSuggestions.length === 1 ? "y" : "ies"}`}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-pill gap-1.5 h-8 border-purple-900/20 text-purple-900 hover:bg-white"
                  onClick={() => setSummaryDismissed(true)}
                >
                  {isNb ? "Vis først" : "Show first"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-pill gap-1.5 h-8 text-purple-900/80 hover:bg-white"
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

      {/* Steg 2-kvittering */}
      {summaryAccepted && (
        <div className="rounded-2xl bg-success/10 border border-success/30 p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {isNb
                ? `${createdCount} aktivitet${createdCount === 1 ? "" : "er"} opprettet — ikke påbegynt`
                : `${createdCount} activit${createdCount === 1 ? "y" : "ies"} created — not started`}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {isNb
                ? "Lara foreslår en konkret neste handling for hver aktivitet under."
                : "Lara suggests a concrete next action for each activity below."}
            </p>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {summaryAccepted
            ? (isNb ? `Aktiviteter klare for handling (${visibleSuggestions.length})` : `Activities ready for action (${visibleSuggestions.length})`)
            : (isNb ? `Foreslåtte handlinger (${visibleSuggestions.length})` : `Suggested actions (${visibleSuggestions.length})`)}
        </h3>
      </div>

      {/* Suggestion cards */}
      {visibleSuggestions.length === 0 ? (
        <div className="rounded-2xl bg-purple-100 p-6 flex items-start gap-3">
          <LaraAvatar size={32} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70 mb-1">Lara</p>
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
            const crit = CRITICALITY_CONFIG[s.criticality];
            const isEditing = editingStatusId === s.id;
            const title = isNb ? s.titleNb : s.titleEn;
            const step = stepOf(s.id);

            // Status-badge byttes ut når aktiviteten er opprettet
            const renderStatusBadge = () => {
              if (step.kind === "created") {
                return (
                  <span className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {isNb ? "Opprettet" : "Created"}
                  </span>
                );
              }
              if (step.kind === "sent") {
                return (
                  <span className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    {isNb ? "Under oppfølging" : "In progress"}
                  </span>
                );
              }
              return (
                <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", status.badge)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                  {isNb ? status.nb : status.en}
                </span>
              );
            };

            return (
              <div
                key={s.id}
                className={cn(
                  "relative rounded-xl border border-border bg-card overflow-hidden",
                  "transition-all hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <div className="px-4 py-4">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <LaraAvatar size={22} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/80">
                        {step.kind === "suggested"
                          ? (isNb ? "Lara foreslår" : "Lara suggests")
                          : (isNb ? "Aktivitet" : "Activity")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {step.kind === "suggested" && s.status === "open" && (
                        <span className={cn("inline-flex items-center rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", crit.badge)}>
                          {isNb ? crit.nb : crit.en}
                        </span>
                      )}
                      {renderStatusBadge()}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>

                  {/* Hvorfor (Lara's begrunnelse) — vises bare før aktivitet er opprettet */}
                  {step.kind === "suggested" && (
                    <div className="rounded-lg bg-purple-100 px-3 py-2 mb-3">
                      <p className="text-xs text-purple-900 leading-relaxed">
                        "{isNb ? s.statusNoteNb : s.statusNoteEn}"
                      </p>
                    </div>
                  )}

                  {/* Tags — nivå (med tooltip) + tema */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <LevelChip level={s.level} isNb={isNb} />
                    <span className="inline-flex items-center rounded-pill bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                      {isNb ? s.themeNb : s.themeEn}
                    </span>
                  </div>

                  {/* Actions per steg */}
                  {step.kind === "suggested" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="rounded-pill bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-1.5 h-8"
                        onClick={() => handleAcceptOne(s)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isNb ? "Opprett aktivitet" : "Create activity"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-pill gap-1.5 h-8"
                        onClick={() => setActivePrefill(s)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {isNb ? "Endre forslag" : "Edit suggestion"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-pill gap-1.5 h-8 text-muted-foreground"
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
                  )}

                  {/* Steg 3 — Lara's neste handling */}
                  {step.kind === "created" && s.nextAction && (
                    <NextStepBubble
                      draft={s.nextAction}
                      isNb={isNb}
                      onPreview={() => setPreviewDraft({ suggestionId: s.id, draft: s.nextAction! })}
                      onSkip={() => {
                        toast({
                          title: isNb ? "Hoppet over" : "Skipped",
                          description: isNb ? "Aktiviteten venter til du er klar." : "The activity will wait until you're ready.",
                        });
                      }}
                    />
                  )}

                  {step.kind === "created" && !s.nextAction && (
                    <p className="text-[12px] text-muted-foreground italic">
                      {isNb ? "Aktiviteten venter — Lara har ingen automatisk neste handling for denne." : "Activity waiting — Lara has no automated next step for this one."}
                    </p>
                  )}

                  {/* Steg 4 — bekreftelse */}
                  {step.kind === "sent" && (
                    <div className="rounded-lg bg-success/10 border border-success/30 px-3 py-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-[13px] text-foreground">
                        {isNb ? step.whenNb : step.whenEn}
                      </span>
                    </div>
                  )}
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

      {/* Pågående aktiviteter — alle som er opprettet eller sendt */}
      <OngoingActivitiesSection
        suggestions={visibleSuggestions}
        cardSteps={cardSteps}
        filter={ongoingFilter}
        onFilterChange={setOngoingFilter}
        isNb={isNb}
      />

      {/* Empty activity CTA */}
      <div className="pt-1">
        <Button variant="outline" size="sm" className="rounded-pill gap-1.5" onClick={() => setEmptyOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          {isNb ? "Start tom aktivitet" : "Start empty activity"}
        </Button>
      </div>

      {/* Lara's preview-dialog (e-post/møte/oppgave) */}
      <LaraActionPreviewDialog
        open={!!previewDraft}
        onOpenChange={(o) => { if (!o) setPreviewDraft(null); }}
        draft={previewDraft?.draft ?? null}
        isNb={isNb}
        onSend={handleSendAction}
      />

      {/* Manuell aktivitetsdialog (for "Endre forslag") */}
      <RegisterActivityDialog
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={handleSubmit}
        hideTrigger
      />

      {/* Tom aktivitetsdialog */}
      <RegisterActivityDialog
        open={emptyOpen}
        onOpenChange={setEmptyOpen}
        onSubmit={handleSubmit}
        hideTrigger
      />
    </div>
  );
}

/** Lara's neste-handling-boble — vises i kort etter at aktiviteten er opprettet. */
function NextStepBubble({
  draft, isNb, onPreview, onSkip,
}: {
  draft: NextActionDraft;
  isNb: boolean;
  onPreview: () => void;
  onSkip: () => void;
}) {
  const Icon = draft.type === "email" ? Send : draft.type === "meeting" ? CalendarPlus : ClipboardList;
  const ctaNb = draft.type === "email" ? "Forhåndsvis e-post" : draft.type === "meeting" ? "Forhåndsvis invitasjon" : "Forhåndsvis oppgave";
  const ctaEn = draft.type === "email" ? "Preview email"      : draft.type === "meeting" ? "Preview invitation"     : "Preview task";

  return (
    <div className="rounded-lg bg-purple-100 px-3 py-3">
      <div className="flex items-start gap-2 mb-2.5">
        <LaraAvatar size={20} className="mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900/70 mb-0.5 inline-flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            {isNb ? "Lara foreslår neste handling" : "Lara suggests the next step"}
          </p>
          <p className="text-[13px] text-purple-900 leading-relaxed">
            {isNb ? draft.proposalNb : draft.proposalEn}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="rounded-pill bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-1.5 h-8"
          onClick={onPreview}
        >
          <Icon className="h-3.5 w-3.5" />
          {isNb ? ctaNb : ctaEn}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-pill gap-1.5 h-8 text-purple-900/80 hover:bg-white"
          onClick={onSkip}
        >
          <SkipForward className="h-3.5 w-3.5" />
          {isNb ? "Hopp over" : "Skip"}
        </Button>
      </div>
    </div>
  );
}

type OngoingFilter = "all" | "operasjonelt" | "taktisk" | "strategisk";

/** Liste over alle aktiviteter som er opprettet eller sendt — med nivå-filter. */
function OngoingActivitiesSection({
  suggestions, cardSteps, filter, onFilterChange, isNb,
}: {
  suggestions: SuggestedActivity[];
  cardSteps: Record<string, CardStep>;
  filter: OngoingFilter;
  onFilterChange: (f: OngoingFilter) => void;
  isNb: boolean;
}) {
  const ongoing = useMemo(
    () => suggestions
      .map(s => ({ s, step: cardSteps[s.id] }))
      .filter(x => x.step && x.step.kind !== "suggested"),
    [suggestions, cardSteps]
  );

  const filtered = useMemo(
    () => filter === "all" ? ongoing : ongoing.filter(x => x.s.level === filter),
    [ongoing, filter]
  );

  const counts = useMemo(() => ({
    all: ongoing.length,
    operasjonelt: ongoing.filter(x => x.s.level === "operasjonelt").length,
    taktisk: ongoing.filter(x => x.s.level === "taktisk").length,
    strategisk: ongoing.filter(x => x.s.level === "strategisk").length,
  }), [ongoing]);

  if (ongoing.length === 0) return null;

  const FILTERS: { value: OngoingFilter; nb: string; en: string }[] = [
    { value: "all", nb: "Alle", en: "All" },
    { value: "operasjonelt", nb: "Operasjonelt", en: "Operational" },
    { value: "taktisk", nb: "Taktisk", en: "Tactical" },
    { value: "strategisk", nb: "Strategisk", en: "Strategic" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {isNb ? `Pågående aktiviteter (${ongoing.length})` : `Ongoing activities (${ongoing.length})`}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map(f => {
            const active = filter === f.value;
            const count = counts[f.value];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onFilterChange(f.value)}
                className={cn(
                  "rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-all inline-flex items-center gap-1.5",
                  active
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {isNb ? f.nb : f.en}
                <span className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-foreground/10" : "bg-muted"
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1 py-2">
          {isNb ? "Ingen aktiviteter på dette nivået." : "No activities on this level."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ s, step }) => {
            const title = isNb ? s.titleNb : s.titleEn;
            const isSent = step.kind === "sent";
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  isSent ? "bg-warning" : "bg-primary"
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground truncate">{title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {isSent
                      ? (isNb ? step.whenNb : step.whenEn)
                      : (isNb ? "Opprettet — ikke påbegynt" : "Created — not started")}
                  </p>
                </div>
                <LevelChip level={s.level} isNb={isNb} />
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0",
                  isSent
                    ? "bg-warning/10 text-warning border border-warning/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                )}>
                  {isSent
                    ? (isNb ? "Under oppfølging" : "In progress")
                    : (isNb ? "Opprettet" : "Created")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
