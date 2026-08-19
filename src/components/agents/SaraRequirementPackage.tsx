import { BookLock, ListChecks } from "lucide-react";
import { getRegulatoryLibraryStats, getSaraRequirementPackage } from "@/lib/saraScope";

interface Props {
  isNb?: boolean;
  /** Vis kun regelverksgrunnlag-kortet (uten kravlisten) */
  compact?: boolean;
}

/**
 * Kravpakken Sara vurderer mot, vist i klartekst før tilkobling,
 * samt et rolig "Regelverksgrunnlag"-element med kun tall og status.
 */
export function SaraRequirementPackage({ isNb = true, compact = false }: Props) {
  const reqs = getSaraRequirementPackage(isNb);
  const stats = getRegulatoryLibraryStats();

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              {isNb ? "Dette vurderer Sara" : "What Sara assesses"}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isNb
              ? "Før du fullfører tilkoblingen ser du hvilke krav Sara vurderer, og hva som teller som oppfyllelse."
              : "Before you complete the connection, you see which requirements Sara assesses and what counts as fulfilment."}
          </p>

          <ul className="mt-3 space-y-2">
            {reqs.map((r) => (
              <li key={r.id} className="rounded-md border border-border bg-muted/30 p-2.5">
                <p className="text-[13px] font-medium text-foreground">{r.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.id}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{r.fulfillment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-primary/[0.03] p-3">
        <div className="flex items-center gap-1.5">
          <BookLock className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            {isNb ? "Regelverksgrunnlag" : "Regulatory basis"}
          </p>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {isNb
            ? `Sara vurderer mot ${stats.requirementCount} krav fra ${stats.frameworkCount} regelverk · sist oppdatert ${stats.lastUpdated}`
            : `Sara assesses against ${stats.requirementCount} requirements from ${stats.frameworkCount} frameworks · last updated ${stats.lastUpdated}`}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {isNb
            ? "Kravene kommer fra et regelverksbibliotek Mynder forvalter og kvalitetssikrer løpende."
            : "Requirements come from a regulatory library Mynder maintains and quality-assures continuously."}
        </p>
      </div>
    </div>
  );
}
