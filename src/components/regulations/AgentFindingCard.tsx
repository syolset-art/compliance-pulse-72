import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, ChevronDown, ChevronUp, Clock, ShieldCheck, XCircle } from "lucide-react";
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
 * Kompakt visning av et funn levert fra kundens egen infrastruktur — via
 * Sara (lokal agent) eller kundens egen agent (MCP/BYOA).
 *
 * Ansvarsgrensen er alltid synlig som kort tekst: funnet er vurdert av
 * kundens egen agent, og dokumentet er ikke delt med Mynder. Funnet er et
 * forslag som ikke påvirker skåren før en navngitt person godkjenner det.
 * Tekniske detaljer (kilde, dok-ID, hash, versjon) ligger bak «Detaljer».
 */
export function AgentFindingCard({ finding, status, decidedAt, decidedBy, isNb, onApprove, onReject }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const channelLabel =
    finding.channel === "sara"
      ? isNb
        ? "lokal agent"
        : "local agent"
      : "MCP";

  const decidedDate = formatDecisionDate(decidedAt, isNb);
  const decider = decidedBy || (isNb ? "deg" : "you");

  return (
    <div className="space-y-1.5 rounded-md border border-primary/25 bg-primary/[0.03] px-3 py-2.5">
      {/* Linje 1: agent + konklusjon */}
      <div className="flex items-start gap-2">
        {finding.channel === "sara" ? (
          <SaraIcon size={18} className="mt-0.5 shrink-0" />
        ) : (
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        )}
        <p className="min-w-0 text-xs leading-snug text-foreground">
          <span className="font-medium">{finding.agentName}</span>
          <span className="text-muted-foreground"> · {channelLabel} — </span>
          {isNb ? finding.summaryNb : finding.summaryEn}
        </p>
      </div>

      {/* Linje 2: ansvarsgrense (BYOA) — alltid synlig som tekst */}
      <p className="flex items-center gap-1.5 pl-6 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
        {isNb
          ? "Vurdert av din agent — dokument ikke delt med Mynder"
          : "Assessed by your agent — document not shared with Mynder"}
      </p>

      {/* Linje 3: status og handling */}
      {status === "awaiting" && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-6 pt-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {isNb ? "Forslag — teller ikke før godkjenning" : "Proposal — does not count until approved"}
          </span>
          <Button
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {isNb ? "Godkjenn" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
          >
            {isNb ? "Avvis" : "Reject"}
          </Button>
        </div>
      )}

      {status === "approved_mynder" && (
        <p className="flex items-center gap-1.5 pl-6 text-[11px] font-medium text-status-closed">
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isNb
            ? `Godkjent av ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`
            : `Approved by ${decider}${decidedDate ? ` — ${decidedDate}` : ""}`}
        </p>
      )}

      {status === "rejected" && (
        <p className="flex items-center gap-1.5 pl-6 text-[11px] font-medium text-destructive">
          <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isNb
            ? `Avvist av ${decider}${decidedDate ? ` — ${decidedDate}` : ""} — kravet må dokumenteres på nytt`
            : `Rejected by ${decider}${decidedDate ? ` — ${decidedDate}` : ""} — the requirement must be documented again`}
        </p>
      )}

      {/* Detaljer — kilde, dok-ID, hash og versjon bak utvider */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDetailsOpen((v) => !v);
        }}
        aria-expanded={detailsOpen}
        className="flex items-center gap-1 pl-6 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {detailsOpen ? (
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
        {isNb ? "Detaljer" : "Details"}
      </button>

      {detailsOpen && (
        <div className="ml-6 space-y-1 rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">{finding.source}</p>
          <p className="font-mono">
            {isNb ? "Dok" : "Doc"} {finding.documentId} · Hash {finding.hash} · v{finding.agentVersion} · {finding.deliveredAt}
          </p>
          <p>
            {isNb
              ? "Kun dokumentidentifikator og hash er delt — dokumentet forlot aldri kundens infrastruktur."
              : "Only the document identifier and hash are shared — the document never left the customer's infrastructure."}
          </p>
        </div>
      )}
    </div>
  );
}
