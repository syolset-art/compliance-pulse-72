import { Check, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaraIcon } from "@/components/agents/LaraIcon";

interface Props {
  isNb: boolean;
  /** Forslaget fra Lara, ferdig oversatt */
  suggestedLabel: string;
  /** Kort begrunnelse for hvorfor Lara foreslår dette */
  reason?: string;
  /** Satt av bruker (godkjent eller overstyrt) */
  approvedBy?: string | null;
  approvedAt?: string | null;
  /** Skjul godkjenn-knappen når verdien allerede er lik forslaget */
  matchesCurrent?: boolean;
  onApprove: () => void;
}

/**
 * Forslag fra Lara på ett enkelt felt. Brukeren kan godkjenne forslaget,
 * eller redigere verdien i nedtrekksfeltet ved siden av.
 */
export const LaraFieldSuggestion = ({
  isNb,
  suggestedLabel,
  reason,
  approvedBy,
  approvedAt,
  matchesCurrent,
  onApprove,
}: Props) => {
  if (approvedBy) {
    return (
      <div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-tight">
        <UserRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          {isNb ? "Bekreftet av " : "Confirmed by "}
          {approvedBy}
          {approvedAt ? `, ${approvedAt}` : ""}
        </span>
      </div>
    );
  }

  if (matchesCurrent) {
    return (
      <div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-tight">
        <LaraIcon size={16} />
        <span>
          {isNb ? "Følger Laras forslag" : "Following Lara's suggestion"}
          {reason ? ` — ${reason}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-md border border-primary/15 bg-primary/5 p-2">
      <div className="flex items-start gap-1.5 text-[13px] leading-tight">
        <LaraIcon size={16} />
        <span className="text-muted-foreground">
          {isNb ? "Forslag: " : "Suggestion: "}
          <span className="font-medium text-foreground">{suggestedLabel}</span>
          {reason ? ` — ${reason}` : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-7 gap-1 text-[12px]" onClick={onApprove}>
          <Check className="h-3 w-3" />
          {isNb ? "Godkjenn" : "Approve"}
        </Button>
        <span className="text-[12px] text-muted-foreground">
          {isNb ? "eller velg selv i feltet over" : "or choose your own above"}
        </span>
      </div>
    </div>
  );
};
