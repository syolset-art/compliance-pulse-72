import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { Sparkles } from "lucide-react";

interface Suggestion {
  id: string;
  process_id: string;
  process_name: string;
  work_area_name: string;
  recommendation: string;
  rationale: string | null;
  suggested_agent_role: string | null;
  hours: number | null;
  status: string;
}

const recLabel = (r: string) =>
  r === "autonomous" ? "Autonom" : r === "copilot" ? "Co-pilot" : "Manuell";

export default function AgentSuggestions() {
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["agent-suggestions-all"],
    queryFn: async (): Promise<Suggestion[]> => {
      const { data: recs, error } = await supabase
        .from("process_agent_recommendations" as any)
        .select("*");
      if (error) throw error;
      const rows = (recs ?? []) as any[];
      if (rows.length === 0) return [];

      const [{ data: procs }, { data: areas }] = await Promise.all([
        supabase.from("system_processes").select("id, name"),
        supabase.from("work_areas").select("id, name"),
      ]);
      const pMap = new Map((procs ?? []).map((p: any) => [p.id, p.name as string]));
      const aMap = new Map((areas ?? []).map((a: any) => [a.id, a.name as string]));

      return rows.map((r) => ({
        id: r.id,
        process_id: r.process_id,
        process_name: pMap.get(r.process_id) ?? "Ukjent prosess",
        work_area_name: aMap.get(r.work_area_id) ?? "—",
        recommendation: r.recommendation,
        rationale: r.rationale,
        suggested_agent_role: r.suggested_agent_role,
        hours: r.estimated_hours_saved_per_month,
        status: r.status,
      }));
    },
  });

  const rows = q.data ?? [];

  return (
    <AgentsPageShell
      title="Forslag"
      description="Agentforslag Lara har utledet fra kartleggingen. Forslag inntil et menneske har bekreftet dem."
    >
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : rows.length === 0 ? (
        <Card className="p-6 text-center space-y-3">
          <Sparkles className="h-5 w-5 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Ingen forslag ennå. Kartlegg arbeidsområder og prosesser først — da kan Lara foreslå
            hvor agenter kan avlaste dere.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate("/agents/mapping")}>
            Gå til kartlegging
          </Button>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prosess</TableHead>
                <TableHead className="hidden sm:table-cell">Arbeidsområde</TableHead>
                <TableHead>Anbefaling</TableHead>
                <TableHead className="hidden md:table-cell">Spart tid / mnd</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[220px]">{r.process_name}</div>
                    {r.rationale && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{r.rationale}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {r.work_area_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">
                      {recLabel(r.recommendation)}
                    </Badge>
                    {r.status === "recruited" && (
                      <Badge className="ml-1 text-[10px] bg-success/15 text-success border-success/30" variant="outline">
                        I gang
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {r.hours ? `${r.hours} t` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/processes/${r.process_id}?tab=haio`)}
                    >
                      Se vurdering
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AgentsPageShell>
  );
}
