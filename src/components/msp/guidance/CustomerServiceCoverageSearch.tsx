import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { suggestControlPoints, type ControlSuggestion } from "@/lib/serviceMappingSuggester";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { AiMappingDisclosure } from "@/components/msp/AiMappingDisclosure";

interface Props {
  /** Frameworks relevant for this customer (recommended + confirmed + active). */
  customerFrameworkIds: string[];
}

/**
 * Slimmed service-search used in the guidance tab. Only shows hits that
 * match at least one of the customer's own recommended/active frameworks.
 * Read-only — does not create catalog entries.
 */
export function CustomerServiceCoverageSearch({ customerFrameworkIds }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const customerSet = useMemo(
    () => new Set(customerFrameworkIds.filter(Boolean)),
    [customerFrameworkIds],
  );

  const all = useMemo<ControlSuggestion[]>(() => {
    if (debounced.length < 2) return [];
    return suggestControlPoints({ name: debounced });
  }, [debounced]);

  const relevant = useMemo(
    () => all.filter((s) => customerSet.has(s.frameworkId)),
    [all, customerSet],
  );

  const otherFrameworks = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string }[] = [];
    for (const s of all) {
      if (customerSet.has(s.frameworkId)) continue;
      if (seen.has(s.frameworkId)) continue;
      seen.add(s.frameworkId);
      out.push({ id: s.frameworkId, label: s.frameworkShortName });
    }
    return out;
  }, [all, customerSet]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Sjekk en tjeneste mot kundens regelverk
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Skriv inn en tjeneste og se om den treffer noen av regelverkene som er anbefalt for denne kunden.
          </p>
        </div>
        <AiMappingDisclosure variant="icon" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="F.eks. pentest, awareness, backup, DPO…"
          className="pl-9 h-10"
          aria-label="Søk tjeneste for å se dekning mot kundens regelverk"
        />
      </div>

      {debounced.length >= 2 && relevant.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          {all.length === 0 ? (
            <>Ingen tydelige treff. Prøv nøkkelord som beskriver aktiviteten.</>
          ) : (
            <>
              Ingen treff mot kundens regelverk.{" "}
              {otherFrameworks.length > 0 && (
                <>
                  Tjenesten ser ellers ut til å dekke{" "}
                  <span className="text-foreground/80 font-medium">
                    {otherFrameworks.map((f) => f.label).join(", ")}
                  </span>
                  .
                </>
              )}
            </>
          )}
        </div>
      )}

      {relevant.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Regelverk</TableHead>
                <TableHead className="w-[110px]">Krav</TableHead>
                <TableHead>Kontrollpunkt</TableHead>
                <TableHead className="w-[160px]">
                  <span className="inline-flex items-center gap-1">
                    Treff
                    <Sparkles className="h-3 w-3 text-primary" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relevant.map((it) => {
                const theme = getFrameworkTheme(it.frameworkId);
                return (
                  <TableRow key={`${it.frameworkId}:${it.controlId}`}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          theme.chip,
                        )}
                      >
                        {it.frameworkShortName}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground/90">
                      {it.controlId}
                    </TableCell>
                    <TableCell className="text-foreground/80">
                      {it.controlLabel}
                    </TableCell>
                    <TableCell>
                      {it.matchedTerms.length > 0 ? (
                        <span className="inline-flex flex-wrap gap-1">
                          {it.matchedTerms.map((term) => (
                            <span
                              key={term}
                              className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {term}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
