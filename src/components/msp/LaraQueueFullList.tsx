import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LARA_WORK_QUEUE, LARA_KIND_LABELS, type LaraQueueItem } from "@/lib/laraWorkQueue";

type Filter = "pending" | "auto-done" | "rejected";

const FILTERS: { key: Filter; label: string; labelEn: string }[] = [
  { key: "pending", label: "Venter", labelEn: "Pending" },
  { key: "auto-done", label: "Gjort", labelEn: "Done" },
  { key: "rejected", label: "Avvist", labelEn: "Rejected" },
];

export function LaraQueueFullList() {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [items, setItems] = useState<LaraQueueItem[]>(LARA_WORK_QUEUE);
  const [rejected, setRejected] = useState<LaraQueueItem[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");

  const visible = useMemo(() => {
    if (filter === "rejected") return rejected;
    if (filter === "auto-done") return items.filter((i) => i.state === "auto-done");
    return items.filter((i) => i.state === "pending" || i.state === "blocked");
  }, [filter, items, rejected]);

  const resolve = (item: LaraQueueItem, approved: boolean) => {
    if (approved) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, state: "auto-done", doneAt: "nå" } : i))
      );
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setRejected((prev) => [{ ...item, state: "pending" }, ...prev]);
    }
    toast({
      title: approved
        ? isNb
          ? "Godkjent — Lara utfører"
          : "Approved — Lara is proceeding"
        : isNb
        ? "Avvist"
        : "Rejected",
      description: `${isNb ? item.action : item.actionEn} · ${item.customer}`,
    });
  };

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="mr-2 text-sm font-medium">{isNb ? "Laras arbeidskø" : "Lara's work queue"}</span>
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => setFilter(f.key)}
          >
            {isNb ? f.label : f.labelEn}
          </Button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {visible.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{isNb ? "Ingen elementer i dette filteret." : "No items in this filter."}</p>
        )}
        {visible.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-foreground">{item.customer}</span>
                <Badge variant="outline" className="text-[10px]">
                  {isNb ? LARA_KIND_LABELS[item.kind].nb : LARA_KIND_LABELS[item.kind].en}
                </Badge>
                {item.state === "blocked" && (
                  <Badge variant="outline" className="gap-1 border-warning/50 text-[10px] text-warning">
                    <AlertTriangle className="h-3 w-3" /> {isNb ? "Blokkert" : "Blocked"}
                  </Badge>
                )}
                {item.state === "auto-done" && (
                  <Badge variant="outline" className="gap-1 border-success/50 text-[10px] text-success">
                    <Check className="h-3 w-3" />{" "}
                    {isNb ? "Utført" : "Done"}
                    {isNb ? (item.doneAt ? ` ${item.doneAt}` : "") : item.doneAtEn ? ` ${item.doneAtEn}` : ""}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-foreground/90">{isNb ? item.action : item.actionEn}</div>
              <div className="text-xs text-muted-foreground">
                {isNb
                  ? item.state === "blocked"
                    ? item.blocker
                    : item.rationale
                  : item.state === "blocked"
                  ? item.blockerEn
                  : item.rationaleEn}{" "}
                · {isNb ? "Kilde" : "Source"}: {isNb ? item.source : item.sourceEn}
              </div>
            </div>

            {filter === "pending" && item.state === "pending" && (
              <div className="flex flex-col gap-1.5 sm:flex-row">
                <Button size="sm" onClick={() => setConfirming(item)}>
                  <Check className="mr-1 h-3.5 w-3.5" /> {isNb ? "Godkjenn" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => resolve(item, false)}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> {isNb ? "Avvis" : "Reject"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
