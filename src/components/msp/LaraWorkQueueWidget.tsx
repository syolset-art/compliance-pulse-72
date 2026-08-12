import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  AlertTriangle,
  Settings2,
  MoreHorizontal,
  Zap,
  ShieldCheck,
  ClipboardCheck,
  Network,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  LARA_WORK_QUEUE,
  LARA_AUTONOMY_LABELS,
  LARA_KIND_LABELS,
  LARA_RISK_LABELS,
  type LaraAutonomy,
  type LaraQueueItem,
  type LaraQueueKind,
} from "@/lib/laraWorkQueue";
import { LaraReviewSheet, riskBadgeClass, type ReviewDecision } from "@/components/msp/LaraReviewSheet";

const KIND_ICON: Record<LaraQueueKind, typeof Zap> = {
  activate: Zap,
  evidence: ShieldCheck,
  report: FileText,
  audit: ClipboardCheck,
  vendor_mapping: Network,
};

export function LaraWorkQueueWidget() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [items, setItems] = useState<LaraQueueItem[]>(LARA_WORK_QUEUE);
  const [autonomy, setAutonomy] = useState<LaraAutonomy>("assisted");
  const [reviewing, setReviewing] = useState<LaraQueueItem | null>(null);

  const openItems = useMemo(
    () => items.filter((i) => i.state !== "auto-done"),
    [items]
  );
  const rows = useMemo(() => openItems.slice(0, 3), [openItems]);
  const hiddenCount = openItems.length - rows.length;
  const autoDoneCount = useMemo(
    () => items.filter((i) => i.state === "auto-done").length,
    [items]
  );

  const handleDecision = (item: LaraQueueItem, decision: ReviewDecision) => {
    setItems((prev) =>
      decision.type === "approve"
        ? prev.map((i) => (i.id === item.id ? { ...i, state: "auto-done" as const, doneAt: "nå" } : i))
        : decision.type === "revise"
        ? prev.map((i) => (i.id === item.id ? { ...i, state: "revising" as const } : i))
        : prev.filter((i) => i.id !== item.id)
    );
    setReviewing(null);
    toast({
      title:
        decision.type === "approve"
          ? isNb
            ? "Godkjent — Lara iverksetter"
            : "Approved — Lara is proceeding"
          : decision.type === "revise"
          ? isNb
            ? "Sendt til Lara for retting"
            : "Sent to Lara for correction"
          : isNb
          ? "Avvist"
          : "Rejected",
      description: `${isNb ? item.action : item.actionEn} · ${item.customer}`,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">
              {isNb ? "Laras arbeidskø" : "Lara's work queue"}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {isNb
                ? `${LARA_AUTONOMY_LABELS[autonomy].nb} modus`
                : `${LARA_AUTONOMY_LABELS[autonomy].en} mode`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
            {openItems.length}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">
                  {isNb ? "Laras autonominivå" : "Lara's autonomy level"}: {isNb ? LARA_AUTONOMY_LABELS[autonomy].nb : LARA_AUTONOMY_LABELS[autonomy].en}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs">{isNb ? "Laras autonominivå" : "Lara's autonomy level"}</DropdownMenuLabel>
              {(Object.keys(LARA_AUTONOMY_LABELS) as LaraAutonomy[]).map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setAutonomy(level)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {isNb ? LARA_AUTONOMY_LABELS[level].nb : LARA_AUTONOMY_LABELS[level].en}
                    {autonomy === level && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isNb ? LARA_AUTONOMY_LABELS[level].hint : LARA_AUTONOMY_LABELS[level].hintEn}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <TooltipProvider delayDuration={100}>
          <ul className="flex flex-col gap-2">
            {rows.map((item) => {
              const Icon = item.state === "blocked" ? AlertTriangle : KIND_ICON[item.kind];
              return (
                <li
                  key={item.id}
                  className="group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:bg-muted/50 hover:border-border"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.state === "blocked" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div className="min-w-0 flex-1 cursor-help">
                        <p className="truncate text-sm font-medium leading-tight">
                          {item.customer}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.state === "blocked"
                            ? isNb
                              ? item.blocker
                              : item.blockerEn
                            : isNb
                            ? item.action
                            : item.actionEn}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-xs">
                      <span className="block font-medium">{isNb ? LARA_KIND_LABELS[item.kind].nb : LARA_KIND_LABELS[item.kind].en}</span>
                      {isNb ? item.rationale : item.rationaleEn}
                      <span className="mt-1 block text-muted-foreground">{isNb ? "Kilde" : "Source"}: {isNb ? item.source : item.sourceEn}</span>
                    </TooltipContent>
                  </UITooltip>

                  {item.risk === "critical" && item.state === "pending" && (
                    <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline ${riskBadgeClass(item.risk)}`}>
                      {isNb ? LARA_RISK_LABELS.critical.nb : LARA_RISK_LABELS.critical.en}
                    </span>
                  )}

                  {item.state === "revising" ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {isNb ? "Lara justerer" : "Lara adjusting"}
                    </span>
                  ) : item.state === "pending" ? (
                    <Button size="sm" className="h-8 shrink-0 px-3 text-xs" onClick={() => setReviewing(item)}>
                      {isNb ? "Gjennomgå" : "Review"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-3 text-xs"
                      onClick={() => navigate("/settings/integrations")}
                    >
                      {isNb ? "Løs" : "Resolve"}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{isNb ? "Flere valg" : "More options"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => navigate("/msp-partner/widget/needs-follow-up")}
                      >
                        {isNb ? "Se utkast" : "View draft"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {item.state === "blocked" ? (
                        <DropdownMenuItem onClick={() => navigate("/settings/integrations")}>
                          {isNb ? "Løs blokkering" : "Resolve blocker"}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setReviewing(item)}>
                          <X className="mr-2 h-3.5 w-3.5" /> {isNb ? "Avvis" : "Reject"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}

            {rows.length === 0 && (
              <li className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                {isNb
                  ? "Køen er tom. Lara varsler deg når det er noe å godkjenne."
                  : "The queue is empty. Lara will notify you when there is something to approve."}
              </li>
            )}
          </ul>
        </TooltipProvider>

        <button
          type="button"
          onClick={() => navigate("/msp-partner/widget/needs-follow-up")}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            {isNb ? `Lara utførte ${autoDoneCount} oppgaver i natt` : `Lara completed ${autoDoneCount} tasks last night`}
          </span>
          <span className="flex items-center gap-0.5 font-medium text-foreground">
            {hiddenCount > 0
              ? isNb
                ? `Se hele køen (${hiddenCount})`
                : `See full queue (${hiddenCount})`
              : isNb
              ? "Se hele køen"
              : "See full queue"}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </CardContent>

      <LaraReviewSheet
        item={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        onDecision={handleDecision}
      />
    </Card>
  );
}
