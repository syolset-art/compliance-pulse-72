import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { useAssetMetadata } from "./useAssetMetadata";

export function IncidentsSection({ asset }: { asset: any }) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const inc = meta.incidents || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  return (
    <section id="incidents" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Hendelser og kontinuitet</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Hva skjer når noe går galt — varsling, gjenoppretting og kontinuitet.
      </p>

      <Card className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Hendelseshåndtering</label>
          <p className="text-[13px] text-muted-foreground">Hvordan oppdages, varsles og håndteres sikkerhetshendelser.</p>
          <Textarea
            defaultValue={inc.handling || ""}
            placeholder="Beskriv prosessen for å oppdage og håndtere hendelser..."
            className="text-sm min-h-[90px]"
            onBlur={(e) => updatePath(["incidents", "handling"], e.target.value, { silent: true })}
          />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Forretningskontinuitet</label>
          <p className="text-[13px] text-muted-foreground">Backup, gjenoppretting, RTO/RPO og SLA-er.</p>
          <Textarea
            defaultValue={inc.continuity || ""}
            placeholder="Beskriv backup-rutiner, gjenopprettingstider og kontinuitetsplaner..."
            className="text-sm min-h-[90px]"
            onBlur={(e) => updatePath(["incidents", "continuity"], e.target.value, { silent: true })}
          />
        </div>
      </Card>
    </section>
  );
}
