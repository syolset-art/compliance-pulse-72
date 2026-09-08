/**
 * «Verdistrøm» for én prosess.
 *
 * Viser egnethetsvurderingen, foreslått arbeidsdeling mellom menneske og
 * agent, agentens mandat, kontrollpunkter — og hva den samme kartleggingen
 * allerede gir i behandlingsprotokollen (GDPR art. 30).
 *
 * Alt Lara har laget er merket «Forslag» inntil et menneske bekrefter.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  User,
  Bot,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  Circle,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  useProcessAgentRecommendations,
  type ProcessAgentRec,
} from "@/hooks/useProcessAgentRecommendations";
import { computeSuitability, recommendationLabel } from "@/lib/aiSuitability";
import {
  dataClassLabel,
  specialCategoryLabel,
  LEGAL_BASIS_OPTIONS,
} from "@/lib/processingActivity";

interface Props {
  processId: string;
  processName: string;
  workAreaId?: string;
}

const ForslagBadge = () => (
  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">
    Forslag fra Lara
  </Badge>
);

export const ProcessHaioTab = ({ processId, processName, workAreaId }: Props) => {
  const navigate = useNavigate();
  const { data: recs = [], isLoading, recruitAgent } =
    useProcessAgentRecommendations(workAreaId);

  const rec: ProcessAgentRec | undefined = useMemo(
    () => recs.find((r) => r.process_id === processId),
    [recs, processId]
  );

  const { data: process } = useQuery({
    queryKey: ["haio-process", processId],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_processes")
        .select(
          "id, name, purpose, description, data_class, special_categories, legal_basis, controller_name, systems(name, vendor)"
        )
        .eq("id", processId)
        .maybeSingle();
      return data;
    },
  });

  const { data: usage } = useQuery({
    queryKey: ["haio-ai-usage", processId],
    queryFn: async () => {
      const { data } = await supabase
        .from("process_ai_usage")
        .select("has_ai, risk_category, human_oversight_level, affected_persons")
        .eq("process_id", processId)
        .maybeSingle();
      return data;
    },
  });

  const systemName = (process?.systems as { name?: string } | null)?.name ?? "systemet i prosessen";
  const hasPersonalData =
    !!usage?.has_ai ||
    (!!process?.data_class && process.data_class !== "none") ||
    (process?.special_categories?.length ?? 0) > 0;

  const suitability = rec
    ? computeSuitability({
        recommendation: rec.recommendation,
        hoursSavedPerMonth: rec.estimated_hours_saved_per_month,
        hasPersonalData,
        riskCategory: usage?.risk_category ?? null,
      })
    : null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Ingen KI-vurdering for denne prosessen ennå</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gå til arbeidsområdet og fanen «KI-muligheter», og la Lara se på prosessene.
        </p>
      </div>
    );
  }

  const isConfirmed = rec.status === "recruited";

  // Foreslått arbeidsdeling — utledet av anbefalingen, tydelig merket som forslag.
  const humanSteps =
    rec.recommendation === "autonomous"
      ? [
          "Setter reglene agenten skal jobbe etter",
          "Ser over avvik agenten flagger",
          "Godkjenner det som går ut av virksomheten",
          "Følger med på loggen månedlig",
        ]
      : [
          "Starter og prioriterer arbeidet",
          "Vurderer forslagene agenten legger fram",
          "Tar beslutningene som krever skjønn",
          "Godkjenner resultatet før det er endelig",
        ];

  const agentSteps = [
    `Henter og leser data i ${systemName}`,
    "Sorterer, sammenstiller og kontrollerer mot reglene",
    rec.recommendation === "autonomous"
      ? "Utfører rutinearbeidet og flagger avvik"
      : "Lager utkast og forslag til neste steg",
    "Logger hva som ble gjort, og av hvem",
  ];

  // RoPA-felter (GDPR art. 30) som kartleggingen allerede dekker
  const ropaFields = [
    { label: "Formål med behandlingen", value: process?.purpose || process?.description },
    {
      label: "Kategorier av personopplysninger",
      value: process?.data_class ? dataClassLabel(process.data_class, true) : null,
    },
    {
      label: "Særlige kategorier",
      value: (process?.special_categories ?? [])
        .map((c: string) => specialCategoryLabel(c, true))
        .join(", "),
    },
    {
      label: "Behandlingsgrunnlag",
      value:
        LEGAL_BASIS_OPTIONS.find((o) => o.value === process?.legal_basis)?.labelNb ??
        process?.legal_basis,
    },
    { label: "Behandlingsansvarlig", value: process?.controller_name },
    { label: "Systemer og mottakere", value: (process?.systems as { name?: string } | null)?.name },
  ];
  const covered = ropaFields.filter((f) => !!f.value && String(f.value).trim() !== "");
  const missing = ropaFields.filter((f) => !f.value || String(f.value).trim() === "");

  return (
    <div className="space-y-4">
      {/* Egnethet */}
      <Card className="border-primary/20">
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Egnethet for KI-agent</h3>
            {isConfirmed ? (
              <Badge variant="secondary" className="text-[11px]">Bekreftet av menneske</Badge>
            ) : (
              <ForslagBadge />
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums">
              {suitability?.score}/100
            </span>
            <Badge variant="outline" className="text-[11px]">
              {recommendationLabel(rec.recommendation)}
            </Badge>
            {!!rec.estimated_hours_saved_per_month && (
              <span className="text-sm text-muted-foreground">
                Anslått {Math.round(Number(rec.estimated_hours_saved_per_month))} timer spart i måneden
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Slik er tallet satt sammen: {suitability?.explanation}.
          </p>
          {rec.rationale && <p className="text-sm text-muted-foreground">{rec.rationale}</p>}
        </CardContent>
      </Card>

      {/* Arbeidsdeling */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Slik kan arbeidet deles</h3>
            {!isConfirmed && <ForslagBadge />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Mennesket gjør
              </div>
              <ul className="space-y-1.5">
                {humanSteps.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                    <Circle className="mt-1.5 h-1.5 w-1.5 shrink-0 fill-current" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-primary" />
                Agenten gjør
              </div>
              <ul className="space-y-1.5">
                {agentSteps.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                    <Circle className="mt-1.5 h-1.5 w-1.5 shrink-0 fill-current" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mandat */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Agentens mandat</h3>
            {!isConfirmed && <ForslagBadge />}
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Tilgang til</dt>
              <dd className="text-sm">{systemName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Kan gjøre selv</dt>
              <dd className="text-sm">
                Lese data, sammenstille og lage utkast
                {rec.recommendation === "autonomous" ? ", og fullføre rutinesaker" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Krever godkjenning</dt>
              <dd className="text-sm">
                Utbetaling, utsending og alt som avviker fra reglene
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Kontrollpunkter og logging */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Kontrollpunkter og logging</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>Et menneske godkjenner før noe forlater virksomheten.</li>
            <li>Avvik fra reglene stoppes og legges i Oppgaver.</li>
            <li>
              Hver handling logges med tidspunkt, hvilke data som ble brukt og hvem som godkjente.
            </li>
            <li>
              Menneskelig kontrollnivå fra kartleggingen: {usage?.human_oversight_level || "ikke satt"}.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Compliance-gjenbruken */}
      {hasPersonalData && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold">Dette gir også RoPA</h3>
              <Badge variant="secondary" className="text-[11px]">
                {covered.length} av {ropaFields.length} felter dekket
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Dere kartla for KI. De samme opplysningene fyller behandlingsprotokollen etter GDPR
              artikkel 30.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ul className="space-y-1.5">
                {covered.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span>
                      {f.label}
                      <span className="block text-xs text-muted-foreground">{String(f.value)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5">
                {missing.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Circle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      {f.label}
                      <span className="block text-xs">Mangler</span>
                    </span>
                  </li>
                ))}
                {missing.length === 0 && (
                  <li className="text-sm text-muted-foreground">Ingen felter mangler.</li>
                )}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/protocols")}>
              Åpne behandlingsaktiviteten
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Dette er en prototype. Arbeidsdeling, mandat og kontrollpunkter vises som forslag —
          agenten kjører ikke, og ingenting håndheves av systemet ennå.
        </AlertDescription>
      </Alert>

      {isConfirmed ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Bekreftet av menneske. Oppsettet ligger som oppgave under Oppgaver.
        </div>
      ) : (
        <Button
          className="w-full sm:w-auto"
          disabled={recruitAgent.isPending}
          onClick={() => recruitAgent.mutate({ rec, processName })}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {recruitAgent.isPending ? "Bekrefter …" : "Godkjenn og aktiver"}
        </Button>
      )}
    </div>
  );
};
