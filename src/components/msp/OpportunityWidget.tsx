import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Props {
  customers?: OpportunityCustomer[];
}

export function OpportunityWidget({ customers = OPPORTUNITY_CUSTOMERS }: Props) {
  const navigate = useNavigate();
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
        <h2 className="text-base font-semibold text-foreground">Salgspotensial</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Salgspotensial beregnes når en kunde er lagt til og har gjennomført en
          modenhetsvurdering. Legg til din første kunde for å komme i gang.
        </p>
        <Button className="mt-4" onClick={() => navigate("/msp-dashboard")}>
          Legg til kunde
        </Button>
      </Card>
    );
  }

  const groupingLabel = grouping === "industry" ? "bransje" : "regelverk";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-base font-semibold text-foreground">Salgspotensial</h2>
        <div
          className="inline-flex w-full sm:w-auto rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Velg fordeling"
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
              {g === "industry" ? "Per bransje" : "Per regelverk"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Inntektspotensial om du leverer alle mulige oppgaver hos kundene.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">

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
              KI-generert estimat
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] text-sm leading-relaxed">
            Estimatet er utarbeidet av Lara (KI). Det bygger på timeestimat per mulig oppgave
            ganget med timeprisen din ({defaultHourlyRate.toLocaleString("nb-NO")} {currency}/t)
            fra tjenesteinnstillinger, avrundet til nærmeste tusen. Beløpene er eks. mva og
            skal kvalitetssikres før du sender tilbud.
          </PopoverContent>
        </Popover>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {taskTotal} mulige oppgaver hos {customers.length} kunder · eks. mva
      </p>

      <ul className="mt-4 space-y-3 sm:space-y-2">
        {slices.map((s) => (
          <li
            key={s.label}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="min-w-0 sm:w-40 sm:shrink-0 text-sm text-foreground truncate">
              {s.label}
            </span>
            <span className="order-last sm:order-none flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.round((s.potential / max) * 100)}%` }}
              />
            </span>
            <span className="sm:w-52 sm:shrink-0 sm:text-right text-sm text-foreground tabular-nums">
              {formatPotential(s.potential, currency)}
              <span className="text-muted-foreground"> · {s.taskCount} oppgaver</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only">
        Fordeling per {groupingLabel}:{" "}
        {slices
          .map(
            (s) =>
              `${s.label}: ${formatPotential(s.potential, currency)} i estimert salgspotensial fra ${s.taskCount} mulige oppgaver hos ${s.customerCount} kunder`,
          )
          .join(". ")}
        .
      </p>

      <Button className="mt-4 w-full sm:w-auto" onClick={() => navigate("/msp-partner/muligheter")}>
        Se alle muligheter
      </Button>
    </Card>
  );
}
