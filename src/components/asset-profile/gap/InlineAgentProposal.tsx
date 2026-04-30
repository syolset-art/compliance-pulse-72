import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  HelpCircle,
  Pencil,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ProposalKind =
  | "request_document"
  | "renew_document"
  | "draft_policy"
  | "fill_metadata"
  | "find_contact"
  | "review_task";

export interface AgentProposal {
  kind: ProposalKind;
  title: string;
  detail: string;
  recipient?: string;
  dueDays?: number;
}

interface Props {
  proposal: AgentProposal;
  vendorName: string;
  requirementId: string;
  onConfirmed?: () => void;
  compact?: boolean;
}

type Mode = "proposal" | "clarify" | "editing" | "started" | "dismissed";

export function InlineAgentProposal({
  proposal,
  vendorName,
  requirementId,
  onConfirmed,
  compact,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [mode, setMode] = useState<Mode>("proposal");
  const [recipient, setRecipient] = useState(proposal.recipient ?? "");
  const [dueDays, setDueDays] = useState(proposal.dueDays ?? 14);
  const [instruction, setInstruction] = useState("");
  const [clarifyAnswer, setClarifyAnswer] = useState("");

  const t = {
    proposes: isNb ? "Lara foreslår" : "Lara suggests",
    confirm: isNb ? "Bekreft og start" : "Confirm & start",
    edit: isNb ? "Endre" : "Edit",
    needInfo: isNb ? "Trenger mer info" : "Needs more info",
    save: isNb ? "Lagre" : "Save",
    cancel: isNb ? "Avbryt" : "Cancel",
    started: isNb ? "Startet av Lara" : "Started by Lara",
    waiting: isNb ? "venter på leverandør" : "waiting on vendor",
    dismissed: isNb ? "Forslag avvist" : "Suggestion dismissed",
    reopen: isNb ? "Gjenåpne" : "Reopen",
    dismiss: isNb ? "Avvis forslag" : "Dismiss suggestion",
    notRelevant: isNb ? "Marker som ikke relevant" : "Mark as not relevant",
    manualTask: isNb ? "Lag manuell oppgave" : "Create manual task",
    recipientLabel: isNb ? "Mottaker" : "Recipient",
    dueLabel: isNb ? "Frist (dager)" : "Due (days)",
    instructionLabel: isNb ? "Tilleggsinstruksjon" : "Extra instruction",
    clarifyQ:
      proposal.kind === "find_contact"
        ? isNb
          ? "Hvem er riktig kontakt for sikkerhetsdokumentasjon?"
          : "Who is the right contact for security documentation?"
        : isNb
        ? `Trenger du å justere noe før Lara starter? F.eks. annen mottaker enn ${
            proposal.recipient ?? vendorName
          }?`
        : `Anything to adjust before Lara starts? E.g. a different recipient than ${
            proposal.recipient ?? vendorName
          }?`,
    submit: isNb ? "Send svar" : "Send",
  };

  if (mode === "dismissed") {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <X className="h-3 w-3" />
          {t.dismissed}
        </span>
        <button
          className="text-xs hover:text-foreground underline-offset-2 hover:underline"
          onClick={() => setMode("proposal")}
        >
          {t.reopen}
        </button>
      </div>
    );
  }

  if (mode === "started") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        <span>
          <strong className="text-foreground">{t.started}</strong> · {t.waiting}
        </span>
      </div>
    );
  }

  const handleConfirm = () => {
    setMode("started");
    toast.success(
      isNb ? "Lara har startet tiltaket" : "Lara has started the action",
      { description: proposal.title }
    );
    onConfirmed?.();
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs">
            <span className="text-muted-foreground">{t.proposes}: </span>
            <span className="font-medium text-foreground">{proposal.title}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {proposal.detail}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMode("dismissed")}>
              {t.dismiss}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("dismissed")}>
              {t.notRelevant}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info(isNb ? "Manuell oppgave opprettet" : "Manual task created")
              }
            >
              {t.manualTask}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mode === "proposal" && (
        <div className="flex flex-wrap items-center gap-1.5 pl-8">
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleConfirm}
            data-proposal-id={requirementId}
          >
            <ArrowRight className="h-3 w-3" />
            {t.confirm}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setMode("editing")}
          >
            <Pencil className="h-3 w-3" />
            {t.edit}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setMode("clarify")}
          >
            <HelpCircle className="h-3 w-3" />
            {t.needInfo}
          </Button>
        </div>
      )}

      {mode === "editing" && (
        <div className="pl-8 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground">
                {t.recipientLabel}
              </label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-7 text-xs"
                placeholder={vendorName}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">{t.dueLabel}</label>
              <Input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              {t.instructionLabel}
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="text-xs min-h-[56px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 text-xs" onClick={handleConfirm}>
              {t.save} & {t.confirm.toLowerCase()}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setMode("proposal")}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      )}

      {mode === "clarify" && (
        <div className="pl-8 space-y-2">
          <p className="text-xs text-foreground">{t.clarifyQ}</p>
          <Textarea
            value={clarifyAnswer}
            onChange={(e) => setClarifyAnswer(e.target.value)}
            className="text-xs min-h-[56px]"
            placeholder={isNb ? "Skriv kort svar..." : "Write a short answer..."}
          />
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                toast.success(
                  isNb
                    ? "Lara har oppdatert forslaget"
                    : "Lara has updated the suggestion"
                );
                setMode("proposal");
              }}
              disabled={!clarifyAnswer.trim()}
            >
              {t.submit}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setMode("proposal")}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: build a proposal from gap item
export function buildProposal(
  item: {
    requirement_id: string;
    name: string;
    status: string;
    next_action?: string;
    signal_key?: string;
  },
  vendorName: string,
  isNb: boolean
): AgentProposal {
  const key = (item.signal_key || "").toLowerCase();
  const isPartial = item.status === "partial";

  if (key.includes("soc2") || key.includes("iso27001") || key.includes("pentest") || key.includes("dpa")) {
    return {
      kind: isPartial ? "renew_document" : "request_document",
      title: isPartial
        ? isNb
          ? `Be om fornyet ${docLabel(key, isNb)}`
          : `Request renewed ${docLabel(key, isNb)}`
        : isNb
        ? `Be om ${docLabel(key, isNb)}`
        : `Request ${docLabel(key, isNb)}`,
      detail: isNb
        ? `Sender forespørsel til kontaktperson hos ${vendorName} med 14 dagers frist. Knyttes til krav ${item.requirement_id}.`
        : `Sends a request to the contact at ${vendorName} with a 14-day deadline. Linked to requirement ${item.requirement_id}.`,
      recipient: vendorName,
      dueDays: 14,
    };
  }
  if (key.includes("policy") || key.includes("rutine") || key.includes("procedure")) {
    return {
      kind: "draft_policy",
      title: isNb
        ? `Generer utkast til policy for ${item.name}`
        : `Draft a policy for ${item.name}`,
      detail: isNb
        ? "Lara lager et utkast basert på rammeverkets krav. Du godkjenner før publisering."
        : "Lara drafts a policy based on the framework requirement. You approve before publishing.",
    };
  }
  if (key.includes("contact") || key.includes("dpo") || key.includes("ciso")) {
    return {
      kind: "find_contact",
      title: isNb
        ? `Finn riktig kontaktperson hos ${vendorName}`
        : `Find the right contact at ${vendorName}`,
      detail: isNb
        ? "Lara søker leverandørens nettsider og foreslår kontakt. Du bekrefter før den lagres."
        : "Lara searches the vendor's website and proposes a contact. You confirm before saving.",
    };
  }
  if (key.includes("category") || key.includes("metadata") || key.includes("classif")) {
    return {
      kind: "fill_metadata",
      title: isNb ? "Forhåndsutfyll manglende felt" : "Pre-fill missing fields",
      detail: isNb
        ? "Lara foreslår verdier basert på leverandørens dokumentasjon. Bekreft eller juster inline."
        : "Lara suggests values based on vendor documentation. Confirm or adjust inline.",
    };
  }
  // Fallback: review task
  return {
    kind: "review_task",
    title: item.next_action || (isNb ? "Følg opp leverandøren" : "Follow up with vendor"),
    detail: isNb
      ? `Oppretter en aktivitet for leverandøransvarlig knyttet til krav ${item.requirement_id}.`
      : `Creates an activity for the vendor manager linked to requirement ${item.requirement_id}.`,
  };
}

function docLabel(key: string, isNb: boolean): string {
  if (key.includes("soc2")) return "SOC 2 Type II";
  if (key.includes("iso27001")) return "ISO 27001";
  if (key.includes("pentest")) return isNb ? "pentest-rapport" : "pentest report";
  if (key.includes("dpa")) return isNb ? "databehandleravtale" : "DPA";
  return isNb ? "dokument" : "document";
}
