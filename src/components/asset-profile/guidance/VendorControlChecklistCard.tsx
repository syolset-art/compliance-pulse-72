import { useTranslation } from "react-i18next";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChecklistValues {
  contactPerson?: string | null;
  criticality?: string | null;
  gdprRole?: string | null;
  priority?: string | number | null;
  riskLevel?: string | null;
  usagePurpose?: string | null;
  accessRoles?: string[] | null;
}

interface ChecklistItem {
  nb: string;
  en: string;
  done: boolean;
  optional?: boolean;
}

interface Props extends ChecklistValues {
  /** Åpner «Bruk og kontekst»-fanen der feltene registreres. */
  onOpen?: () => void;
  className?: string;
}

const has = (v: unknown) =>
  v !== null && v !== undefined && String(v).trim() !== "" && String(v).toLowerCase() !== "ukjent";

/** Enkel sjekkliste for å få grunnkontroll på en leverandør. */
export function VendorControlChecklistCard({
  contactPerson,
  criticality,
  gdprRole,
  priority,
  riskLevel,
  usagePurpose,
  onOpen,
  className,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const items = [
    { nb: "Kontaktperson", en: "Contact person", done: has(contactPerson) },
    { nb: "Kritikalitet", en: "Criticality", done: has(criticality) },
    { nb: "GDPR-rolle", en: "GDPR role", done: has(gdprRole) },
    { nb: "Prioritet", en: "Priority", done: has(priority) },
    { nb: "Risikonivå", en: "Risk level", done: has(riskLevel) },
    { nb: "Hva leverandøren brukes til", en: "What the vendor is used for", done: has(usagePurpose) },
  ];

  const done = items.filter((i) => i.done).length;
  const complete = done === items.length;

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5 h-full flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Kontroll på leverandøren" : "Vendor control"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {complete
              ? isNb
                ? "Alt grunnlaget er på plass."
                : "All the basics are in place."
              : isNb
                ? `${done} av ${items.length} er registrert.`
                : `${done} of ${items.length} registered.`}
          </p>
        </div>
        {!complete && onOpen && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onOpen}>
            {isNb ? "Fullfør" : "Complete"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.nb} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                item.done ? "border-success bg-success text-success-foreground" : "border-muted-foreground/40",
              )}
            >
              {item.done && <Check className="h-3 w-3" />}
            </span>
            <span className={cn("truncate", item.done ? "text-muted-foreground" : "text-foreground")}>
              {isNb ? item.nb : item.en}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
