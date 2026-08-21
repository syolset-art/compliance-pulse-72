import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ChevronRight, Plus, Sparkles } from "lucide-react";
import { ProcessingActivityWizardDialog } from "@/components/dialogs/ProcessingActivityWizardDialog";
import { dataClassLabel } from "@/lib/processingActivity";

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
  systems?: { name: string } | null;
}

/** Har utkastet ubekreftede AI-foreslåtte felt? */
const hasUnconfirmedAi = (p: Activity) =>
  !!p.ai_suggested_fields && Object.keys(p.ai_suggested_fields).length > 0;

export function ProcessingActivitiesTab({
  workAreaId,
  workAreaName,
  onSelectProcess,
  onSelectAsset,
}: ProcessingActivitiesTabProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  /** Aktivitet som åpnes for gjennomgang/godkjenning (radklikk) */
  const [reviewing, setReviewing] = useState<Activity | null>(null);

  const openReview = (activity: Activity) => setReviewing(activity);

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
            {activities.map((activity) => (
              <TableRow
                key={activity.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openReview(activity)}
              >
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{activity.name}</span>
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
}
