import { Sparkles, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Transparent disclosure om at koblingen mellom tjenester og krav/artikler
 * er foreslått av Lara (AI) — ikke verifisert av menneske, og ikke 1:1.
 *
 * Bruk samme innhold på tvers av flatene som viser AI-koblinger:
 *  - `banner` — subtil linje øverst i en seksjon
 *  - `inline` — liten label ved siden av annet innhold
 *  - `icon`   — kompakt info-ikon, egnet i tabellheadere
 */

const SHORT_TEXT =
  "Alle tjenester har en kobling til regelverk og krav. Aktiviteter er foreslått av en AI-agent — ikke verifisert av menneske. Forholdet er ikke 1:1.";

const LONG_TITLE = "Slik er koblingen laget";

const LONG_BODY = [
  "Alle tjenester har en kobling til regelverk og krav.",
  "Aktiviteter er foreslått av en AI-agent og kan inneholde feil.",
];

function LongContent() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {LONG_TITLE}
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
        {LONG_BODY.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

interface Props {
  variant?: "banner" | "inline" | "icon";
  className?: string;
  /** Kort tekst kan overstyres per plassering. */
  text?: string;
}

export function AiMappingDisclosure({ variant = "banner", className, text }: Props) {
  if (variant === "icon") {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors",
                className,
              )}
              aria-label="Om AI-koblinger"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <LongContent />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "inline") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors",
              className,
            )}
          >
            <Sparkles className="h-3 w-3 text-primary" />
            AI-forslag
            <Info className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="max-w-xs p-3">
          <LongContent />
        </PopoverContent>
      </Popover>
    );
  }

  // banner
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-xs text-muted-foreground leading-relaxed",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <p className="flex-1">
        {text ?? SHORT_TEXT}{" "}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline text-foreground/80 hover:text-foreground underline underline-offset-2 decoration-dotted"
            >
              Les mer
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-sm p-3">
            <LongContent />
          </PopoverContent>
        </Popover>
      </p>
    </div>
  );
}
