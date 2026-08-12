import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Check,
  X,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LARA_WORK_QUEUE,
  LARA_AUTONOMY_LABELS,
  formatNok,
  type LaraAutonomy,
  type LaraQueueItem,
} from "@/lib/laraWorkQueue";

export function LaraWorkQueueWidget() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<LaraQueueItem[]>(LARA_WORK_QUEUE);
  const [autonomy, setAutonomy] = useState<LaraAutonomy>("assisted");
  const [showDone, setShowDone] = useState(false);

  const pending = useMemo(() => items.filter((i) => i.state === "pending"), [items]);
  const autoDone = useMemo(() => items.filter((i) => i.state === "auto-done"), [items]);
  const blocked = useMemo(() => items.filter((i) => i.state === "blocked"), [items]);

  const resolve = (item: LaraQueueItem, approved: boolean) => {
    setItems((prev) =>
      approved
        ? prev.map((i) =>
            i.id === item.id ? { ...i, state: "auto-done", doneAt: "nå" } : i
          )
        : prev.filter((i) => i.id !== item.id)
    );
    toast({
      title: approved ? "Godkjent — Lara utfører" : "Avvist",
      description: approved
        ? `${item.action} · ${item.customer}. Handlingen er logget i aktivitetsloggen.`
        : `Lara arkiverer forslaget for ${item.customer} og lærer av avslaget.`,
    });
  };

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-semibold">
            Laras arbeidskø
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none tabular-nums">{pending.length}</span>
            <span className="text-sm text-muted-foreground">venter på deg</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">Laras autonominivå: {LARA_AUTONOMY_LABELS[autonomy].nb}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs">Laras autonominivå</DropdownMenuLabel>
            {(Object.keys(LARA_AUTONOMY_LABELS) as LaraAutonomy[]).map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => setAutonomy(level)}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {LARA_AUTONOMY_LABELS[level].nb}
                  {autonomy === level && <Check className="h-3.5 w-3.5 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">
                  {LARA_AUTONOMY_LABELS[level].hint}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Gjort automatisk */}
      {autoDone.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="flex-1 truncate">
              Lara har utført {autoDone.length} oppgaver uten deg
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${showDone ? "rotate-180" : ""}`}
            />
          </button>
          {showDone && (
            <ul className="border-t border-border px-3 py-2 space-y-1.5">
              {autoDone.map((i) => (
                <li key={i.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground">{i.action}</span> · {i.customer}
                  {i.doneAt ? ` · ${i.doneAt}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Venter på deg */}
      <div className="space-y-2">
        {pending.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{item.customer}</span>
                  {item.value !== undefined && (
                    <Badge variant="outline" className="text-[10px] tabular-nums">
                      {formatNok(item.value)}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-foreground/90">{item.action}</p>
                <TooltipProvider delayDuration={100}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <p className="mt-0.5 cursor-help truncate text-xs text-muted-foreground">
                        {item.rationale}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-xs">
                      {item.rationale}
                      <span className="mt-1 block text-muted-foreground">Kilde: {item.source}</span>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Button size="sm" onClick={() => resolve(item, true)}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Godkjenn
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/msp-partner/widget/needs-follow-up")}
              >
                <FileText className="mr-1 h-3.5 w-3.5" />
                Se utkast
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => resolve(item, false)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Avvis
              </Button>
            </div>
          </div>
        ))}

        {pending.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Køen er tom. Lara varsler deg når det er noe å godkjenne.
          </p>
        )}
      </div>

      {/* Blokkert */}
      {blocked.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{item.customer}</div>
            <div className="truncate text-xs text-muted-foreground">{item.blocker}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/settings/integrations")}
          >
            Løs
          </Button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => navigate("/msp-partner/widget/needs-follow-up")}
        className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Se hele køen
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
