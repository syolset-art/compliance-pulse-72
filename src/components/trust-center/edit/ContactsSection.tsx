import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAssetMetadata } from "./useAssetMetadata";

interface ContactsSectionProps {
  asset: any;
}

const FIELDS = [
  { key: "general", label: "Generell kontakt", helper: "Hovedkontakt for henvendelser", placeholder: "kontakt@firma.no" },
  { key: "privacy", label: "Personvernkontakt", helper: "For spørsmål om dine personopplysninger", placeholder: "personvern@firma.no" },
  { key: "security", label: "Sikkerhetskontakt", helper: "For å rapportere sikkerhetsproblemer", placeholder: "sikkerhet@firma.no" },
];

export function ContactsSection({ asset }: ContactsSectionProps) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const contacts = meta.contacts || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const [local, setLocal] = useState(contacts);
  useEffect(() => setLocal(contacts), [JSON.stringify(contacts)]);

  const save = (key: string, value: string) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    updatePath(["contacts", key], value, { silent: true });
  };

  return (
    <section id="contacts" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Kontaktinformasjon</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Rollebaserte kontaktveier for ulike henvendelser. Bruk e-postadresser knyttet til funksjon — ikke personer.
      </p>

      <Card className="p-5 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{f.label}</label>
            <p className="text-[13px] text-muted-foreground">{f.helper}</p>
            <Input
              type="email"
              defaultValue={local[f.key] || ""}
              placeholder={f.placeholder}
              className="text-sm"
              onBlur={(e) => e.target.value !== (local[f.key] || "") && save(f.key, e.target.value.trim())}
            />
          </div>
        ))}

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">
            Hendelseskontakt <span className="text-muted-foreground font-normal">(valgfri)</span>
          </label>
          <p className="text-[13px] text-muted-foreground">Døgnbemannet kontakt for aktive hendelser</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              type="email"
              defaultValue={local.incident_email || ""}
              placeholder="hendelse@firma.no"
              className="text-sm"
              onBlur={(e) => save("incident_email", e.target.value.trim())}
            />
            <Input
              type="tel"
              defaultValue={local.incident_phone || ""}
              placeholder="+47 ..."
              className="text-sm"
              onBlur={(e) => save("incident_phone", e.target.value.trim())}
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Postadresse</label>
          <p className="text-[13px] text-muted-foreground">Juridisk postadresse for personvernhenvendelser</p>
          <Textarea
            defaultValue={local.postal_address || ""}
            placeholder="Gateadresse, postnr, sted"
            className="text-sm min-h-[60px]"
            onBlur={(e) => save("postal_address", e.target.value.trim())}
          />
        </div>
      </Card>
    </section>
  );
}
