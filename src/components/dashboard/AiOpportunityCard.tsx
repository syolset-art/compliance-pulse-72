/**
 * «Hvor kan AI avlaste oss?» — inngangen til AI-reisen på Core-oversikten.
 *
 * Kortet leser AI-muligheter Lara allerede har foreslått per prosess
 * (process_agent_recommendations) og viser de tre med størst effekt.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { seedDemoEconomy } from "@/lib/demoSeedEconomy";

interface Opportunity {
  id: string;
  processId: string;
  processName: string;
  workAreaName: string;
  recommendation: "autonomous" | "copilot" | "manual";
  role: string | null;
  rationale: string | null;
  hours: number;
}

function fitLabel(rec: Opportunity["recommendation"], isNb: boolean) {
  if (rec === "autonomous") return isNb ? "Stort potensial" : "High potential";
  if (rec === "copilot") return isNb ? "Kan avlaste delvis" : "Partial relief";
  return isNb ? "Bør gjøres av mennesker" : "Best left to people";
}

export function AiOpportunityCard({ isNb = true }: { isNb?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["core-ai-opportunities"],
    queryFn: async (): Promise<Opportunity[]> => {
      const { data: recs, error } = await supabase
        .from("process_agent_recommendations" as never)
        .select("*")
        .eq("status", "proposed");
      if (error) throw error;

      const rows = (recs ?? []) as unknown as Array<{
        id: string;
        process_id: string;
        recommendation: Opportunity["recommendation"];
        rationale: string | null;
        suggested_agent_role: string | null;
        estimated_hours_saved_per_month: number | null;
      }>;
      if (rows.length === 0) return [];

      // Ingen fremmednøkkel mellom anbefaling og prosess, så vi henter
      // prosessene separat og filtrerer bort anbefalinger uten prosess.
      const { data: processes } = await supabase
        .from("system_processes")
        .select("id, name, systems(work_areas(name))")
        .in("id", rows.map((r) => r.process_id));

      const byId = new Map(
        (processes ?? []).map((p) => [
          p.id,
          {
            name: p.name,
            workArea:
              (p.systems as { work_areas?: { name?: string } } | null)?.work_areas?.name ??
              (isNb ? "Uten arbeidsområde" : "No work area"),
          },
        ])
      );

      return rows
        .filter((r) => byId.has(r.process_id))
        .map((r) => ({
          id: r.id,
          processId: r.process_id,
          processName: byId.get(r.process_id)!.name,
          workAreaName: byId.get(r.process_id)!.workArea,
          recommendation: r.recommendation,
          role: r.suggested_agent_role,
          rationale: r.rationale,
          hours: Number(r.estimated_hours_saved_per_month ?? 0),
        }));
    },
  });

  const top = useMemo(
    () =>
      (data ?? [])
        .filter((o) => o.recommendation !== "manual")
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 3),
    [data]
  );

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedDemoEconomy();
      if (count === 0) {
        toast.info(isNb ? "Demodataene finnes allerede" : "Demo data already exists");
      } else {
        toast.success(
          isNb ? `La inn ${count} prosesser i Økonomi` : `Added ${count} processes in Finance`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["core-ai-opportunities"] });
    } catch (e) {
      toast.error(
        (e as Error).message ||
          (isNb ? "Kunne ikke legge inn demodata" : "Could not add demo data")
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {isNb ? "Hvor kan AI avlaste oss?" : "Where can AI take work off our hands?"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isNb
            ? "Basert på arbeidsområdene og prosessene dere allerede har kartlagt."
            : "Based on the work areas and processes you have already mapped."}
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {!isLoading && top.length === 0 && (
          <div className="rounded-lg border border-dashed p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Ingen AI-muligheter er kartlagt ennå."
                : "No AI opportunities mapped yet."}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleSeed} disabled={seeding}>
              {seeding
                ? isNb
                  ? "Legger inn …"
                  : "Adding …"
                : isNb
                  ? "Last inn demodata (Økonomi)"
                  : "Load demo data (Finance)"}
            </Button>
          </div>
        )}

        {!isLoading &&
          top.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/processes/${o.processId}?tab=ai-setup`)}
              className="w-full text-left rounded-lg border p-3.5 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{o.processName}</span>
                    <Badge variant="outline" className="text-[11px]">
                      {o.workAreaName}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        o.recommendation === "autonomous"
                          ? "border-success/30 bg-success/10 text-success text-[11px]"
                          : "border-primary/30 bg-primary/10 text-primary text-[11px]"
                      }
                    >
                      {fitLabel(o.recommendation, isNb)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {o.role ? `${o.role}. ` : ""}
                    {o.rationale}
                  </p>
                  {o.hours > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {isNb
                        ? `Anslått ${o.hours} timer spart i måneden`
                        : `Estimated ${o.hours} hours saved per month`}
                    </p>
                  )}
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))}

        {!isLoading && top.length > 0 && (
          <p className="pt-1 text-xs text-muted-foreground">
            {isNb
              ? "Forslag fra Lara. Ingenting settes i gang før et menneske har bekreftet."
              : "Suggestions from Lara. Nothing starts until a person confirms."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
