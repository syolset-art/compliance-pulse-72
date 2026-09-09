import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, ChevronRight } from "lucide-react";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { useSubscription } from "@/hooks/useSubscription";

interface AreaRow {
  id: string;
  name: string;
  description: string | null;
}

interface ProcRow {
  id: string;
  name: string;
  areaId: string | null;
}

export default function AgentsMapping() {
  const qc = useQueryClient();
  const { hasCoreAccess } = useSubscription();
  const [newArea, setNewArea] = useState("");
  const [newProcess, setNewProcess] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const areasQ = useQuery({
    queryKey: ["agents-mapping-areas"],
    queryFn: async (): Promise<AreaRow[]> => {
      const { data, error } = await supabase
        .from("work_areas")
        .select("id, name, description")
        .order("name");
      if (error) throw error;
      return (data ?? []) as AreaRow[];
    },
  });

  const procsQ = useQuery({
    queryKey: ["agents-mapping-processes"],
    queryFn: async (): Promise<ProcRow[]> => {
      const { data: systems } = await supabase.from("systems").select("id, work_area_id");
      const sysMap = new Map((systems ?? []).map((s: any) => [s.id, s.work_area_id as string | null]));
      const { data, error } = await supabase
        .from("system_processes")
        .select("id, name, system_id, work_area_id")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        areaId: p.work_area_id ?? (p.system_id ? sysMap.get(p.system_id) ?? null : null),
      }));
    },
  });

  const byArea = useMemo(() => {
    const map = new Map<string, ProcRow[]>();
    (procsQ.data ?? []).forEach((p) => {
      if (!p.areaId) return;
      map.set(p.areaId, [...(map.get(p.areaId) ?? []), p]);
    });
    return map;
  }, [procsQ.data]);

  const addArea = async () => {
    const name = newArea.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase.from("work_areas").insert({ name });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewArea("");
    toast.success("Arbeidsområde lagt til");
    qc.invalidateQueries({ queryKey: ["agents-mapping-areas"] });
  };

  const addProcess = async (areaId: string) => {
    const name = (newProcess[areaId] ?? "").trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase
      .from("system_processes")
      .insert({ name, work_area_id: areaId, status: "active" } as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewProcess((s) => ({ ...s, [areaId]: "" }));
    toast.success("Prosess lagt til");
    qc.invalidateQueries({ queryKey: ["agents-mapping-processes"] });
  };

  return (
    <AgentsPageShell
      title="Kartlegging"
      description="Først arbeidsområder — hvilke deler av virksomheten jobber dere i. Deretter oppgavene som gjøres i hvert område."
    >
      <Card className="p-4 bg-muted/40 border-dashed">
        <p className="text-sm text-muted-foreground">
          Kartleggingen du gjør her brukes også hvis du senere tar i bruk Core. Da kommer personvern
          (RoPA), NIS2, risiko og kritikalitet som et lag på toppen — uten å gjøre jobben på nytt.
          {hasCoreAccess && (
            <>
              {" "}
              Du har Core, så dette er de samme dataene du ser under{" "}
              <Link to="/work-areas" className="text-primary hover:underline">
                Arbeidsområder
              </Link>
              .
            </>
          )}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Input
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addArea()}
          placeholder="Nytt arbeidsområde, f.eks. Økonomi"
          className="max-w-xs"
        />
        <Button size="sm" onClick={addArea} disabled={saving || !newArea.trim()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Legg til område
        </Button>
      </div>

      {areasQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : (areasQ.data ?? []).length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Ingen arbeidsområder ennå. Legg til det første over.
        </Card>
      ) : (
        <div className="space-y-3">
          {(areasQ.data ?? []).map((area) => {
            const procs = byArea.get(area.id) ?? [];
            return (
              <Card key={area.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{area.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {procs.length} prosesser
                    </Badge>
                  </div>
                </div>

                {procs.length > 0 && (
                  <ul className="space-y-1">
                    {procs.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/processes/${p.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                        >
                          <span className="truncate">{p.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap gap-2">
                  <Input
                    value={newProcess[area.id] ?? ""}
                    onChange={(e) => setNewProcess((s) => ({ ...s, [area.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addProcess(area.id)}
                    placeholder="Hvilken oppgave gjøres her?"
                    className="max-w-xs h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addProcess(area.id)}
                    disabled={saving || !(newProcess[area.id] ?? "").trim()}
                  >
                    Legg til prosess
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AgentsPageShell>
  );
}
