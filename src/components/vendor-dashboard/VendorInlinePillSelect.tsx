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
  /** Liten farge brukt KUN på ikonet — ingen bakgrunnsfyll */
  iconColor: string;
  Icon: LucideIcon;
}

const OPTIONS: Record<Field, Option[]> = {
  // Kritikalitet = objektiv intensitet → signal-bars-metafor
  criticality: [
    { value: "high",   label: "Høy",     iconColor: "text-destructive",  Icon: ChevronsUp },
    { value: "medium", label: "Middels", iconColor: "text-warning",      Icon: ChevronUp },
    { value: "low",    label: "Lav",     iconColor: "text-muted-foreground", Icon: Minus },
  ],
  // Prioritet = subjektivt fokus → flagg-metafor, alle samme nøytrale farge
  priority: [
    { value: "critical", label: "Kritisk", iconColor: "text-foreground",        Icon: Flag },
    { value: "high",     label: "Høy",     iconColor: "text-foreground/80",     Icon: Flag },
    { value: "medium",   label: "Medium",  iconColor: "text-muted-foreground",  Icon: Flag },
    { value: "low",      label: "Lav",     iconColor: "text-muted-foreground/70", Icon: ChevronDown },
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stop}>
        {current ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
            title={`${LABELS[field].title}: ${current.label}`}
          >
            <current.Icon className={cn("h-3.5 w-3.5", current.iconColor)} strokeWidth={2.25} />
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
            <o.Icon className={cn("h-3.5 w-3.5", o.iconColor)} strokeWidth={2.25} />
            <span className="flex-1">{o.label}</span>
            {current?.value === o.value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
