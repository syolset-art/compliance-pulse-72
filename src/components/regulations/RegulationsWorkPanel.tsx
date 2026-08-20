import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, Sparkles, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { RequirementNextStep } from "@/components/regulations/RequirementNextStep";
import type { WorkFilter, WorkItem } from "@/lib/regulationsApprovalQueue";
import { cn } from "@/lib/utils";

interface Props {
  items: WorkItem[];
  counts: Record<WorkFilter, number>;
  saraInstalled: boolean;
  onOpenRequirement: (item: WorkItem) => void;
  onUpload: (item: WorkItem) => void;
  onAskSara: (item: WorkItem) => void;
  onCreateTask: (item: WorkItem) => void;
  onAssess: (item: WorkItem) => void;
  className?: string;
}

const FILTERS: { id: WorkFilter; nb: string; en: string; icon: typeof Clock; iconClass: string }[] = [
  { id: "waiting_you", nb: "Venter på meg", en: "Waiting for me", icon: Clock, iconClass: "text-warning" },
  { id: "lara", nb: "Lara følger opp", en: "Lara is following up", icon: Sparkles, iconClass: "text-primary" },
  { id: "ok", nb: "I orden", en: "In order", icon: CheckCircle2, iconClass: "text-success" },
  {
    id: "gap",
    nb: "Mangler dokumentasjon",
    en: "Missing documentation",
    icon: AlertTriangle,
    iconClass: "text-destructive",
  },
];

const PAGE = 8;

/** Arbeidsflate på tvers av alle aktive regelverk — filtrer og jobb videre. */
export function RegulationsWorkPanel({
  items,
  counts,
  saraInstalled,
  onOpenRequirement,
  onUpload,
  onAskSara,
  onCreateTask,
  onAssess,
  className,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [filter, setFilter] = useState<WorkFilter>("waiting_you");
  const [limit, setLimit] = useState(PAGE);

  const visible = useMemo(() => {
    if (filter === "waiting_you") return items.filter((i) => i.filter === "pending" || i.filter === "gap");
    return items.filter((i) => i.filter === filter);
  }, [items, filter]);

  const shown = visible.slice(0, limit);

  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="text-sm font-semibold text-foreground">{isNb ? "Jobb med regelverk" : "Work on regulations"}</h2>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const active = filter === f.id;
          return (
            <Button
              key={f.id}
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-7 gap-1.5 text-xs"
              onClick={() => {
                setFilter(f.id);
                setLimit(PAGE);
              }}
            >
              <Icon className={cn("h-3.5 w-3.5", !active && f.iconClass)} />
              {isNb ? f.nb : f.en}
              <span className="opacity-70">{counts[f.id]}</span>
            </Button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {shown.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {isNb ? "Ingen krav i denne visningen." : "No requirements in this view."}
          </p>
        )}

        {shown.map((item) => {
          const isGap = item.filter === "gap";
          const isPending = item.filter === "pending";
          return (
            <div key={item.key} className="border-b border-border px-3 py-2.5 last:border-b-0">
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{item.requirementName}</p>
                    {item.source === "sara" && saraInstalled && (
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <SaraIcon className="h-4 w-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            {isNb
                              ? "Dokumentasjonsunderlaget er hentet av Sara, den lokale agenten."
                              : "The documentation record was collected by Sara, the local agent."}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {isPending && (
                      <span className="rounded-full border border-warning/40 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                        {isNb ? "Venter på godkjenning" : "Pending approval"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.frameworkName} · {item.requirementId} · {item.docLabel}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  onClick={() => onOpenRequirement(item)}
                  aria-label={isNb ? "Åpne kravet" : "Open requirement"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {isGap && (
                <div className="mt-2 rounded-lg bg-muted/40 px-2.5 py-2">
                  <RequirementNextStep
                    item={item}
                    saraInstalled={saraInstalled}
                    onUpload={onUpload}
                    onAskSara={onAskSara}
                    onCreateTask={onCreateTask}
                    onAssess={onAssess}
                  />
                </div>
              )}
            </div>
          );
        })}

        {visible.length > shown.length && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="w-full px-3 py-2.5 text-xs font-medium text-primary hover:bg-muted/40"
          >
            {isNb ? `Vis flere (${visible.length - shown.length})` : `Show more (${visible.length - shown.length})`}
          </button>
        )}
      </div>
    </section>
  );
}
