import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  OPPORTUNITY_CUSTOMERS,
  distributionByFramework,
  distributionByIndustry,
  totalTaskCount,
  type OpportunityCustomer,
} from "@/lib/partnerOpportunities";
import { cn } from "@/lib/utils";

type Grouping = "industry" | "framework";

interface Props {
  customers?: OpportunityCustomer[];
}

export function OpportunityWidget({ customers = OPPORTUNITY_CUSTOMERS }: Props) {
  const navigate = useNavigate();
  const [grouping, setGrouping] = useState<Grouping>("industry");

  const slices = useMemo(
    () => (grouping === "industry" ? distributionByIndustry(customers) : distributionByFramework(customers)),
    [grouping, customers],
  );
  const taskTotal = totalTaskCount(customers);
  const max = slices.reduce((m, s) => Math.max(m, s.taskCount), 0) || 1;

  if (customers.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">Mulige oppgaver hos kundene</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Her viser vi arbeid du kan tilby kundene dine. Vi finner mulige oppgaver når en
          kunde er lagt til og har en gjennomført modenhetsvurdering. Legg til din første
          kunde for å komme i gang.
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
          <h2 className="text-base font-semibold text-foreground">Mulige oppgaver hos kundene</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Arbeid du kan tilby nå, basert på det kundene har svart ut.
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

      <p className="mt-4 text-2xl font-bold text-foreground">
        {taskTotal} mulige oppgaver hos {customers.length} kunder
      </p>

      <ul className="mt-4 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-sm text-foreground">{s.label}</span>
            <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.round((s.taskCount / max) * 100)}%` }}
              />
            </span>
            <span className="w-44 shrink-0 text-right text-sm text-foreground tabular-nums">
              {s.taskCount} oppgaver · {s.customerCount} kunder
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only">
        Fordeling per {groupingLabel}:{" "}
        {slices.map((s) => `${s.label}: ${s.taskCount} mulige oppgaver hos ${s.customerCount} kunder`).join(". ")}.
      </p>

      <Button className="mt-4" onClick={() => navigate("/msp-partner/muligheter")}>
        Se alle muligheter
      </Button>
    </Card>
  );
}
