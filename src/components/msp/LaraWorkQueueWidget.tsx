import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  type LaraAutonomy,
  type LaraQueueItem,
  type LaraQueueKind,
} from "@/lib/laraWorkQueue";

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

  const rows = useMemo(
    () => items.filter((i) => i.state === "pending" || i.state === "blocked").slice(0, 3),
    [items]
  );
  const pendingCount = useMemo(
    () => items.filter((i) => i.state === "pending").length,
    [items]
  );
  const autoDoneCount = useMemo(
    () => items.filter((i) => i.state === "auto-done").length,
    [items]
  );

  const resolve = (item: LaraQueueItem, approved: boolean) => {
    setItems((prev) =>
      approved
        ? prev.map((i) => (i.id === item.id ? { ...i, state: "auto-done", doneAt: "nå" } : i))
        : prev.filter((i) => i.id !== item.id)
    );
    toast({
      title: approved
        ? isNb
          ? "Godkjent — Lara iverksetter"
          : "Approved — Lara is proceeding"
        : isNb
        ? "Avvist"
        : "Rejected",
      description: `${isNb ? item.action : item.actionEn} · ${item.customer}`,
    });
  };

  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-semibold">{isNb ? "Laras arbeidskø" : "Lara's work queue"}</span>
        <span className="text-sm text-muted-foreground">· {pendingCount} {isNb ? "venter" : "pending"}</span>
        <div className="flex-1" />
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

      <TooltipProvider delayDuration={100}>
        <ul className="divide-y divide-border">
          {rows.map((item) => {
            const Icon = item.state === "blocked" ? AlertTriangle : KIND_ICON[item.kind];
            return (
              <li key={item.id} className="flex items-center gap-2 py-1.5">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.state === "blocked" ? "text-warning" : "text-muted-foreground"
                  }`}
                />
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="min-w-0 flex-1 cursor-help truncate text-sm">
                      <span className="font-medium">{item.customer}</span>
                      <span className="text-muted-foreground">
                        {" — "}
                        {item.state === "blocked"
                          ? isNb
                            ? item.blocker
                            : item.blockerEn
                          : isNb
                          ? item.action
                          : item.actionEn}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    <span className="block font-medium">{isNb ? LARA_KIND_LABELS[item.kind].nb : LARA_KIND_LABELS[item.kind].en}</span>
                    {isNb ? item.rationale : item.rationaleEn}
                    <span className="mt-1 block text-muted-foreground">{isNb ? "Kilde" : "Source"}: {isNb ? item.source : item.sourceEn}</span>
                  </TooltipContent>
                </UITooltip>

                {item.state === "pending" ? (
                  <Button size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => resolve(item, true)}>
                    {isNb ? "Godkjenn" : "Approve"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 px-2 text-xs"
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
                      className="h-7 w-7 shrink-0 text-muted-foreground"
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
                      <DropdownMenuItem onClick={() => resolve(item, false)}>
                        <X className="mr-2 h-3.5 w-3.5" /> {isNb ? "Avvis" : "Reject"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}

          {rows.length === 0 && (
            <li className="py-2 text-xs text-muted-foreground">
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
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Check className="h-3.5 w-3.5 text-success" />
        <span className="truncate">{isNb ? `Lara utførte ${autoDoneCount} oppgaver i natt` : `Lara completed ${autoDoneCount} tasks last night`}</span>
        <span className="ml-auto flex items-center gap-0.5 font-medium">
          {isNb ? "Se hele køen" : "See full queue"}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </Card>
  );
}
