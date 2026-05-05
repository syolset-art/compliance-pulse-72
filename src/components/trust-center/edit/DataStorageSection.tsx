import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Database, Check } from "lucide-react";
import { useAssetMetadata } from "./useAssetMetadata";

const REGIONS = ["Norge", "EU", "EØS", "Storbritannia", "USA", "Annet"];
const LEGAL_BASES = [
  { code: "consent", label: "Samtykke (Art. 6(1)(a))" },
  { code: "contract", label: "Avtale (Art. 6(1)(b))" },
  { code: "legal_obligation", label: "Rettslig plikt (Art. 6(1)(c))" },
  { code: "vital_interests", label: "Vitale interesser (Art. 6(1)(d))" },
  { code: "public_task", label: "Offentlig oppgave (Art. 6(1)(e))" },
  { code: "legitimate_interests", label: "Berettiget interesse (Art. 6(1)(f))" },
];
const ROLES = [
  { code: "controller", label: "Behandlingsansvarlig" },
  { code: "processor", label: "Databehandler" },
  { code: "joint", label: "Felles ansvarlig" },
];

export function DataStorageSection({ asset }: { asset: any }) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const ds = meta.data_storage || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const toggleArr = (key: string, value: string) => {
    const list: string[] = ds[key] || [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    updatePath(["data_storage", key], next, { silent: true });
  };

  const Pills = ({ field, options }: { field: string; options: { code: string; label: string }[] | string[] }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o: any) => {
        const code = typeof o === "string" ? o : o.code;
        const label = typeof o === "string" ? o : o.label;
        const active = (ds[field] || []).includes(code);
        return (
          <Badge
            key={code}
            variant={active ? "default" : "outline"}
            className={`cursor-pointer text-xs ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => toggleArr(field, code)}
          >
            {active && <Check className="h-3 w-3 mr-1" />}
            {label}
          </Badge>
        );
      })}
    </div>
  );

  return (
    <section id="data-storage" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Datalagring og oppbevaring</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Hvor lagres dataene, hvor lenge, og på hvilket rettsgrunnlag.
      </p>

      <Card className="p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Datalagringsregion</label>
          <p className="text-[13px] text-muted-foreground">Hvor dataene fysisk lagres. Velg én eller flere.</p>
          <Pills field="regions" options={REGIONS} />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Oppbevaringsperiode</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              defaultValue={ds.retention_value || ""}
              placeholder="Antall"
              className="text-sm w-32"
              onBlur={(e) => updatePath(["data_storage", "retention_value"], e.target.value, { silent: true })}
            />
            <select
              defaultValue={ds.retention_unit || "år"}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              onChange={(e) => updatePath(["data_storage", "retention_unit"], e.target.value, { silent: true })}
            >
              <option value="dager">Dager</option>
              <option value="måneder">Måneder</option>
              <option value="år">År</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">GDPR-rettsgrunnlag</label>
          <p className="text-[13px] text-muted-foreground">På hvilket grunnlag behandler dere personopplysninger.</p>
          <Pills field="legal_bases" options={LEGAL_BASES} />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Rolle i behandlingen</label>
          <Pills field="roles" options={ROLES} />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Tilleggsnotater (valgfri)</label>
          <Textarea
            defaultValue={ds.notes || ""}
            placeholder="Eventuelle presiseringer om datalagring..."
            className="text-sm min-h-[60px]"
            onBlur={(e) => updatePath(["data_storage", "notes"], e.target.value, { silent: true })}
          />
        </div>
      </Card>
    </section>
  );
}
