import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  OPPORTUNITY_CUSTOMERS,
  distributionByFramework,
  distributionByIndustry,
  formatPotential,
  totalPotential,
  totalTaskCount,
  type OpportunityCustomer,
} from "@/lib/partnerOpportunities";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { cn } from "@/lib/utils";

type Grouping = "industry" | "framework";

const INDUSTRY_EN: Record<string, string> = {
  "Bygg og anlegg": "Construction",
  Bygg: "Construction",
  Helse: "Healthcare",
  Finans: "Finance",
  Energi: "Energy",
  Offentlig: "Public sector",
  Transport: "Transport",
  Handel: "Retail",
  Utdanning: "Education",
  Teknologi: "Technology",
  Industri: "Manufacturing",
  Media: "Media",
};

const localizeSlice = (label: string, isNb: boolean) => (isNb ? label : INDUSTRY_EN[label] ?? label);


interface Props {
  customers?: OpportunityCustomer[];
}

export function OpportunityWidget({ customers = OPPORTUNITY_CUSTOMERS }: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [grouping, setGrouping] = useState<Grouping>("industry");
  const { defaultHourlyRate, currency } = useServiceDefaults();

  const slices = useMemo(
    () =>
      grouping === "industry"
        ? distributionByIndustry(customers, defaultHourlyRate)
        : distributionByFramework(customers, defaultHourlyRate),
    [grouping, customers, defaultHourlyRate],
  );
  const taskTotal = totalTaskCount(customers);
  const potential = totalPotential(defaultHourlyRate, customers);
  const max = slices.reduce((m, s) => Math.max(m, s.potential), 0) || 1;

  if (customers.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">
          {isNb ? "Salgspotensial" : "Sales potential"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {isNb
            ? "Salgspotensial beregnes når en kunde er lagt til og har gjennomført en modenhetsvurdering. Legg til din første kunde for å komme i gang."
            : "Sales potential is calculated once a customer has been added and completed a maturity assessment. Add your first customer to get started."}
        </p>
        <Button className="mt-4" onClick={() => navigate("/msp-dashboard")}>
          {isNb ? "Legg til kunde" : "Add customer"}
        </Button>
      </Card>
    );
  }

  const groupingLabel = grouping === "industry" ? (isNb ? "bransje" : "industry") : (isNb ? "regelverk" : "framework");

  return (
    <Card className="p-4 sm:p-5 h-full max-h-[420px] flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {isNb ? "Salgspotensial" : "Sales potential"}
        </h2>
        <div
          className="inline-flex w-full sm:w-auto rounded-lg border border-border p-0.5"
          role="group"
          aria-label={isNb ? "Velg fordeling" : "Select distribution"}
        >
          {(["industry", "framework"] as Grouping[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrouping(g)}
              aria-pressed={grouping === g}
              className={cn(
                "flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                grouping === g
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g === "industry"
                ? isNb
                  ? "Per bransje"
                  : "By industry"
                : isNb
                  ? "Per regelverk"
                  : "By framework"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isNb
          ? "Inntektspotensial om du leverer alle mulige oppgaver hos kundene."
          : "Revenue potential if you deliver all possible tasks for your customers."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
          {formatPotential(potential, currency)}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
              {isNb ? "KI-generert estimat" : "AI-generated estimate"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] text-sm leading-relaxed">
            {isNb
              ? `Estimatet er utarbeidet av Lara (KI). Det bygger på timeestimat per mulig oppgave ganget med timeprisen din (${defaultHourlyRate.toLocaleString("nb-NO")} ${currency}/t) fra tjenesteinnstillinger, avrundet til nærmeste tusen. Beløpene er eks. mva og skal kvalitetssikres før du sender tilbud.`
              : `The estimate is produced by Lara (AI). It's based on the estimated hours per possible task multiplied by your hourly rate (${defaultHourlyRate.toLocaleString("nb-NO")} ${currency}/hr) from service settings, rounded to the nearest thousand. Amounts are excl. VAT and should be quality-checked before sending an offer.`}
          </PopoverContent>
        </Popover>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isNb
          ? `${taskTotal} mulige oppgaver hos ${customers.length} kunder · eks. mva`
          : `${taskTotal} possible tasks across ${customers.length} customers · excl. VAT`}
      </p>

      <div className="flex-1 min-h-0 overflow-auto mt-3 -mr-1 pr-1">
        <ul className="space-y-3 sm:space-y-2">
          {slices.map((s) => (
            <li
              key={localizeSlice(s.label, isNb)}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="min-w-0 sm:w-40 sm:shrink-0 text-sm text-foreground truncate">
                {localizeSlice(s.label, isNb)}
              </span>
              <span className="order-last sm:order-none flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((s.potential / max) * 100)}%` }}
                />
              </span>
              <span className="sm:w-52 sm:shrink-0 sm:text-right text-sm text-foreground tabular-nums">
                {formatPotential(s.potential, currency)}
                <span className="text-muted-foreground"> · {s.taskCount} {isNb ? "oppgaver" : "tasks"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="sr-only">
          {isNb ? `Fordeling per ${groupingLabel}:` : `Distribution by ${groupingLabel}:`}{" "}
          {slices
            .map((s) =>
              isNb
                ? `${localizeSlice(s.label, isNb)}: ${formatPotential(s.potential, currency)} i estimert salgspotensial fra ${s.taskCount} mulige oppgaver hos ${s.customerCount} kunder`
                : `${localizeSlice(s.label, isNb)}: ${formatPotential(s.potential, currency)} in estimated sales potential from ${s.taskCount} possible tasks across ${s.customerCount} customers`,
            )
            .join(". ")}
          .
        </p>
      </div>

      <Button className="mt-3 shrink-0" onClick={() => navigate("/msp-partner/muligheter")}>
        {isNb ? "Se alle muligheter" : "See all opportunities"}
      </Button>
    </Card>
  );
}
