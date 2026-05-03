import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Plus, Flag, ChevronsUp, ChevronUp, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";

type Field = "criticality" | "priority";

interface Option {
  value: string;
  label: string;
  /** Liten farge brukt KUN på ikonet/badgen — ingen bakgrunnsfyll på pillen */
  iconColor: string;
  Icon?: LucideIcon;
  /** Bokstav-notasjon (A/B/C/D) for prioritet — vises i en liten ring i stedet for ikon */
  letter?: string;
}

const OPTIONS: Record<Field, Option[]> = {
  // Kritikalitet = objektiv intensitet → signal-bars-metafor
  criticality: [
    { value: "high",   label: "Høy",     iconColor: "text-destructive",  Icon: ChevronsUp },
    { value: "medium", label: "Middels", iconColor: "text-warning",      Icon: ChevronUp },
    { value: "low",    label: "Lav",     iconColor: "text-muted-foreground", Icon: Minus },
  ],
  // Prioritet = subjektivt fokus → A/B/C/D-notasjon (vanlig i store selskap)
  priority: [
    { value: "critical", label: "A — Kritisk", letter: "A", iconColor: "text-foreground border-foreground/60" },
    { value: "high",     label: "B — Høy",     letter: "B", iconColor: "text-foreground/85 border-foreground/40" },
    { value: "medium",   label: "C — Medium",  letter: "C", iconColor: "text-muted-foreground border-muted-foreground/40" },
    { value: "low",      label: "D — Lav",     letter: "D", iconColor: "text-muted-foreground/70 border-muted-foreground/30" },
  ],
};

const LABELS: Record<Field, { title: string; placeholder: string }> = {
  criticality: { title: "Kritikalitet", placeholder: "Sett kritikalitet" },
  priority:    { title: "Prioritet",    placeholder: "Sett prioritet" },
};

interface Props {
  assetId: string;
  field: Field;
  value?: string | null;
}

export function VendorInlinePillSelect({ assetId, field, value }: Props) {
  const qc = useQueryClient();
  const opts = OPTIONS[field];
  const current = opts.find(o => o.value === (value || "").toLowerCase()) ||
    (field === "criticality" && value === "critical" ? opts[0] : null);

  const mutate = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.from("assets")
        .update({ [field]: next } as any).eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-assets"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Oppdatert");
    },
    onError: () => toast.error("Kunne ikke oppdatere"),
  });

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const renderGlyph = (o: Option, size: "sm" | "md" = "md") => {
    if (o.letter) {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full border font-semibold tabular-nums",
            size === "sm" ? "h-4 w-4 text-[9px]" : "h-[18px] w-[18px] text-[10px]",
            o.iconColor
          )}
          aria-hidden
        >
          {o.letter}
        </span>
      );
    }
    if (o.Icon) {
      return <o.Icon className={cn("h-3.5 w-3.5", o.iconColor)} strokeWidth={2.25} />;
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stop}>
        {current ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
            title={`${LABELS[field].title}: ${current.label}`}
          >
            {renderGlyph(current)}
            <span className="text-muted-foreground/80 text-[11px]">{LABELS[field].title}</span>
            <span className="font-medium">{current.label}</span>
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            {LABELS[field].placeholder}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={stop} className="w-44">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {LABELS[field].title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opts.map(o => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => mutate.mutate(o.value)}
            className="flex items-center gap-2 text-[13px]"
          >
            {renderGlyph(o, "sm")}
            <span className="flex-1">{o.label}</span>
            {current?.value === o.value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
