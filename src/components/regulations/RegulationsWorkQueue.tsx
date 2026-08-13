import { CheckCircle2, FileCheck2, HelpCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { staggerEntranceClass } from "@/lib/animation";
import type { RegulationQueueItem, RegulationQueueKind } from "@/lib/regulationsAgentQueue";

const KIND_META: Record<RegulationQueueKind, { icon: typeof FileCheck2; label: string; iconClass: string }> = {
  approve_evidence: { icon: FileCheck2, label: "Godkjenn bevis", iconClass: "text-success" },
  confirm_status: { icon: ShieldCheck, label: "Bekreft status", iconClass: "text-primary" },
  missing_basis: { icon: HelpCircle, label: "Mangler grunnlag", iconClass: "text-warning" },
};

interface Props {
  items: RegulationQueueItem[];
  onOpen: (item: RegulationQueueItem) => void;
  className?: string;
}

/** Laras arbeidskø for regelverk — maks tre kort, ett valg per kort. */
export function RegulationsWorkQueue({ items, onOpen, className }: Props) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4 text-success" />
        Alt er i orden. Jeg sier fra når noe trenger deg.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", className)}>
        {items.map((item, i) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40",
                staggerEntranceClass(i + 1),
              )}
            >
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <span className="flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded-full bg-muted">
                    <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[18rem]">
                  {item.rationale}
                </TooltipContent>
              </Tooltip>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {meta.label} · {item.frameworkName} · {item.count} krav
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1 text-xs"
                onClick={() => onOpen(item)}
              >
                Åpne
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
