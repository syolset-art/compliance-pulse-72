import { Checkbox } from "@/components/ui/checkbox";

export interface PartnerMandateState {
  hasMandate: boolean;
  canDocument: boolean;
  customerInformed: boolean;
}

export const EMPTY_PARTNER_MANDATE: PartnerMandateState = {
  hasMandate: false,
  canDocument: false,
  customerInformed: false,
};

export const isPartnerMandateComplete = (s: PartnerMandateState) =>
  s.hasMandate && s.canDocument && s.customerInformed;

/**
 * Bekreftelse partneren må gi før første aktivering for den enkelte sluttkunde.
 * Tre separate avkrysningspunkter, ingen forhåndsavkryssing.
 */
export function PartnerMandateChecklist({
  customerName,
  value,
  onChange,
  disabled,
  idPrefix = "partner-mandate",
}: {
  customerName: string;
  value: PartnerMandateState;
  onChange: (next: PartnerMandateState) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const items: { key: keyof PartnerMandateState; label: string }[] = [
    { key: "hasMandate", label: `Jeg har gyldig fullmakt fra ${customerName}.` },
    { key: "canDocument", label: "Jeg kan dokumentere fullmakten dersom Mynder ber om det." },
    { key: "customerInformed", label: "Sluttkunden er informert om hva som aktiveres." },
  ];

  return (
    <fieldset className="space-y-2.5 rounded-lg border border-border p-3">
      <legend className="px-1 text-xs font-medium text-foreground">
        Bekreft fullmakt for {customerName}
      </legend>
      {items.map((item) => {
        const id = `${idPrefix}-${item.key}`;
        return (
          <div key={item.key} className="flex items-start gap-2">
            <Checkbox
              id={id}
              checked={value[item.key]}
              disabled={disabled}
              onCheckedChange={(v) => onChange({ ...value, [item.key]: v === true })}
              className="mt-0.5"
            />
            <label htmlFor={id} className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
              {item.label}
            </label>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        Bekreftelsen gjelder denne sluttkunden. Du må bekrefte på nytt for andre kunder.
        Sluttkunden må selv akseptere sluttkundevilkårene før ordinær tilgang gis.
      </p>
    </fieldset>
  );
}
