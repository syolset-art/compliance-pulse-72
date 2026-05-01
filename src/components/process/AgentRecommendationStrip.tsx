import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bot, Users, RefreshCw, EyeOff } from "lucide-react";
import {
  useProcessAgentRecommendations,
  ProcessAgentRec,
} from "@/hooks/useProcessAgentRecommendations";
import { useAgentInsightReveal } from "@/hooks/useAgentInsightReveal";

interface Props {
  workAreaId: string;
  workAreaName?: string;
}

/**
 * Compact, neutral strip shown above the process grid.
 *
 * Two states:
 *  - **Teaser** (collapsed): Lara has already analyzed in the background.
 *    We show a one-line summary with a "Show insight" CTA. Until the user
 *    reveals it, agent chips on the cards stay hidden — keeping the UI calm.
 *  - **Revealed**: Full breakdown of autonomous / co-pilot / hours saved,
 *    plus a quiet refresh.
 */
export function AgentRecommendationStrip({ workAreaId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { data: recs = [], isLoading, generate } = useProcessAgentRecommendations(workAreaId);
  const { revealed, reveal, hide } = useAgentInsightReveal(workAreaId);

  const proposed = recs.filter((r: ProcessAgentRec) => r.status === "proposed");
  const autonomous = proposed.filter((r) => r.recommendation === "autonomous");
  const copilot = proposed.filter((r) => r.recommendation === "copilot");
  const recruited = recs.filter((r) => r.status === "recruited").length;
  const totalHoursSaved = proposed.reduce(
    (sum, r) => sum + Number(r.estimated_hours_saved_per_month || 0),
    0
  );
  const actionable = autonomous.length + copilot.length;

  // No analysis exists AND none is running yet — leave it to the lazy
  // backfill in ProcessList; render nothing rather than a noisy empty state.
  if (recs.length === 0 && (isLoading || generate.isPending)) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>
          {isNb
            ? "Lara analyserer prosessene dine for AI-agent-potensial…"
            : "Lara is analyzing your processes for AI agent potential…"}
        </span>
      </div>
    );
  }

  if (recs.length === 0) {
    // Backfill not yet triggered — give a quiet manual entry point.
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          {isNb
            ? "Lara kan vurdere hvor en AI-agent kan ta over arbeid."
            : "Lara can evaluate where an AI agent could take over work."}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => generate.mutate({})}
          disabled={generate.isPending}
        >
          {isNb ? "Analyser" : "Analyze"}
        </Button>
      </div>
    );
  }

  // ── Teaser (collapsed) ────────────────────────────────────────────────
  if (!revealed) {
    return (
      <button
        type="button"
        onClick={reveal}
        className="w-full text-left rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors px-4 py-2.5 flex items-center justify-between gap-3"
      >
        <span className="text-sm inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground">
            {actionable > 0 ? (
              isNb ? (
                <>
                  Lara har identifisert <strong>{actionable}</strong> prosess
                  {actionable === 1 ? "" : "er"} hvor en AI-agent kan ta over arbeid.
                </>
              ) : (
                <>
                  Lara identified <strong>{actionable}</strong> process
                  {actionable === 1 ? "" : "es"} where an AI agent could take over work.
                </>
              )
            ) : isNb ? (
              "Lara har vurdert prosessene dine."
            ) : (
              "Lara has evaluated your processes."
            )}
          </span>
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {isNb ? "Vis innsikt" : "Show insight"}
        </span>
      </button>
    );
  }

  // ── Revealed ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 text-sm">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">
          {isNb ? "Agent-potensial:" : "Agent potential:"}
        </span>
        <span className="inline-flex items-center gap-1 text-foreground">
          <Bot className="h-3.5 w-3.5" />
          <strong>{autonomous.length}</strong>{" "}
          <span className="text-muted-foreground">
            {isNb ? "autonom-klare" : "autonomous-ready"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-foreground">
          <Users className="h-3.5 w-3.5" />
          <strong>{copilot.length}</strong>{" "}
          <span className="text-muted-foreground">co-pilot</span>
        </span>
        {totalHoursSaved > 0 && (
          <span className="text-muted-foreground hidden sm:inline">
            ·{" "}
            {isNb
              ? `~${Math.round(totalHoursSaved)} t/mnd potensiell besparelse`
              : `~${Math.round(totalHoursSaved)} h/mo potential saving`}
          </span>
        )}
        {recruited > 0 && (
          <span className="text-muted-foreground hidden md:inline">
            · {recruited} {isNb ? "rekruttert" : "recruited"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => generate.mutate({})}
          disabled={generate.isPending}
          title={isNb ? "Oppdater analyse" : "Refresh analysis"}
          className="h-7 px-2"
        >
          {generate.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={hide}
          title={isNb ? "Skjul" : "Hide"}
          className="h-7 px-2"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
