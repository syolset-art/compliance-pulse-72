/**
 * «KI-muligheter» — prioriteringsbildet for et arbeidsområde.
 *
 * Bygger utelukkende på eksisterende kartlegging: system_processes,
 * process_ai_usage og process_agent_recommendations. Ingen ny kartlegging.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Loader2, ArrowRight, Info } from "lucide-react";
import {
  useProcessAgentRecommendations,
  type ProcessAgentRec,
} from "@/hooks/useProcessAgentRecommendations";
import {
  computeSuitability,
  isHighRisk,
  recommendationLabel,
} from "@/lib/aiSuitability";

interface Props {
  workAreaId: string;
  workAreaName?: string;
}

export function AiOpportunitiesTab({ workAreaId, workAreaName }: Props) {
  const navigate = useNavigate();
  const { data: recs = [], isLoading: recsLoading, generate } =
    useProcessAgentRecommendations(workAreaId);

  // Prosessene i arbeidsområdet (via systemene som hører til området).
  const { data: processes = [], isLoading: procLoading } = useQuery({
    queryKey: ["wa-ai-processes", workAreaId],
    queryFn: async () => {
      const { data: systems } = await supabase
        .from("systems")
        .select("id")
        .eq("work_area_id", workAreaId);
      const ids = (systems ?? []).map((s) => s.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("system_processes")
        .select("id, name")
        .in("system_id", ids);
      return data ?? [];
    },
    enabled: !!workAreaId,
  });

  const { data: aiUsage = [] } = useQuery({
    queryKey: ["wa-ai-usage", workAreaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("process_ai_usage")
        .select("process_id, has_ai, risk_category")
        .eq("work_area_id", workAreaId);
      return data ?? [];
    },
    enabled: !!workAreaId,
  });

  const usageByProcess = useMemo(
    () => new Map(aiUsage.map((u) => [u.process_id, u])),
    [aiUsage]
  );

  const rows = useMemo(() => {
    return recs
      .map((rec: ProcessAgentRec) => {
        const process = processes.find((p) => p.id === rec.process_id);
        if (!process) return null;
        const usage = usageByProcess.get(rec.process_id);
        const hasPersonalData = !!usage?.has_ai;
        const suitability = computeSuitability({
          recommendation: rec.recommendation,
          hoursSavedPerMonth: rec.estimated_hours_saved_per_month,
          hasPersonalData,
          riskCategory: usage?.risk_category ?? null,
        });
        return {
          rec,
          processName: process.name,
          hasPersonalData,
          highRisk: isHighRisk(usage?.risk_category),
          suitability,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.suitability.score - a!.suitability.score) as Array<{
      rec: ProcessAgentRec;
      processName: string;
      hasPersonalData: boolean;
      highRisk: boolean;
      suitability: ReturnType<typeof computeSuitability>;
    }>;
  }, [recs, processes, usageByProcess]);

  const funnel = useMemo(() => {
    const mapped = processes.length;
    const opportunities = recs.filter(
      (r) => r.recommendation === "autonomous" || r.recommendation === "copilot"
    ).length;
    const recommended = recs.filter((r) => r.recommendation === "autonomous").length;
    const started = recs.filter((r) => r.status === "recruited").length;
    return { mapped, opportunities, recommended, started };
  }, [processes, recs]);

  if (recsLoading || procLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold">
            Hvor kan KI-agenter avlaste {workAreaName ?? "dette arbeidsområdet"}?
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Lara går gjennom prosessene dere allerede har kartlagt og foreslår hvor en KI-agent
            kan ta over arbeid. Ingenting settes i gang uten at et menneske bekrefter det.
          </p>
          <Button
            className="mt-4"
            disabled={generate.isPending}
            onClick={() => generate.mutate({})}
          >
            {generate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Finn KI-muligheter
          </Button>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { value: funnel.mapped, label: "prosesser kartlagt" },
    { value: funnel.opportunities, label: "KI-muligheter" },
    { value: funnel.recommended, label: "anbefalt å teste" },
    { value: funnel.started, label: "agent i gang" },
  ];

  return (
    <div className="space-y-4">
      {/* Trakt */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-muted/30 p-3"
                style={{ opacity: 1 - i * 0.06 }}
              >
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Samme kartlegging brukes videre til behandlingsprotokoll og risiko.
          </p>
        </CardContent>
      </Card>

      {/* Rangert tabell */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prosess</TableHead>
                <TableHead className="w-[190px]">Egnethet</TableHead>
                <TableHead className="w-[120px]">Anbefaling</TableHead>
                <TableHead className="w-[120px]">Spart tid</TableHead>
                <TableHead className="w-[120px]">Persondata</TableHead>
                <TableHead className="w-[130px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.rec.id}>
                  <TableCell className="font-medium">
                    {row.processName}
                    {row.rec.status === "recruited" && (
                      <Badge variant="secondary" className="ml-2 text-[11px]">
                        Bekreftet av menneske
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-left"
                          aria-label={`Egnethet ${row.suitability.score} av 100. ${row.suitability.explanation}`}
                        >
                          <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                            {row.suitability.score}/100
                            <Info className="h-3 w-3 text-muted-foreground" aria-hidden />
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {row.suitability.explanation}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Prototype-utregning fra kartleggingen: {row.suitability.explanation}.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.rec.recommendation === "manual" ? "outline" : "secondary"}
                      className="text-[11px]"
                    >
                      {recommendationLabel(row.rec.recommendation)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {row.rec.estimated_hours_saved_per_month
                      ? `${Math.round(Number(row.rec.estimated_hours_saved_per_month))} t/mnd`
                      : "–"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.hasPersonalData ? "Ja" : "Nei"}
                    {row.highRisk && (
                      <span className="block text-xs text-muted-foreground">Høy risiko</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/processes/${row.rec.process_id}?tab=haio`)}
                    >
                      Se vurdering
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Egnethetsscoren er en prototype-utregning i grensesnittet, ikke et tall fra databasen.
        Alt Lara foreslår er merket som forslag inntil et menneske har bekreftet det.
      </p>
    </div>
  );
}
