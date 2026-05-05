import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Check } from "lucide-react";
import { useAssetMetadata } from "./useAssetMetadata";

const DATA_TYPES = ["Navn", "E-post", "Telefonnummer", "IP-adresse", "Lokasjonsdata", "Betalingsinformasjon", "Jobbsøkerdata", "Helsedata", "Atferdsdata"];
const TRANSFER = ["EU adequacy decision", "Standard kontraktsklausuler (SCC)", "Bindende konsernregler (BCR)", "Samtykke fra registrerte"];
const STANDARDS = ["GDPR", "ISO 27001", "ISO 27701", "NIS2", "DORA", "AI Act", "CRA", "Åpenhetsloven", "Personopplysningsloven"];
const STATUSES = [
  { code: "compliant", label: "Etterleves", cls: "bg-success/10 text-success border-success/30" },
  { code: "in_progress", label: "Under arbeid", cls: "bg-warning/10 text-warning border-warning/30" },
  { code: "non_compliant", label: "Ikke etterleves", cls: "bg-destructive/10 text-destructive border-destructive/30" },
];

export function PrivacySection({ asset }: { asset: any }) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const p = meta.privacy || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const toggleArr = (key: string, value: string) => {
    const list: string[] = p[key] || [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    updatePath(["privacy", key], next, { silent: true });
  };

  const Pills = ({ field, options }: { field: string; options: string[] }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = (p[field] || []).includes(o);
        return (
          <Badge
            key={o}
            variant={active ? "default" : "outline"}
            className={`cursor-pointer text-xs ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => toggleArr(field, o)}
          >
            {active && <Check className="h-3 w-3 mr-1" />}
            {o}
          </Badge>
        );
      })}
    </div>
  );

  return (
    <section id="privacy" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Personvern</h2>
      </div>

      <Card className="p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">GDPR-status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = p.gdpr_status === s.code;
              return (
                <button
                  key={s.code}
                  onClick={() => updatePath(["privacy", "gdpr_status"], s.code, { silent: true })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    active ? s.cls : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Datatyper som behandles</label>
          <Pills field="data_types" options={DATA_TYPES} />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Dataoppbevaringspolicy</label>
          <Textarea
            defaultValue={p.retention_policy || ""}
            placeholder="Beskriv hvor lenge ulike datatyper oppbevares og slettes..."
            className="text-sm min-h-[80px]"
            onBlur={(e) => updatePath(["privacy", "retention_policy"], e.target.value, { silent: true })}
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Overføringsmekanismer</label>
          <p className="text-[13px] text-muted-foreground">For overføring av data utenfor EØS.</p>
          <Pills field="transfer_mechanisms" options={TRANSFER} />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Sertifiseringer og standarder</label>
          <Pills field="standards" options={STANDARDS} />
        </div>
      </Card>
    </section>
  );
}
