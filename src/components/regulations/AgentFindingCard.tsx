import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, Clock, FileText, ShieldCheck, XCircle } from "lucide-react";
import { SaraIcon } from "@/components/agents/SaraIcon";
import type { AgentRequirementFinding, FindingStatus } from "@/lib/agentRequirementFindings";

interface Props {
  finding: AgentRequirementFinding;
  status: FindingStatus;
  decidedAt?: string;
  isNb: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function formatDecisionDate(at: string | undefined, isNb: boolean): string {
  if (!at) return "";
  try {
    return new Date(at).toLocaleDateString(isNb ? "nb-NO" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Viser dokumentasjon levert fra kundens egen infrastruktur — via Sara (lokal
 * agent) eller kundens egen agent (MCP) — med kilde (navn og sted) og
 * godkjenningsflyt. Funnet teller først som dokumentasjon når det er godkjent.
 */
export function AgentFindingCard({ finding, status, decidedAt, isNb, onApprove, onReject }: Props) {
  const channelLabel =
    finding.channel === "sara"
      ? isNb
        ? "lokal compliance-agent"
        : "local compliance agent"
      : isNb
        ? "kundens agent via MCP"
        : "customer's agent via MCP";

  return (
    <div className="space-y-3 rounded-md border border-primary/25 bg-primary/[0.03] p-3">
      {/* Agent-header */}
      <div className="flex items-start gap-2.5">
        {finding.channel === "sara" ? (
          <SaraIcon size={26} className="mt-0.5 shrink-0" />
        ) : (
          <div className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {finding.agentName}{" "}
            <span className="font-normal text-muted-foreground">· {channelLabel}</span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {isNb ? finding.summaryNb : finding.summaryEn}
          </p>
        </div>
        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
          {finding.channel === "sara" ? "Sara" : "MCP"}
        </Badge>
      </div>

      {/* Kilde: navn og sted hos kunden */}
      <div className="rounded-md border border-border/60 bg-card px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {finding.source}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-mono">
            {isNb ? "Dok" : "Doc"} {finding.documentId}
          </span>
          <span className="font-mono">Hash {finding.hash}</span>
          <span>
            {isNb ? "Agent" : "Agent"} v{finding.agentVersion}
          </span>
          <span>{finding.deliveredAt}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {isNb
            ? "Kun dokumentidentifikator og hash er delt — dokumentet forlot aldri kundens infrastruktur."
            : "Only the document identifier and hash are shared — the document never left the customer's infrastructure."}
        </p>
      </div>

      {/* Godkjenningsstatus */}
      {status === "approved_source" && (
        <div className="flex items-start gap-2 rounded-md border border-status-closed/30 bg-status-closed/5 px-3 py-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-closed" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-foreground">
              {finding.channel === "sara"
                ? isNb
                  ? `Godkjent funn (av ${finding.verifiedBy})`
                  : `Approved finding (by ${finding.verifiedBy})`
                : isNb
                  ? "Godkjent i kundens system før innsending"
                  : "Approved in the customer's system before submission"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {finding.channel === "sara"
                ? isNb
                  ? "Funnet er verifisert av en ansvarlig person i kundens egen infrastruktur og levert av Sara. Det teller som dokumentasjon."
                  : "The finding has been verified by a responsible person in the customer's own infrastructure and delivered by Sara. It counts as documentation."
                : isNb
                  ? "En navngitt person hos kunden har bekreftet funnet. Det teller som dokumentasjon."
                  : "A named person at the customer has confirmed the finding. It counts as documentation."}
            </p>
          </div>
        </div>
      )}

      {status === "awaiting" && (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-foreground">
                {isNb ? "Venter på din godkjenning" : "Awaiting your approval"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isNb
                  ? "Funnet er ikke godkjent ennå og teller ikke som dokumentasjon før du godkjenner det."
                  : "The finding is not approved yet and does not count as documentation until you approve it."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isNb ? "Godkjenn funn" : "Approve finding"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
            >
              {isNb ? "Avvis" : "Reject"}
            </Button>
          </div>
        </div>
      )}

      {status === "approved_mynder" && (
        <div className="flex items-start gap-2 rounded-md border border-status-closed/30 bg-status-closed/5 px-3 py-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-closed" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-foreground">
              {isNb
                ? `Godkjent av deg${formatDecisionDate(decidedAt, isNb) ? ` — ${formatDecisionDate(decidedAt, isNb)}` : ""}`
                : `Approved by you${formatDecisionDate(decidedAt, isNb) ? ` — ${formatDecisionDate(decidedAt, isNb)}` : ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isNb ? "Funnet teller som dokumentasjon." : "The finding counts as documentation."}
            </p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-foreground">
              {isNb
                ? `Avvist av deg${formatDecisionDate(decidedAt, isNb) ? ` — ${formatDecisionDate(decidedAt, isNb)}` : ""}`
                : `Rejected by you${formatDecisionDate(decidedAt, isNb) ? ` — ${formatDecisionDate(decidedAt, isNb)}` : ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isNb
                ? "Funnet teller ikke som dokumentasjon. Kravet må dokumenteres på nytt."
                : "The finding does not count as documentation. The requirement must be documented again."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
