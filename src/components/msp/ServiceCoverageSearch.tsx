import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Check, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  suggestControlPoints,
  type ControlSuggestion,
} from "@/lib/serviceMappingSuggester";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { lookupServiceDescription } from "@/lib/serviceDescriptionLookup";
import type { ServiceMapping } from "./CustomServiceDialog";
import { AiMappingDisclosure } from "./AiMappingDisclosure";

interface Props {
  existingNames: string[];
  onCreate: (payload: {
    name: string;
    suggestedDescription: string;
    mappings: ServiceMapping[];
  }) => void;
}

interface FrameworkGroup {
  frameworkId: string;
  frameworkLabel: string;
  frameworkShortName: string;
  score: number;
  items: ControlSuggestion[];
}

function keyFor(it: ControlSuggestion) {
  return `${it.frameworkId}:${it.controlId}`;
}

export function ServiceCoverageSearch({ existingNames, onCreate }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setJustAdded(false);
  }, [query]);

  const suggestions = useMemo<ControlSuggestion[]>(() => {
    if (debounced.length < 2) return [];
    return suggestControlPoints({ name: debounced });
  }, [debounced]);

  useEffect(() => {
    setSelectedKeys(new Set(suggestions.map(keyFor)));
  }, [suggestions]);

  const groups = useMemo<FrameworkGroup[]>(() => {
    const map = new Map<string, FrameworkGroup>();
    suggestions.forEach((s) => {
      const g = map.get(s.frameworkId);
      if (g) {
        g.items.push(s);
        g.score += s.score;
      } else {
        map.set(s.frameworkId, {
          frameworkId: s.frameworkId,
          frameworkLabel: s.frameworkLabel,
          frameworkShortName: s.frameworkShortName,
          score: s.score,
          items: [s],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [suggestions]);

  const isDuplicate = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return false;
    return existingNames.some((n) => n.toLowerCase() === q);
  }, [debounced, existingNames]);

  const selectedCount = selectedKeys.size;

  const toggleRow = (it: ControlSuggestion) => {
    const k = keyFor(it);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleOpenForEdit = () => {
    if (!debounced || groups.length === 0 || isDuplicate || selectedCount === 0) return;
    const selected = suggestions.filter((s) => selectedKeys.has(keyFor(s)));
    const mappings: ServiceMapping[] = selected.map((s) => ({
      frameworkId: s.frameworkId,
      frameworkShortName: s.frameworkShortName,
      controlId: s.controlId,
      controlLabel: s.controlLabel,
    }));
    const suggestedDescription = lookupServiceDescription(debounced) ?? "";
    onCreate({ name: debounced, suggestedDescription, mappings });
    setJustAdded(true);
    setQuery("");
    setDebounced("");
    setSelectedKeys(new Set());
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beskriv en tjeneste — se hvilke regelverk og krav den dekker"
            className="pl-9 h-10"
            aria-label="Søk tjeneste for å se dekning"
          />
        </div>
        {debounced.length >= 2 && groups.length > 0 && (
          <Button
            type="button"
            onClick={handleOpenForEdit}
            disabled={isDuplicate || selectedCount === 0}
            className="gap-1.5 shrink-0"
          >
            {isDuplicate ? (
              <>
                <Check className="h-4 w-4" />
                Allerede i katalogen
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Åpne og rediger
                {selectedCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 py-0 text-[10px] font-medium">
                    {selectedCount}
                  </span>
                )}
              </>
            )}
          </Button>
        )}
      </div>

      {justAdded && (
        <p className="text-xs text-success flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" /> Åpnet for redigering.
        </p>
      )}

      {debounced.length >= 2 && groups.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Ingen tydelige treff. Prøv nøkkelord som beskriver aktiviteten
          (patch, awareness, DPO, backup …).
        </p>
      )}

      {groups.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px] px-3" />
                  <TableHead className="w-[140px]">Regelverk</TableHead>
                  <TableHead className="w-[110px]">Krav</TableHead>
                  <TableHead>Kontrollpunkt
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" aria-label="Hva er et kontrollpunkt?" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Et kontrollpunkt er et spesifikt krav eller sikkerhetstiltak i regelverket som tjenesten din kan bidra til å oppfylle.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="w-[160px]">
                    <span className="inline-flex items-center gap-1">
                      Treff
                      <AiMappingDisclosure variant="icon" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {groups.flatMap((g) =>
                g.items.map((it) => {
                  const theme = getFrameworkTheme(it.frameworkId);
                  const k = keyFor(it);
                  const checked = selectedKeys.has(k);
                  return (
                    <TableRow
                      key={k}
                      className={cn(
                        !checked && "opacity-60",
                      )}
                    >
                      <TableCell className="px-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleRow(it)}
                          aria-label={`Velg ${it.controlId}`}
                        />
                      </TableCell>
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
                }),
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      )}
    </section>
  );
}
