import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type OperatorScope = "customer" | "global";

interface TermsAcceptRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  version?: string | null;
  disabled?: boolean;
  id?: string;
  /** Show the extra "Skal du ha rolle som Driftpartner?" confirmation (partner flows). */
  showOperatorRole?: boolean;
  operatorRole?: boolean;
  onOperatorRoleChange?: (checked: boolean) => void;
  /** Om rollen skal gjelde kun denne kunden eller globalt for alle kunder. */
  operatorScope?: OperatorScope;
  onOperatorScopeChange?: (scope: OperatorScope) => void;
  /** Navn på kunden valget gjelder (vises i «Kun denne kunden»). */
  operatorScopeCustomerName?: string;
}

/**
 * Compact one-line terms consent row: checkbox + link to the single
 * combined terms document. Reused across activation and purchase flows.
 */
export function TermsAcceptRow({
  checked,
  onCheckedChange,
  version,
  disabled,
  id = "terms-accept",
  showOperatorRole,
  operatorRole = false,
  onOperatorRoleChange,
  operatorScope = "customer",
  onOperatorScopeChange,
  operatorScopeCustomerName,
}: TermsAcceptRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
        />
        <label htmlFor={id} className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Jeg godtar{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            vilkår og betingelser
          </a>
          {version ? ` (versjon ${version})` : ""}
        </label>
      </div>

      {showOperatorRole && (
        <div className="flex items-start gap-2">
          <Checkbox
            id={`${id}-operator`}
            checked={operatorRole}
            disabled={disabled}
            onCheckedChange={(v) => onOperatorRoleChange?.(v === true)}
            className="mt-0.5"
          />
          <label
            htmlFor={`${id}-operator`}
            className="text-xs text-muted-foreground leading-relaxed cursor-pointer flex items-center gap-1.5"
          >
            Skal du ha rolle som Driftpartner?
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex text-muted-foreground/70 hover:text-foreground"
                  onClick={(e) => e.preventDefault()}
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Som driftpartner kan du utføre arbeid på dette produktet eller tjenesten på vegne av
                kunden, og bekrefter at du har fått godkjenning fra kunden.
              </TooltipContent>
            </Tooltip>
          </label>
        </div>
      )}
    </div>
  );
}

