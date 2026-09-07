/**
 * «AI-oppsett» — fanen der en prosess går fra kartlagt til satt i arbeid.
 *
 * Alt her bygger på kartleggingen som allerede finnes: systemer, data og
 * Laras anbefaling per prosess. Ingenting håndheves i denne prototypen —
 * det står også i klartekst på skjermen.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Workflow,
  ShieldCheck,
  UserCheck,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  MANDATE_PERMISSIONS,
  defaultMandate,
  type Mandate,
  type MandateKey,
} from "@/lib/agentMandate";
import {
  useProcessAgentRecommendations,
  type ProcessAgentRec,
} from "@/hooks/useProcessAgentRecommendations";

interface Props {
  processId: string;
  processName: string;
  systemId?: string;
  workAreaId?: string;
}

/** Klarspråk for hva agenten får lov til, per prosess. */
const PROCESS_PERMISSION_LABELS: Partial<Record<MandateKey, string>> = {
  read: "Lese data i systemene som brukes i prosessen",
  analyze: "Vurdere hva som bør gjøres og foreslå neste steg",
  create_activity: "Opprette oppgaver til de som jobber med prosessen",
  change_data: "Endre data i prosessen",
};

const PROCESS_PERMISSION_KEYS: MandateKey[] = [
  "read",
  "analyze",
  "create_activity",
  "change_data",
];

export const ProcessAiSetupTab = ({
  processId,
  processName,
  systemId,
  workAreaId,
}: Props) => {
  const { data: recs, isLoading, recruitAgent } = useProcessAgentRecommendations(workAreaId);
  const [mandate, setMandate] = useState<Mandate>(() => defaultMandate());
  const [approvalOn, setApprovalOn] = useState(true);

  const rec: ProcessAgentRec | undefined = useMemo(
    () => (recs ?? []).find((r) => r.process_id === processId),
    [recs, processId]
  );

  // «Slik utføres arbeidet i dag» — systemene prosessen faktisk går gjennom.
  const { data: system } = useQuery({
    queryKey: ["process-ai-setup-system", systemId],
    queryFn: async () => {
      if (!systemId) return null;
      const { data } = await supabase
        .from("systems")
        .select("id, name, vendor, category, work_areas(name, responsible_person)")
        .eq("id", systemId)
        .maybeSingle();
      return data;
    },
    enabled: !!systemId,
  });

  const workArea = (system?.work_areas ?? null) as
    | { name?: string; responsible_person?: string }
    | null;

  const toggle = (key: MandateKey, enabled: boolean) =>
    setMandate((m) => ({ ...m, [key]: { ...m[key], enabled } }));

  const isRecruited = rec?.status === "recruited";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Ingen AI-mulighet er vurdert for denne prosessen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Lara vurderer AI-muligheter per arbeidsområde. Gå til arbeidsområdet og be Lara se på
          prosessene.
        </p>
      </div>
    );
  }

  if (rec.recommendation === "manual") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Denne prosessen bør gjøres av mennesker</p>
                <p className="mt-1 text-sm text-muted-foreground">{rec.rationale}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Slik utføres arbeidet i dag */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Slik utføres arbeidet i dag</h3>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">System</dt>
              <dd className="text-sm font-medium">
                {system?.name ?? "Ikke registrert"}
                {system?.vendor ? (
                  <span className="font-normal text-muted-foreground"> · {system.vendor}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Arbeidsområde</dt>
              <dd className="text-sm font-medium">{workArea?.name ?? "Ikke satt"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ansvarlig</dt>
              <dd className="text-sm font-medium">
                {workArea?.responsible_person ?? "Ikke satt"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Agentens jobb */}
      <Card className="border-primary/20">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Agentens jobb</h3>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">
              Foreslått av Lara
            </Badge>
          </div>
          <p className="text-sm font-medium">{rec.suggested_agent_role}</p>
          <p className="text-sm text-muted-foreground">{rec.rationale}</p>
          {!!rec.estimated_hours_saved_per_month && (
            <p className="text-xs text-muted-foreground">
              Anslått {Number(rec.estimated_hours_saved_per_month)} timer spart i måneden.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hva agenten får lov til */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Hva agenten får lov til</h3>
          </div>
          <div className="divide-y">
            {PROCESS_PERMISSION_KEYS.map((key) => {
              const perm = MANDATE_PERMISSIONS.find((p) => p.key === key);
              if (!perm) return null;
              return (
                <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-sm">{PROCESS_PERMISSION_LABELS[key] ?? perm.label}</span>
                  <Switch
                    checked={mandate[key].enabled}
                    onCheckedChange={(v) => toggle(key, v)}
                    disabled={isRecruited}
                    aria-label={PROCESS_PERMISSION_LABELS[key] ?? perm.label}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Krever godkjenning */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Krever godkjenning</h3>
            </div>
            <Switch
              checked={approvalOn}
              onCheckedChange={setApprovalOn}
              disabled={isRecruited}
              aria-label="Krever godkjenning av et menneske"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {approvalOn
              ? `Et menneske må godkjenne før agenten fullfører arbeid i «${processName}». Godkjenningen legges i Oppgaver.`
              : "Ingen godkjenning er satt. Da fullfører agenten arbeidet uten at noen ser over."}
          </p>
        </CardContent>
      </Card>

      {/* Ærlig om prototypen */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Kontrollpunktet vises her, men agenten kjører ikke ennå i denne prototypen. Valgene lagres
          som et forslag til oppsett, ikke som en regel systemet håndhever.
        </AlertDescription>
      </Alert>

      {isRecruited ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          AI-oppsettet er sendt til godkjenning. Du finner det under Oppgaver.
        </div>
      ) : (
        <Button
          className="w-full sm:w-auto"
          disabled={recruitAgent.isPending}
          onClick={() => recruitAgent.mutate({ rec, processName })}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {recruitAgent.isPending ? "Sender til godkjenning …" : "Sett AI i arbeid"}
        </Button>
      )}
    </div>
  );
};
