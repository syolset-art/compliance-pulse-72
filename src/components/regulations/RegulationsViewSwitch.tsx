import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STORAGE_KEY = "regulationsView";

export type RegulationsView = "classic" | "beta";

export function rememberRegulationsView(view: RegulationsView) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}

export function loadRegulationsView(): RegulationsView {
  try {
    return localStorage.getItem(STORAGE_KEY) === "beta" ? "beta" : "classic";
  } catch {
    return "classic";
  }
}

interface Props {
  current: RegulationsView;
  className?: string;
}

/** Diskret bryter mellom klassisk og agentisk beta-visning av regelverk. */
export function RegulationsViewSwitch({ current, className }: Props) {
  const navigate = useNavigate();

  const go = (view: RegulationsView) => {
    if (view === current) return;
    rememberRegulationsView(view);
    navigate(view === "beta" ? "/regulations-beta" : "/regulations");
  };

  const options: { key: RegulationsView; label: string; hint: string }[] = [
    { key: "classic", label: "Klassisk", hint: "Dagens visning med oversikt, filtre og kravliste." },
    { key: "beta", label: "Beta", hint: "Ny agentisk visning: Lara viser hva hun har gjort og hva som venter på deg." },
  ];

  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5",
          className,
        )}
        role="group"
        aria-label="Velg visning for regelverk"
      >
        {options.map((o) => (
          <Tooltip key={o.key} delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => go(o.key)}
                aria-pressed={current === o.key}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  current === o.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[16rem]">
              {o.hint}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
