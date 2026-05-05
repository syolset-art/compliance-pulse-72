import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { useAssetMetadata } from "./useAssetMetadata";

const ENCRYPTION = ["AES-256", "TLS 1.2+", "HTTPS overalt", "Diskkryptering", "End-to-end-kryptering"];
const ACCESS = ["Rollebasert tilgangskontroll (RBAC)", "Tofaktor (MFA)", "Minste privilegium", "Logging og overvåking", "Single Sign-On (SSO)"];

export function SecurityDetailsCard({ asset }: { asset: any }) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const sd = meta.security_details || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const toggleArr = (key: string, value: string) => {
    const list: string[] = sd[key] || [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    updatePath(["security_details", key], next, { silent: true });
  };

  const Pills = ({ field, options }: { field: string; options: string[] }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = (sd[field] || []).includes(o);
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
    <Card className="p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Sikkerhetstiltak i bruk</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Velg hvilke tekniske tiltak som er på plass.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Kryptering</label>
        <Pills field="encryption" options={ENCRYPTION} />
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-xs font-medium text-foreground">Tilgangskontroll</label>
        <Pills field="access_control" options={ACCESS} />
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border">
        <label className="text-xs font-medium text-foreground">Penetrasjonstesting og bug bounty</label>
        <Textarea
          defaultValue={sd.pentest || ""}
          placeholder="Frekvens, leverandør, omfang..."
          className="text-sm min-h-[60px]"
          onBlur={(e) => updatePath(["security_details", "pentest"], e.target.value, { silent: true })}
        />
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border">
        <label className="text-xs font-medium text-foreground">Sikkerhetsopplæring av ansatte</label>
        <Textarea
          defaultValue={sd.training || ""}
          placeholder="Program, frekvens, målgruppe..."
          className="text-sm min-h-[60px]"
          onBlur={(e) => updatePath(["security_details", "training"], e.target.value, { silent: true })}
        />
      </div>
    </Card>
  );
}
