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
  accessRoles,
  onOpen,
  className,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const items: ChecklistItem[] = [
    { nb: "Kontaktperson", en: "Contact person", done: has(contactPerson) },
    { nb: "Kritikalitet", en: "Criticality", done: has(criticality) },
    { nb: "GDPR-rolle", en: "GDPR role", done: has(gdprRole) },
    { nb: "Prioritet", en: "Priority", done: has(priority) },
    { nb: "Risikonivå", en: "Risk level", done: has(riskLevel) },
    { nb: "Hva leverandøren brukes til", en: "What the vendor is used for", done: has(usagePurpose) },
    { nb: "Tilgang og roller", en: "Access and roles", done: Array.isArray(accessRoles) && accessRoles.length > 0, optional: true },
  ];

  const requiredItems = items.filter((i) => !i.optional);
  const done = requiredItems.filter((i) => i.done).length;
  const complete = done === requiredItems.length;
  const optionalItems = items.filter((i) => i.optional);

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5 h-full flex flex-col", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
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
                ? `${done} av ${requiredItems.length} er registrert.`
                : `${done} of ${requiredItems.length} registered.`}
          </p>
        </div>
        {!complete && onOpen && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full gap-1.5 text-xs sm:w-auto sm:shrink-0"
            onClick={onOpen}
          >
            {isNb ? "Fullfør" : "Complete"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ul className="mt-3 grid gap-1.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
        {requiredItems.map((item) => (
          <li key={item.nb} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                item.done ? "border-success bg-success text-success-foreground" : "border-muted-foreground/40",
              )}
            >
              {item.done && <Check className="h-3 w-3" />}
            </span>
            <span className={cn("min-w-0 break-words", item.done ? "text-muted-foreground" : "text-foreground")}>
              {isNb ? item.nb : item.en}
            </span>
          </li>
        ))}
      </ul>

      {optionalItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {isNb ? "Valgfritt" : "Optional"}
          </p>
          <ul className="grid gap-1.5 grid-cols-1 sm:grid-cols-2">
            {optionalItems.map((item) => (
              <li key={item.nb} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    item.done ? "border-success bg-success text-success-foreground" : "border-muted-foreground/40",
                  )}
                >
                  {item.done && <Check className="h-3 w-3" />}
                </span>
                <span className={cn("min-w-0 break-words", item.done ? "text-muted-foreground" : "text-foreground")}>
                  {isNb ? item.nb : item.en}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
