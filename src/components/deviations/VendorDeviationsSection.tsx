import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useVendorDeviations, useDeviationImpacts, useConfirmDeviation, useScoreHistory,
} from "@/hooks/useVendorDeviations";
import { deviationSourceLabel } from "@/lib/deviationImpact";
import { getControlAreaLabel } from "@/lib/controlAreas";
import { RegisterVendorDeviationDialog } from "@/components/dialogs/RegisterVendorDeviationDialog";
import { CloseDeviationDialog } from "@/components/dialogs/CloseDeviationDialog";

interface Props {
  assetId: string;
  vendorName?: string;
}

const criticalityBadge = (c?: string) => {
  switch (c) {
    case "critical": return <Badge variant="destructive">Kritisk</Badge>;
    case "high": return <Badge variant="destructive" className="bg-destructive/80">Høy</Badge>;
    case "medium": return <Badge className="bg-warning hover:bg-warning">Middels</Badge>;
    default: return <Badge variant="secondary">Lav</Badge>;
  }
};

export function VendorDeviationsSection({ assetId, vendorName }: Props) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [closing, setClosing] = useState<any>(null);

  const { data: deviations = [], isLoading } = useVendorDeviations(assetId);
  const open = deviations.filter((d) => d.status !== "resolved");
  const { data: impacts = [] } = useDeviationImpacts(open.map((d) => d.id));
  const { data: history = [] } = useScoreHistory(assetId);
  const confirm = useConfirmDeviation(assetId);

  const activeImpacts = impacts.filter((i) => i.status === "active");
  const affectedAreas = Array.from(new Set(activeImpacts.map((i) => i.control_area)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Avvik på leverandøren</h4>
          <p className="text-xs text-muted-foreground">
            Åpne avvik gjør at berørte krav ikke regnes som oppfylt.
          </p>
        </div>
        <Button size="sm" onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrer avvik
        </Button>
      </div>

      {activeImpacts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {activeImpacts.length} krav er satt til ikke oppfylt
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {affectedAreas.map((a) => (
                  <Badge key={a} variant="outline" className="text-[11px]">
                    {getControlAreaLabel(a, "nb")}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : deviations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen avvik registrert på denne leverandøren.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {deviations.map((d) => {
            const isOpen = d.status !== "resolved";
            const needsConfirm = isOpen && !d.confirmed_at;
            return (
              <div key={d.id} className="p-3 flex items-start gap-3">
                {isOpen ? (
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-status-closed mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{d.title}</span>
                    {criticalityBadge(d.criticality)}
                    <Badge variant="outline" className="text-[11px]">
                      {deviationSourceLabel(d.source, true)}
                    </Badge>
                    {needsConfirm && (
                      <Badge variant="secondary" className="text-[11px]">Til bekreftelse</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Oppdaget {d.discovered_at ? format(new Date(d.discovered_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    {d.responsible ? ` · Ansvarlig: ${d.responsible}` : ""}
                    {!isOpen && d.closed_by ? ` · Lukket av ${d.closed_by}` : ""}
                  </p>
                  {!isOpen && d.close_reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{d.close_reason}</p>
                  )}
                </div>
                {isOpen && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {needsConfirm && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          confirm.mutate({ deviation: d, confirmedBy: d.responsible || "Ukjent" })
                        }
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Bekreft
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setClosing(d)}>
                      Lukk
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Scorehistorikk</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {history.slice(0, 5).map((h) => (
              <li key={h.id}>
                {format(new Date(h.created_at), "dd.MM.yyyy", { locale: nb })} ·{" "}
                {h.event_type === "deviation_closed"
                  ? `Gjenopprettet ${h.affected_requirements} krav`
                  : `${h.affected_requirements} krav satt til null`}
                {h.actor ? ` · ${h.actor}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <RegisterVendorDeviationDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        assetId={assetId}
        vendorName={vendorName}
      />
      <CloseDeviationDialog
        open={!!closing}
        onOpenChange={(o) => !o && setClosing(null)}
        deviation={closing}
        assetId={assetId}
      />
    </div>
  );
}
