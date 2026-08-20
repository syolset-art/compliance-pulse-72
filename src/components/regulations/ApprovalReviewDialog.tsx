import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Clock, X, FileText, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { PLATFORM_USERS } from "@/lib/platformUsers";
import type { ApprovalDecision, ApprovalItem } from "@/lib/regulationsApprovalQueue";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ApprovalItem[];
  decisions: Record<string, ApprovalDecision>;
  saraInstalled: boolean;
  onDecide: (item: ApprovalItem, decision: ApprovalDecision, approverId?: string) => void;
  onOpenRequirement: (item: ApprovalItem) => void;
}

const DEFAULT_APPROVER =
  PLATFORM_USERS.find((u) => u.role === "compliance_officer")?.id ??
  PLATFORM_USERS.find((u) => u.role === "dpo")?.id ??
  PLATFORM_USERS[0]?.id;

/**
 * Godkjenningsliste: ett funn av gangen — godkjenn nå, godkjenn senere
 * (oppgave til ansvarlig) eller avvis. Når Sara er installert vises funnene
 * hennes som aktivitetslogg med dokument-ID, hash og agentversjon.
 */
export function ApprovalReviewDialog({
  open,
  onOpenChange,
  items,
  decisions,
  saraInstalled,
  onDecide,
  onOpenRequirement,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [approver, setApprover] = useState<string>(DEFAULT_APPROVER ?? "");
  const [tab, setTab] = useState<"open" | "deferred" | "done">("open");

  const grouped = useMemo(() => {
    const open: ApprovalItem[] = [];
    const deferred: ApprovalItem[] = [];
    const done: ApprovalItem[] = [];
    items.forEach((i) => {
      const d = decisions[i.key];
      if (!d) open.push(i);
      else if (d === "deferred") deferred.push(i);
      else done.push(i);
    });
    return { open, deferred, done };
  }, [items, decisions]);

  const visible = tab === "open" ? grouped.open : tab === "deferred" ? grouped.deferred : grouped.done;

  const tabs: { id: typeof tab; labelNb: string; labelEn: string; count: number }[] = [
    { id: "open", labelNb: "Til godkjenning", labelEn: "To approve", count: grouped.open.length },
    { id: "deferred", labelNb: "Godkjennes senere", labelEn: "Approve later", count: grouped.deferred.length },
    { id: "done", labelNb: "Behandlet", labelEn: "Handled", count: grouped.done.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isNb ? "Godkjenn dokumentasjon" : "Approve documentation"}</DialogTitle>
          <DialogDescription>
            {saraInstalled
              ? isNb
                ? "Dette har agentene hentet inn siden sist. Sara jobber lokalt hos dere — bare bekreftelsen på at dokumentet finnes sendes til Mynder."
                : "This is what the agents have collected since last time. Sara runs locally — only the confirmation that the document exists is sent to Mynder."
              : isNb
                ? "Lara har foreslått dokumentasjon og status. Du bestemmer hva som godkjennes."
                : "Lara has suggested documentation and status. You decide what is approved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              className="h-7 gap-1.5 text-xs"
              onClick={() => setTab(t.id)}
            >
              {isNb ? t.labelNb : t.labelEn}
              <span className="opacity-70">{t.count}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>{isNb ? "Ansvarlig for godkjenning" : "Responsible for approval"}</span>
          <Select value={approver} onValueChange={setApprover}>
            <SelectTrigger className="h-7 w-[13rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_USERS.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  {u.name} · {isNb ? u.roleLabelNb : u.roleLabelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>{isNb ? "får oppgaven ved «Godkjenn senere»." : "gets the task on “Approve later”."}</span>
        </div>

        <ScrollArea className="-mx-1 flex-1 px-1">
          <div className="space-y-2 py-1">
            {visible.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {isNb ? "Ingenting her nå." : "Nothing here right now."}
              </p>
            )}

            {visible.map((item) => {
              const decision = decisions[item.key];
              const isSara = item.source === "sara";
              return (
                <div key={item.key} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-2.5">
                    <TooltipProvider>
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <span className="mt-0.5 cursor-help">
                            {isSara ? <SaraIcon className="h-5 w-5" /> : <LaraIcon className="h-5 w-5" />}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          {isSara
                            ? isNb
                              ? "Hentet av Sara — den lokale agenten i deres egen infrastruktur."
                              : "Collected by Sara — the local agent in your own infrastructure."
                            : isNb
                              ? "Foreslått av Lara basert på data i plattformen."
                              : "Suggested by Lara based on data in the platform."}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.requirementName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.frameworkName} · {item.requirementId} · {item.docLabel}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.sourceDetail}</span>
                        <span className="shrink-0">· {item.at}</span>
                      </p>
                      {isSara && (
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {item.documentId} · {item.hash} · agent {item.agentVersion}
                        </p>
                      )}
                      {decision && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-2 text-[11px]",
                            decision === "approved" && "border-success/40 text-success",
                            decision === "deferred" && "border-warning/40 text-warning",
                            decision === "rejected" && "border-destructive/40 text-destructive",
                          )}
                        >
                          {decision === "approved"
                            ? isNb
                              ? "Godkjent"
                              : "Approved"
                            : decision === "deferred"
                              ? isNb
                                ? "Venter på godkjenning"
                                : "Pending approval"
                              : isNb
                                ? "Avvist — vises som gap"
                                : "Rejected — shown as gap"}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => onOpenRequirement(item)}
                      aria-label={isNb ? "Åpne kravet" : "Open requirement"}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {decision ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => onDecide(item, "approved", approver)}
                      >
                        {isNb ? "Endre beslutning" : "Change decision"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => onDecide(item, "approved", approver)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isNb ? "Godkjenn" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => onDecide(item, "deferred", approver)}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {isNb ? "Godkjenn senere" : "Approve later"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1.5 text-xs text-muted-foreground"
                          onClick={() => onDecide(item, "rejected", approver)}
                        >
                          <X className="h-3.5 w-3.5" />
                          {isNb ? "Avvis" : "Reject"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
