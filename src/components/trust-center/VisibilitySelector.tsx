import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ALL_VISIBILITY_LEVELS,
  VISIBILITY_META,
  type TrustVisibility,
} from "@/lib/trustVisibility";

interface Props {
  assetId: string;
  current: TrustVisibility;
  onChange?: (v: TrustVisibility) => void;
  /** Compact pill button (default true). */
  compact?: boolean;
}

export default function VisibilitySelector({ assetId, current, onChange, compact = true }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<TrustVisibility | null>(null);
  const queryClient = useQueryClient();

  const meta = VISIBILITY_META[current];
  const Icon = meta.icon;

  const handleSelect = async (level: TrustVisibility) => {
    if (level === current) {
      setOpen(false);
      return;
    }
    setSaving(level);
    try {
      const { error } = await supabase
        .from("assets")
        .update({
          publish_mode: level,
          metadata: { visibility_confirmed_at: new Date().toISOString() } as any,
        })
        .eq("id", assetId);
      if (error) throw error;
      toast.success(`Synlighet endret til ${VISIBILITY_META[level].labelNb}`);
      onChange?.(level);
      await queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Kunne ikke endre synlighet");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="rounded-full gap-2 border-[hsl(var(--mynder-blue))]/30 text-[hsl(var(--mynder-blue))] hover:bg-[hsl(var(--mynder-blue))]/5 hover:text-[hsl(var(--mynder-blue))]"
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="font-medium">{meta.shortNb}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold">Synlighet for Trust Profile</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Velg hvem som kan se profilen din.</p>
        </div>
        <div className="space-y-1 mt-1">
          {ALL_VISIBILITY_LEVELS.map((level) => {
            const m = VISIBILITY_META[level];
            const I = m.icon;
            const selected = level === current;
            const isSaving = saving === level;
            return (
              <button
                key={level}
                type="button"
                disabled={!!saving}
                onClick={() => handleSelect(level)}
                className={`w-full text-left rounded-lg px-2 py-2 transition-colors flex items-start gap-2 ${
                  selected ? "bg-[hsl(var(--mynder-blue))]/10" : "hover:bg-muted"
                } disabled:opacity-50`}
              >
                <I className={`h-4 w-4 mt-0.5 ${selected ? "text-[hsl(var(--mynder-blue))]" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{m.labelNb}</span>
                    {level === "ecosystem" && (
                      <span className="text-[10px] text-[hsl(var(--mynder-blue))]">· Anbefalt</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{m.descNb}</p>
                </div>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--mynder-blue))]" />
                ) : selected ? (
                  <Check className="h-4 w-4 text-[hsl(var(--mynder-blue))]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
