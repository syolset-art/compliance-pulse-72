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
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Salgspotensial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inntektspotensial om du leverer alle mulige oppgaver hos kundene.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Velg fordeling">
          {(["industry", "framework"] as Grouping[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrouping(g)}
              aria-pressed={grouping === g}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="text-2xl font-bold text-foreground tabular-nums">
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
          <PopoverContent className="w-80 text-sm leading-relaxed">
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

      <ul className="mt-4 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-sm text-foreground">{s.label}</span>
            <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.round((s.potential / max) * 100)}%` }}
              />
            </span>
            <span className="w-52 shrink-0 text-right text-sm text-foreground tabular-nums">
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

      <Button className="mt-4" onClick={() => navigate("/msp-partner/muligheter")}>
        Se alle muligheter
      </Button>
    </Card>
  );
}
