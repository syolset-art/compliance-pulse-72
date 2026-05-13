import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Link2, Server, Cpu, Workflow, Box, Sparkles } from "lucide-react";
import {
  useVendorRelationshipCandidates,
  type RelationshipCandidate,
} from "@/hooks/useVendorRelationshipCandidates";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string | null;
  vendorName: string;
  vendorUrl?: string | null;
  onComplete?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  system: "Systemer",
  device: "Enheter",
  process: "Prosesser",
  self: "Tjenester",
  cloud_service: "Skytjenester",
};

function iconForType(type: string) {
  switch (type) {
    case "system": return Server;
    case "device": return Cpu;
    case "process": return Workflow;
    default: return Box;
  }
}

export function VendorRelationshipDiscoveryDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  vendorUrl,
  onComplete,
}: Props) {
  const queryClient = useQueryClient();
  const { strong, possible, isLoading } = useVendorRelationshipCandidates({
    enabled: open && !!vendorId,
    vendorId,
    vendorName,
    vendorUrl,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Default-select strong matches when results load
  useEffect(() => {
    if (!isLoading) {
      setSelected(new Set(strong.map((c) => c.id)));
    }
  }, [isLoading, strong]);

  const grouped = useMemo(() => {
    const all = [...strong, ...possible];
    const map = new Map<string, RelationshipCandidate[]>();
    all.forEach((c) => {
      const key = c.asset_type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries());
  }, [strong, possible]);

  const total = strong.length + possible.length;

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!vendorId || selected.size === 0) return 0;
      const inserts = Array.from(selected).map((sourceId) => ({
        source_asset_id: sourceId,
        target_asset_id: vendorId,
        relationship_type: "provided_by",
        description: "Auto-foreslått ved leverandør-onboarding",
      }));
      const { error } = await supabase.from("asset_relationships").insert(inserts);
      if (error) throw error;
      return inserts.length;
    },
    onSuccess: (count) => {
      if (count && count > 0) {
        toast.success(`${count} kobling${count > 1 ? "er" : ""} opprettet`);
        queryClient.invalidateQueries({ queryKey: ["asset_relationships"] });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
      }
      onOpenChange(false);
      onComplete?.();
    },
    onError: () => {
      toast.error("Kunne ikke opprette koblinger");
    },
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Mulige interne koblinger</DialogTitle>
              <DialogDescription>
                Mynder fant {total} {total === 1 ? "kandidat" : "kandidater"} som ser ut til å høre sammen med {vendorName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Card variant="flat" className="bg-primary/[0.04] border-primary/15 p-3">
          <div className="flex items-start gap-2">
            <Link2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[13px] text-foreground/80 leading-relaxed">
              Koblinger gjør at systemer og prosesser arver risiko, DPA og sertifiseringer fra leverandøren — og gir deg automatisk varsling når dokumenter går ut.
            </p>
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Søker...
            </div>
          ) : total === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Ingen interne koblinger funnet for {vendorName}.
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([type, items]) => {
                const Icon = iconForType(type);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {TYPE_LABEL[type] || type}
                      </span>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((c) => {
                        const isSelected = selected.has(c.id);
                        return (
                          <label
                            key={c.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              isSelected
                                ? "bg-primary/[0.06] border-primary/30"
                                : "bg-card border-border hover:bg-muted/40"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggle(c.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] h-4 shrink-0",
                                    c.matchKind === "strong"
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "bg-muted text-muted-foreground border-border"
                                  )}
                                >
                                  {c.matchKind === "strong" ? "Sterk match" : "Mulig match"}
                                </Badge>
                              </div>
                              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{c.reason}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-[13px] text-muted-foreground">
            {selected.size} av {total} valgt
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                onComplete?.();
              }}
              disabled={linkMutation.isPending}
              className="rounded-full"
            >
              Hopp over
            </Button>
            <Button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending || selected.size === 0}
              className="rounded-full"
              style={{ backgroundColor: "#5A3184" }}
            >
              {linkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Opprett {selected.size} kobling{selected.size === 1 ? "" : "er"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
