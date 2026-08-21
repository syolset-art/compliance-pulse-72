import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ChevronRight, Plus, Sparkles } from "lucide-react";
import { ProcessingActivityWizardDialog } from "@/components/dialogs/ProcessingActivityWizardDialog";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { dataClassLabel } from "@/lib/processingActivity";
import { generateRopaDraftForSystem } from "@/lib/ropaAutoDraft";

interface ProcessingActivitiesTabProps {
  workAreaId: string;
  workAreaName: string;
  onSelectProcess?: (processId: string | null) => void;
  onSelectAsset?: (asset: { id: string; type: "system" | "process" }) => void;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  system_id: string;
  purpose?: string | null;
  data_class?: string | null;
  special_categories?: string[] | null;
  legal_basis?: string | null;
  controller_name?: string | null;
  ai_suggested_fields?: Record<string, unknown> | null;
  created_at?: string | null;
  systems?: { name: string } | null;
}

/** Har utkastet ubekreftede AI-foreslåtte felt? */
const hasUnconfirmedAi = (p: Activity) =>
  !!p.ai_suggested_fields && Object.keys(p.ai_suggested_fields).length > 0;

export function ProcessingActivitiesTab({
  workAreaId,
  workAreaName,
  onSelectAsset,
}: ProcessingActivitiesTabProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  /** Aktivitet som åpnes for gjennomgang/godkjenning (radklikk) */
  const [reviewing, setReviewing] = useState<Activity | null>(null);

  const openReview = (activity: Activity) => setReviewing(activity);

  /**
   * «Sist sett»-sporing per arbeidsområde: når brukeren åpner fanen lagres
   * tidspunktet, slik at aktiviteter Lara/agenten har generert i bakgrunnen
   * siden forrige besøk kan markeres som nye ved neste visning.
   */
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  useEffect(() => {
    const key = `ropa-last-seen:${workAreaId}`;
    setLastSeen(localStorage.getItem(key));
    localStorage.setItem(key, new Date().toISOString());
  }, [workAreaId]);

  /**
   * Catch-up: uansett hvordan et system havnet i arbeidsområdet (lagt til
   * manuelt, oppdaget av Sara/agenten eller importert) skal det finnes et
   * utkast til behandlingsaktivitet. Systemer uten aktivitet får et
   * AI-generert utkast i bakgrunnen neste gang fanen åpnes — uten å avbryte
   * brukeren. Oppgave i oppgavekøen opprettes av generateRopaDraftForSystem.
   */
  const queryClient = useQueryClient();
  const autoGenDone = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!workAreaId || autoGenDone.current.has(workAreaId)) return;
    autoGenDone.current.add(workAreaId);
    (async () => {
      try {
        const { data: systemsData } = await supabase
          .from("systems")
          .select("id, name")
          .eq("work_area_id", workAreaId);
        if (!systemsData || systemsData.length === 0) return;

        const { data: procs } = await supabase
          .from("system_processes")
          .select("system_id")
          .in("system_id", systemsData.map((s) => s.id));
        const covered = new Set((procs || []).map((p) => p.system_id as string));
        const missing = systemsData.filter((s) => !covered.has(s.id));
        if (missing.length === 0) return;

        for (const s of missing) {
          try {
            await generateRopaDraftForSystem({ systemId: s.id, systemName: s.name, isNb: true });
          } catch (e) {
            console.error("RoPA catch-up: autogenerering feilet for", s.name, e);
          }
        }
        queryClient.invalidateQueries({ queryKey: ["wa-processing-activities", workAreaId] });
        queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
      } catch (e) {
        console.error("RoPA catch-up feilet", e);
      }
    })();
  }, [workAreaId, queryClient]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["wa-processing-activities", workAreaId],
    queryFn: async () => {
      const { data: systemsData } = await supabase
        .from("systems")
        .select("id")
        .eq("work_area_id", workAreaId);

      const systemIds = systemsData?.map((s) => s.id) || [];
      if (systemIds.length === 0) return [];

      const { data, error } = await supabase
        .from("system_processes")
        .select("*, systems(name)")
        .in("system_id", systemIds)
        .order("name");

      if (error) throw error;
      return (data || []) as Activity[];
    },
  });

  /** Er aktiviteten opprettet etter forrige besøk på fanen? */
  const isNewSinceLastVisit = (a: Activity) =>
    !!lastSeen && !!a.created_at && new Date(a.created_at).getTime() > new Date(lastSeen).getTime();

  /** Nye utkast generert av Lara/agenten i bakgrunnen siden forrige besøk */
  const newDrafts = useMemo(
    () => activities.filter((a) => a.status === "draft" && isNewSinceLastVisit(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activities, lastSeen],
  );

  // Nye utkast øverst, deretter resten i opprinnelig rekkefølge
  const sortedActivities = useMemo(() => {
    const fresh = new Set(newDrafts.map((a) => a.id));
    return [...activities].sort((a, b) => Number(fresh.has(b.id)) - Number(fresh.has(a.id)));
  }, [activities, newDrafts]);

  const wizardButton = (
    <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5">
      <Plus className="h-4 w-4" />
      Ny behandlingsaktivitet
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-2">Ingen behandlingsaktiviteter registrert ennå</p>
        <p className="text-sm text-muted-foreground mb-4">
          Lara hjelper deg med å lage et utkast basert på systemet og bransjen din.
        </p>
        {wizardButton}
        <ProcessingActivityWizardDialog
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          workAreaId={workAreaId}
          workAreaName={workAreaName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Behandlingsprotokoll (RoPA) for {workAreaName}
        </p>
        {wizardButton}
      </div>

      {/* Varsel om nye autogenererte utkast siden forrige besøk */}
      {newDrafts.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/[0.04] px-4 py-3">
          <LaraIcon size={22} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {newDrafts.length === 1
                ? "Lara har opprettet 1 ny behandlingsaktivitet siden forrige besøk"
                : `Lara har opprettet ${newDrafts.length} nye behandlingsaktiviteter siden forrige besøk`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {newDrafts.map((d) => `«${d.systems?.name ?? d.name}»`).join(", ")} — utkastene
              venter på gjennomgang. Klikk på raden for å kontrollere og godkjenne.
            </p>
          </div>
          <Button
            size="sm"
            className="h-7 shrink-0 text-xs"
            onClick={() => openReview(newDrafts[0])}
          >
            Gå gjennom nå
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Behandlingsaktivitet</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Datatype</TableHead>
              <TableHead>Ansvarlig</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedActivities.map((activity) => (
              <TableRow
                key={activity.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openReview(activity)}
              >
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{activity.name}</span>
                    {isNewSinceLastVisit(activity) && activity.status === "draft" && (
                      <Badge className="text-[10px] px-1.5 py-0">Ny</Badge>
                    )}
                    {hasUnconfirmedAi(activity) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Inneholder felt foreslått av Lara som venter på menneskelig bekreftelse.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {(activity.purpose || activity.description) && (
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {activity.purpose || activity.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset?.({ id: activity.system_id, type: "system" });
                    }}
                  >
                    {activity.systems?.name}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.data_class ? dataClassLabel(activity.data_class, true) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.controller_name || workAreaName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      activity.status === "active"
                        ? "default"
                        : activity.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {activity.status === "active"
                      ? "Aktiv"
                      : activity.status === "draft"
                      ? "Utkast"
                      : "Arkivert"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {hasUnconfirmedAi(activity) || activity.status === "draft" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReview(activity);
                      }}
                    >
                      Gå gjennom
                    </Button>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProcessingActivityWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
      />

      {/* Radklikk: åpne utkastet for gjennomgang og godkjenning */}
      <ProcessingActivityWizardDialog
        open={!!reviewing}
        onOpenChange={(open) => {
          if (!open) setReviewing(null);
        }}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
        existingProcess={
          reviewing
            ? {
                id: reviewing.id,
                system_id: reviewing.system_id,
                system_name: reviewing.systems?.name ?? null,
                name: reviewing.name,
                description: reviewing.description,
                purpose: reviewing.purpose ?? null,
                data_class: reviewing.data_class ?? null,
                special_categories: reviewing.special_categories ?? null,
                legal_basis: reviewing.legal_basis ?? null,
                controller_name: reviewing.controller_name ?? null,
                ai_suggested_fields: reviewing.ai_suggested_fields ?? null,
              }
            : undefined
        }
      />
    </div>
  );
}
