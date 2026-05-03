import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Plus, ChevronsUp, ChevronUp, Minus, ChevronDown } from "lucide-react";
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
  // Kritikalitet = objektiv intensitet, fire nivåer
  criticality: [
    { value: "critical", label: "Kritisk", iconColor: "text-destructive",     Icon: ChevronsUp },
    { value: "high",     label: "Høy",     iconColor: "text-destructive/80",  Icon: ChevronUp },
    { value: "medium",   label: "Middels", iconColor: "text-warning",         Icon: Minus },
    { value: "low",      label: "Lav",     iconColor: "text-muted-foreground", Icon: ChevronDown },
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
            size === "sm" ? "h-5 w-5 text-[11px]" : "h-5 w-5 text-[11px]",
            o.iconColor
          )}
          aria-hidden
        >
          {o.letter}
        </span>
      );
    }
    if (o.Icon) {
      return <o.Icon className={cn("h-4 w-4", o.iconColor)} strokeWidth={2.25} aria-hidden />;
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stop}>
        {current ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground hover:bg-muted/60 transition-colors"
            aria-label={`${LABELS[field].title}: ${current.label}. Klikk for å endre.`}
          >
            {renderGlyph(current)}
            <span className="text-muted-foreground">{LABELS[field].title}</span>
            <span className="font-medium">{current.label}</span>
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
            aria-label={LABELS[field].placeholder}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {LABELS[field].placeholder}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={stop} className="w-48">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          {LABELS[field].title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opts.map(o => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => mutate.mutate(o.value)}
            className="flex items-center gap-2 text-sm"
          >
            {renderGlyph(o, "sm")}
            <span className="flex-1">{o.label}</span>
            {current?.value === o.value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
