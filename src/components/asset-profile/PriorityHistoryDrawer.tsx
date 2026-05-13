import { useEffect, useState } from "react";
import { Sparkles, User, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { priorityLabel, getPriorityMeta } from "@/lib/derivedPriority";
import { cn } from "@/lib/utils";

interface HistoryRow {
  id: string;
  from_priority: string | null;
  to_priority: string;
  suggested_priority: string | null;
  source: string;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

interface PriorityHistoryDrawerProps {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriorityHistoryDrawer({ assetId, open, onOpenChange }: PriorityHistoryDrawerProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("asset_priority_history" as never)
        .select("*")
        .eq("asset_id", assetId)
        .order("changed_at", { ascending: false });
      if (!error) setRows((data as unknown as HistoryRow[]) ?? []);
      setLoading(false);
    })();
  }, [open, assetId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Prioritetshistorikk</SheetTitle>
          <SheetDescription>
            Alle endringer av prioritet på dette systemet, med begrunnelse og hvem som endret.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Laster…</p>}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Ingen endringer registrert ennå.</p>
          )}
          {rows.map((r) => {
            const fromMeta = getPriorityMeta(r.from_priority);
            const toMeta = getPriorityMeta(r.to_priority);
            const Icon = r.source === "manual" ? User : Sparkles;
            return (
              <div key={r.id} className="rounded-md border border-border p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {r.source === "manual" ? "Manuell overstyring" : "Satt av Lara"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.changed_at).toLocaleString("nb-NO")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {fromMeta ? (
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", fromMeta.pillClass)}>
                      {fromMeta.labelNb}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ikke satt</span>
                  )}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  {toMeta && (
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", toMeta.pillClass)}>
                      {toMeta.labelNb}
                    </span>
                  )}
                </div>
                {r.suggested_priority && r.suggested_priority !== r.to_priority && (
                  <div className="text-xs text-muted-foreground">
                    Forslag var <span className="font-medium text-foreground">{priorityLabel(r.suggested_priority)}</span>
                  </div>
                )}
                {r.reason && (
                  <div className="rounded-md bg-muted/40 p-2 text-xs">
                    <span className="text-muted-foreground">Begrunnelse:</span> {r.reason}
                  </div>
                )}
                {r.changed_by && (
                  <div className="text-xs text-muted-foreground">av {r.changed_by}</div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
