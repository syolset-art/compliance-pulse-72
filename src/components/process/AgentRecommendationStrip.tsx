import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bot, Users } from "lucide-react";
import {
  useProcessAgentRecommendations,
  ProcessAgentRec,
} from "@/hooks/useProcessAgentRecommendations";

interface Props {
  workAreaId: string;
  workAreaName?: string;
}

/**
 * Compact, neutral strip shown above the process grid to surface
 * "where can an AI agent be recruited" insight at a glance.
 */
export function AgentRecommendationStrip({ workAreaId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { data: recs = [], isLoading, generate } = useProcessAgentRecommendations(workAreaId);

  const proposed = recs.filter((r: ProcessAgentRec) => r.status === "proposed");
  const autonomous = proposed.filter((r) => r.recommendation === "autonomous");
  const copilot = proposed.filter((r) => r.recommendation === "copilot");
  const recruited = recs.filter((r) => r.status === "recruited").length;

  const totalHoursSaved = proposed.reduce(
    (sum, r) => sum + Number(r.estimated_hours_saved_per_month || 0),
    0
  );

  const hasAny = recs.length > 0;
  const showRunButton = !hasAny || (!autonomous.length && !copilot.length);

  if (!hasAny && !isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>
            {isNb
              ? "Lara kan vurdere hvilke prosesser som egner seg for en AI-agent."
              : "Lara can evaluate which processes are suited for an AI agent."}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1" />
          )}
          {isNb ? "Analyser med Lara" : "Analyze with Lara"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 text-sm">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
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
          <span className="text-muted-foreground">
            {isNb ? "co-pilot" : "co-pilot"}
          </span>
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
      <div className="flex items-center gap-2">
        {showRunButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            {isNb ? "Kjør analyse" : "Run analysis"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          title={isNb ? "Oppdater analyse" : "Refresh analysis"}
        >
          {generate.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
