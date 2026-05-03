import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Plus, Flag } from "lucide-react";
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

type Field = "criticality" | "priority";

const OPTIONS: Record<Field, { value: string; label: string; dot: string; pill: string }[]> = {
  criticality: [
    { value: "high",   label: "Høy",     dot: "bg-destructive", pill: "bg-destructive/10 text-destructive border-destructive/20" },
    { value: "medium", label: "Middels", dot: "bg-warning",     pill: "bg-warning/10 text-warning border-warning/20" },
    { value: "low",    label: "Lav",     dot: "bg-success",     pill: "bg-success/10 text-success border-success/20" },
  ],
  // Prioritet bruker en nøytral amber-flagg-stil for å skille seg fra kritikalitetens risiko-farger
  priority: [
    { value: "critical", label: "Kritisk", dot: "bg-amber-600", pill: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
    { value: "high",     label: "Høy",     dot: "bg-amber-500", pill: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
    { value: "medium",   label: "Medium",  dot: "bg-amber-400", pill: "bg-amber-50/70 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300/90 dark:border-amber-900/70" },
    { value: "low",      label: "Lav",     dot: "bg-amber-300", pill: "bg-amber-50/50 text-amber-700/90 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-300/80 dark:border-amber-900/60" },
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
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-medium transition-colors hover:opacity-80",
              current.pill
            )}
          >
            {field === "priority" ? (
              <Flag className="h-3 w-3" />
            ) : (
              <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
            )}
            <span className="text-[10px] uppercase tracking-wider opacity-70">{LABELS[field].title}:</span>
            {current.label}
          </button>
        ) : (
          <button
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[12px] transition-colors",
              field === "priority"
                ? "border-border/50 text-muted-foreground/70 hover:border-border hover:text-foreground hover:bg-muted/30"
                : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
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
            <span className={cn("h-2 w-2 rounded-full", o.dot)} />
            <span className="flex-1">{o.label}</span>
            {current?.value === o.value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
