import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, Clock, FileText, ShieldCheck, XCircle } from "lucide-react";
import { SaraIcon } from "@/components/agents/SaraIcon";
import type { AgentRequirementFinding, FindingStatus } from "@/lib/agentRequirementFindings";

interface Props {
  finding: AgentRequirementFinding;
  status: FindingStatus;
  decidedAt?: string;
  /** Navn på personen som godkjente/avviste funnet i Mynder-portalen */
  decidedBy?: string;
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
 * Viser et funn levert fra kundens egen infrastruktur — via Sara (lokal
 * agent) eller kundens egen agent (MCP/BYOA).
 *
 * Ansvarsgrensen er alltid synlig som tekst: funnet er vurdert av kundens
 * egen agent, og dokumentet er ikke delt med Mynder. Funnet er et forslag
 * som ikke påvirker skåren før en navngitt person godkjenner det i portalen.
 */
export function AgentFindingCard({ finding, status, decidedAt, decidedBy, isNb, onApprove, onReject }: Props) {
  const channelLabel =
    finding.channel === "sara"
      ? isNb
        ? "lokal compliance-agent"
        : "local compliance agent"
      : isNb
        ? "kundens agent via MCP"
        : "customer's agent via MCP";

  const decidedDate = formatDecisionDate(decidedAt, isNb);
  const decider = decidedBy || (isNb ? "deg" : "you");

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
      </div>

      {/* Ansvarsgrense (BYOA) — alltid synlig som tekst, aldri bare ikon/farge */}
      <p className="flex items-start gap-1.5 rounded-sm border border-border/60 bg-muted/50 px-2 py-1.5 text-[11px] font-medium leading-snug text-foreground">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        {isNb
          ? "Vurdert av kundens egen agent — dokument ikke delt med Mynder"
          : "Assessed by the customer's own agent — document not shared with Mynder"}
      </p>

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

      {/* Godkjenningsstatus — alltid med tekstlabel */}
      {status === "awaiting" && (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-foreground">
                {isNb ? "Forslag — påvirker ikke skåren" : "Proposal — does not affect the score"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isNb
                  ? "Et navngitt menneske hos dere må godkjenne funnet før det teller som grunnlag for kravet."
                  : "A named person in your organization must approve the finding before it counts as a basis for the requirement."}
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
              {isNb ? "Godkjenn" : "Approve"}
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
                ? `Godkjent av ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`
                : `Approved by ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isNb ? "Funnet teller som grunnlag for kravet." : "The finding counts as a basis for the requirement."}
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
                ? `Avvist av ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`
                : `Rejected by ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isNb
                ? "Funnet teller ikke som grunnlag. Kravet må dokumenteres på nytt."
                : "The finding does not count as a basis. The requirement must be documented again."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
