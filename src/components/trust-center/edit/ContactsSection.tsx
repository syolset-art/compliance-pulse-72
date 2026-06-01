import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAssetMetadata } from "./useAssetMetadata";

interface ContactsSectionProps {
  asset: any;
}

export function ContactsSection({ asset }: ContactsSectionProps) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const contacts = (meta.contacts || {}) as Record<string, any>;
  const { updatePath, updateColumns } = useAssetMetadata(asset?.id, meta);

  // local form state — seed from columns first, metadata as fallback
  const [form, setForm] = useState({
    contact_name: asset?.contact_name || "",
    contact_role: asset?.contact_role || "",
    contact_email: asset?.contact_email || contacts.general || "",
    privacy_contact_email: asset?.privacy_contact_email || contacts.privacy || "",
    privacy_policy_url: asset?.privacy_policy_url || "",
    security_contact_email: asset?.security_contact_email || contacts.security || "",
    incident_email: contacts.incident_email || "",
    incident_phone: contacts.incident_phone || "",
    incident_report_url: asset?.incident_report_url || "",
    privacy_contact_address: asset?.privacy_contact_address || contacts.postal_address || "",
  });

  useEffect(() => {
    setForm({
      contact_name: asset?.contact_name || "",
      contact_role: asset?.contact_role || "",
      contact_email: asset?.contact_email || contacts.general || "",
      privacy_contact_email: asset?.privacy_contact_email || contacts.privacy || "",
      privacy_policy_url: asset?.privacy_policy_url || "",
      security_contact_email: asset?.security_contact_email || contacts.security || "",
      incident_email: contacts.incident_email || "",
      incident_phone: contacts.incident_phone || "",
      incident_report_url: asset?.incident_report_url || "",
      privacy_contact_address: asset?.privacy_contact_address || contacts.postal_address || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, JSON.stringify(contacts)]);

  const setField = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Mirror writers: keep column + metadata.contacts in sync
  const saveColumn = (key: keyof typeof form, value: string) => {
    updateColumns({ [key]: value || null }, { silent: true });
  };
  const saveMirror = (column: keyof typeof form, metaKey: string, value: string) => {
    const v = value.trim();
    updateColumns({ [column]: v || null }, { silent: true });
    updatePath(["contacts", metaKey], v, { silent: true });
  };
  const saveMetaOnly = (metaKey: string, value: string) => {
    updatePath(["contacts", metaKey], value.trim(), { silent: true });
  };

  return (
    <section id="contacts" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Kontaktinformasjon</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Disse feltene vises på Trust Profilen. Bruk gjerne rollebaserte e-postadresser knyttet til funksjon — ikke personer — der det er mulig.
      </p>

      <Card className="p-5 space-y-6">
        {/* Hovedkontakt */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Hovedkontakt</h3>
          <p className="text-sm text-muted-foreground">Person eller funksjon som tar imot avtaler, DPA-er og generelle henvendelser.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              defaultValue={form.contact_name}
              placeholder="Navn (f.eks. Ola Nordmann)"
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.contact_name) { setField("contact_name", v); saveColumn("contact_name", v); }
              }}
            />
            <Input
              defaultValue={form.contact_role}
              placeholder="Rolle (f.eks. Daglig leder)"
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.contact_role) { setField("contact_role", v); saveColumn("contact_role", v); }
              }}
            />
          </div>
          <Input
            type="email"
            defaultValue={form.contact_email}
            placeholder="kontakt@firma.no"
            className="text-sm"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== form.contact_email) { setField("contact_email", v); saveMirror("contact_email", "general", v); }
            }}
          />
        </div>

        {/* Personvern / DPO */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Personvern / DPO</h3>
          <p className="text-sm text-muted-foreground">For spørsmål om personopplysninger og rettigheter etter GDPR.</p>
          <Input
            type="email"
            defaultValue={form.privacy_contact_email}
            placeholder="personvern@firma.no"
            className="text-sm"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== form.privacy_contact_email) { setField("privacy_contact_email", v); saveMirror("privacy_contact_email", "privacy", v); }
            }}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Lenke til personvernerklæring <span className="text-muted-foreground font-normal">(valgfri)</span></label>
            <Input
              type="url"
              defaultValue={form.privacy_policy_url}
              placeholder="https://firma.no/personvern"
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.privacy_policy_url) { setField("privacy_policy_url", v); saveColumn("privacy_policy_url", v); }
              }}
            />
          </div>
        </div>

        {/* Sikkerhet */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Sikkerhetskontakt</h3>
          <p className="text-sm text-muted-foreground">For å rapportere sårbarheter og sikkerhetsproblemer.</p>
          <Input
            type="email"
            defaultValue={form.security_contact_email}
            placeholder="sikkerhet@firma.no"
            className="text-sm"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== form.security_contact_email) { setField("security_contact_email", v); saveMirror("security_contact_email", "security", v); }
            }}
          />
        </div>

        {/* Beredskap / hendelse */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground">Beredskap / hendelse <span className="text-muted-foreground font-normal text-xs">(valgfri)</span></h3>
          <p className="text-sm text-muted-foreground">Døgnbemannet kontakt for aktive hendelser.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              type="email"
              defaultValue={form.incident_email}
              placeholder="hendelse@firma.no"
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.incident_email) { setField("incident_email", v); saveMetaOnly("incident_email", v); }
              }}
            />
            <Input
              type="tel"
              defaultValue={form.incident_phone}
              placeholder="+47 ..."
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.incident_phone) { setField("incident_phone", v); saveMetaOnly("incident_phone", v); }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Lenke til avviksrapportering <span className="text-muted-foreground font-normal">(valgfri)</span></label>
            <Input
              type="url"
              defaultValue={form.incident_report_url}
              placeholder="https://firma.no/rapporter-hendelse"
              className="text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== form.incident_report_url) { setField("incident_report_url", v); saveColumn("incident_report_url", v); }
              }}
            />
          </div>
        </div>

        {/* Postadresse */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-sm font-medium text-foreground">Postadresse</label>
          <p className="text-sm text-muted-foreground">Juridisk postadresse for personvernhenvendelser.</p>
          <Textarea
            defaultValue={form.privacy_contact_address}
            placeholder="Gateadresse, postnr, sted"
            className="text-sm min-h-[60px]"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== form.privacy_contact_address) {
                setField("privacy_contact_address", v);
                updateColumns({ privacy_contact_address: v || null }, { silent: true });
                updatePath(["contacts", "postal_address"], v, { silent: true });
              }
            }}
          />
        </div>
      </Card>
    </section>
  );
}
