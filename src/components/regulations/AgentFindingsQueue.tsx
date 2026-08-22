import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { toast } from "sonner";
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
 * Kompakt forslagskø for agent-innsendte funn (BYOA) under Regelverk.
 *
 * Vises som én smal stripe som utvider på klikk — ingen introtekst eller
 * åpne kort som standard. Alle funn fra kundens egen agent (Sara eller MCP)
 * kommer inn som forslag og påvirker ikke skåren før et navngitt menneske
 * godkjenner dem her i Mynder-portalen.
 */
export function AgentFindingsQueue({ frameworkId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const { user } = useAuth();
  const { decisions, approve, reject } = useAgentFindings();
  const [open, setOpen] = useState(false);
  const [showDecided, setShowDecided] = useState(false);

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
    return list;
  }, [frameworkId, decisions, isNb]);

  if (entries.length === 0) return null;

  const pending = entries.filter((e) => e.status === "awaiting");
  const decided = entries.filter((e) => e.status !== "awaiting");

  const handleApprove = (requirementId: string) => {
    approve(requirementId, approverName);
    toast.success(
      isNb
        ? "Funnet er godkjent og teller nå som grunnlag for kravet."
        : "Finding approved — it now counts as a basis for the requirement.",
    );
  };

  const handleReject = (requirementId: string) => {
    reject(requirementId, approverName);
    toast(
      isNb
        ? "Funnet er avvist. Kravet må dokumenteres på nytt."
        : "Finding rejected — the requirement must be documented again.",
    );
  };

  const renderEntry = ({ finding, status, decidedAt, decidedBy, requirementName }: QueueEntry) => (
    <li key={finding.requirementId} className="space-y-1.5 px-3 py-2.5">
      <p className="text-xs font-medium text-foreground">
        {requirementName} <span className="font-mono font-normal text-muted-foreground">· {finding.requirementId}</span>
      </p>
      <AgentFindingCard
        finding={finding}
        status={status}
        decidedAt={decidedAt}
        decidedBy={decidedBy}
        isNb={isNb}
        onApprove={() => handleApprove(finding.requirementId)}
        onReject={() => handleReject(finding.requirementId)}
      />
    </li>
  );

  return (
    <section
      aria-labelledby="agent-findings-queue-heading"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
      >
        <Inbox className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <h3 id="agent-findings-queue-heading" className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {pending.length > 0
            ? isNb
              ? `${pending.length} forslag fra din agent venter på godkjenning`
              : `${pending.length} proposals from your agent await approval`
            : isNb
              ? "Alle agentfunn er behandlet"
              : "All agent findings are processed"}
        </h3>
        <span className="shrink-0 text-xs font-medium text-primary">
          {open
            ? isNb
              ? "Lukk"
              : "Close"
            : pending.length > 0
              ? isNb
                ? "Gå gjennom"
                : "Review"
              : isNb
                ? "Vis"
                : "Show"}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {pending.map(renderEntry)}

          {decided.length > 0 && (
            <li className="px-3 py-2">
              <button
                type="button"
                onClick={() => setShowDecided((v) => !v)}
                aria-expanded={showDecided}
                className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {showDecided
                  ? isNb
                    ? "Skjul avgjorte"
                    : "Hide decided"
                  : isNb
                    ? `Vis avgjorte (${decided.length})`
                    : `Show decided (${decided.length})`}
              </button>
            </li>
          )}

          {showDecided && decided.map(renderEntry)}
        </ul>
      )}
    </section>
  );
}
