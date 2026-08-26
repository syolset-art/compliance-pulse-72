import { useEffect, useState } from "react";
import { Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PRIORITY_KEYS,
  PRIORITY_META,
  getPriorityMeta,
  isPriorityDeviation,
  priorityLabel,
  suggestPriority,
  suggestionRationale,
  type PriorityKey,
} from "@/lib/derivedPriority";
import { PriorityHistoryDrawer } from "./PriorityHistoryDrawer";

interface PriorityEditorPopoverProps {
  assetId: string;
  currentPriority: string | null;
  currentReason: string | null;
  currentSource: "lara" | "manual" | null;
  currentSuggested: string | null;
  criticality: string | null;
  riskGrade?: "low" | "medium" | "high" | null;
  onSaved?: () => void;
  trigger: React.ReactNode;
  /** Overstyrte visningsnavn per nivå (brukes av leverandørmodulen). */
  labelOverrides?: Partial<Record<PriorityKey, string>>;
  /** Nivåer markert som «Ikke aktuelt» — skjules i velgeren. */
  hiddenLevels?: PriorityKey[];
}

export function PriorityEditorPopover({
  assetId,
  currentPriority,
  currentReason,
  currentSource,
  currentSuggested,
  criticality,
  riskGrade,
  onSaved,
  trigger,
  labelOverrides,
  hiddenLevels,
}: PriorityEditorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const suggested = (currentSuggested as PriorityKey | null) ?? suggestPriority(criticality, riskGrade);
  const initial = (currentPriority as PriorityKey | null) ?? suggested;

  const [selected, setSelected] = useState<PriorityKey>(initial);
  const [reason, setReason] = useState<string>(currentReason ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(initial);
      setReason(currentReason ?? "");
    }
  }, [open, initial, currentReason]);

  const isOverride = selected !== suggested;
  const showReason = isOverride;

  const save = async () => {
    setSaving(true);
    try {
      const source = selected === suggested ? "lara" : "manual";
      const { data: userResp } = await supabase.auth.getUser();
      const who = userResp?.user?.email ?? userResp?.user?.id ?? "system";

      const { error } = await supabase
        .from("assets")
        .update({
          priority: selected,
          priority_source: source,
          priority_suggested: suggested,
          priority_reason: showReason ? (reason.trim() || null) : null,
          priority_updated_at: new Date().toISOString(),
          priority_updated_by: who,
        } as never)
        .eq("id", assetId);

      if (error) throw error;

      await supabase.from("asset_priority_history").insert({
        asset_id: assetId,
        from_priority: currentPriority,
        to_priority: selected,
        suggested_priority: suggested,
        source,
        reason: showReason ? (reason.trim() || null) : null,
        changed_by: who,
      } as never);

      toast.success("Prioritet oppdatert");
      onSaved?.();
      setOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Kunne ikke lagre";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[340px] p-4 space-y-3" align="end">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Prioritet</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="h-3.5 w-3.5" />
                Historikk
              </Button>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Lara foreslår <span className="font-medium text-foreground">{priorityLabel(suggested)}</span>{" "}
                — {suggestionRationale(criticality, riskGrade)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PRIORITY_KEYS.filter((p) => !hiddenLevels?.includes(p)).map((p) => {
              const meta = PRIORITY_META[p];
              const displayLabel = labelOverrides?.[p] ? `${p} – ${labelOverrides[p]}` : meta.labelNb;
              const isSel = selected === p;
              const isSuggested = p === suggested;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs text-left transition",
                    isSel
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} aria-hidden />
                  <span className="font-medium">{displayLabel}</span>
                  {isSuggested && (
                    <Sparkles className="ml-auto h-3 w-3 text-primary opacity-70" aria-label="Laras forslag" />
                  )}
                </button>
              );
            })}
          </div>

          {showReason && (
            <div className="space-y-1.5 rounded-md bg-muted/40 p-2.5">
              <Label className="text-xs">
                Begrunnelse for overstyring{" "}
                <span className="text-muted-foreground font-normal">(valgfritt, men anbefalt)</span>
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="F.eks. kompenserende kontroller, system under utfasing, klinisk kontekst"
                rows={3}
                className="text-xs resize-none bg-background"
              />
              {isPriorityDeviation(selected, suggested) && (
                <p className="text-[12px] text-warning">
                  Stort avvik fra Laras forslag — vises som markør i listen.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Lagrer…" : "Lagre"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <PriorityHistoryDrawer
        assetId={assetId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
