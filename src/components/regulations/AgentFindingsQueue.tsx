import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AgentFindingCard } from "@/components/regulations/AgentFindingCard";
import {
  AGENT_REQUIREMENT_FINDINGS,
  resolveFindingStatus,
  useAgentFindings,
  type AgentRequirementFinding,
  type FindingStatus,
} from "@/lib/agentRequirementFindings";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  frameworkId: string;
}

interface QueueEntry {
  finding: AgentRequirementFinding;
  status: FindingStatus;
  decidedAt?: string;
  decidedBy?: string;
  requirementName: string;
}

/**
 * Forslagskø for agent-innsendte funn (BYOA) under Regelverk.
 *
 * Alle funn fra kundens egen agent (Sara eller MCP) kommer inn som forslag
 * og påvirker ikke skåren før et navngitt menneske godkjenner dem her i
 * Mynder-portalen. Ansvarsgrensen «vurdert av kundens egen agent — dokument
 * ikke delt med Mynder» er alltid synlig som tekst på hvert funn.
 */
export function AgentFindingsQueue({ frameworkId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const { user } = useAuth();
  const { decisions, approve, reject } = useAgentFindings();

  const approverName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    undefined;

  const entries = useMemo<QueueEntry[]>(() => {
    const main = getRequirementsByFramework(frameworkId);
    const reqs = main.length > 0 ? main : ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
    const nameByReqId = new Map(reqs.map((r) => [r.requirement_id, isNb ? r.name_no : r.name]));

    const list: QueueEntry[] = [];
    for (const finding of AGENT_REQUIREMENT_FINDINGS) {
      const requirementName = nameByReqId.get(finding.requirementId);
      if (!requirementName) continue;
      const decision = decisions[finding.requirementId];
      list.push({
        finding,
        status: resolveFindingStatus(finding, decisions),
        decidedAt: decision?.at,
        decidedBy: decision?.by,
        requirementName,
      });
    }
    // Ventende forslag først, deretter avgjorte — stabil rekkefølge innad.
    const rank = (s: FindingStatus) => (s === "awaiting" ? 0 : s === "approved_mynder" ? 1 : 2);
    return list.sort((a, b) => rank(a.status) - rank(b.status));
  }, [frameworkId, decisions, isNb]);

  if (entries.length === 0) return null;

  const pendingCount = entries.filter((e) => e.status === "awaiting").length;

  return (
    <section
      aria-labelledby="agent-findings-queue-heading"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 id="agent-findings-queue-heading" className="text-sm font-semibold text-foreground">
            {isNb ? "Forslag fra kundens agent" : "Proposals from the customer's agent"}
          </h3>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {isNb
                ? `${pendingCount} venter godkjenning`
                : `${pendingCount} awaiting approval`}
            </Badge>
          )}
        </div>
      </header>

      <p className="px-4 pt-3 text-xs leading-relaxed text-muted-foreground">
        {isNb
          ? "Funnene er vurdert av kundens egen agent (Sara eller MCP) — dokumentene er ikke delt med Mynder. Et navngitt menneske må godkjenne hvert funn før det teller som grunnlag eller påvirker skåren."
          : "The findings are assessed by the customer's own agent (Sara or MCP) — the documents are not shared with Mynder. A named person must approve each finding before it counts as a basis or affects the score."}
      </p>

      <ul className="divide-y divide-border">
        {entries.map(({ finding, status, decidedAt, decidedBy, requirementName }) => (
          <li key={finding.requirementId} className="space-y-2 px-4 py-3">
            {/* Kravreferanse + konklusjon */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-sm font-medium text-foreground">{requirementName}</p>
              <span className="font-mono text-xs text-muted-foreground">{finding.requirementId}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{isNb ? "Konklusjon: " : "Conclusion: "}</span>
              {isNb ? finding.conclusionNb : finding.conclusionEn}
            </p>

            <AgentFindingCard
              finding={finding}
              status={status}
              decidedAt={decidedAt}
              decidedBy={decidedBy}
              isNb={isNb}
              onApprove={() => {
                approve(finding.requirementId, approverName);
                toast.success(
                  isNb
                    ? "Funnet er godkjent og teller nå som grunnlag for kravet."
                    : "Finding approved — it now counts as a basis for the requirement.",
                );
              }}
              onReject={() => {
                reject(finding.requirementId, approverName);
                toast(
                  isNb
                    ? "Funnet er avvist. Kravet må dokumenteres på nytt."
                    : "Finding rejected — the requirement must be documented again.",
                );
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
