import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AssignVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workAreaId: string;
  workAreaName: string;
}

export function AssignVendorDialog({ open, onOpenChange, workAreaId, workAreaName }: AssignVendorDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendor-assets-for-assign", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, description, work_area_id")
        .eq("asset_type", "vendor")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const available = vendors.filter((v) => v.work_area_id !== workAreaId);
  const filtered = available.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      for (const id of selected) {
        const { error } = await supabase
          .from("assets")
          .update({ work_area_id: workAreaId })
          .eq("id", id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["work-area-assets-owned"] });
      queryClient.invalidateQueries({ queryKey: ["work-area-assets-used"] });
      queryClient.invalidateQueries({ queryKey: ["all-work-area-assets-risk"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-assets-for-assign"] });
      toast.success(`${selected.length} leverandør${selected.length > 1 ? "er" : ""} tilordnet ${workAreaName}`);
      setSelected([]);
      setSearch("");
      onOpenChange(false);
    } catch {
      toast.error("Kunne ikke tilordne leverandører");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setSelected([]);
      setSearch("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tilordne leverandører
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              0 leverandører i porteføljen
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                handleClose(false);
                navigate("/vendors");
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Gå til leverandører
            </Button>
          </div>
        ) : available.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Alle leverandører er allerede tilordnet dette arbeidsområdet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk leverandører..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">
                  Ingen treff
                </p>
              ) : (
                filtered.map((v) => (
                  <label
                    key={v.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(v.id)}
                      onCheckedChange={() => toggle(v.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      {v.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.length} valgt av {available.length} tilgjengelige
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Avbryt
          </Button>
          {available.length > 0 && (
            <Button size="sm" onClick={handleAssign} disabled={selected.length === 0 || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Tilordne ({selected.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
