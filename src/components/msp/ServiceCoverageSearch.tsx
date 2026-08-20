import { useMemo, useState, useEffect, useCallback } from "react";
import { Search, Plus, Check, Info, Scale, Package, ArrowRight, GripVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import {
  detectSearchKind,
  matchFramework,
  matchProduct,
  frameworkPotential,
  annualPrice,
  type SearchKind,
} from "@/lib/serviceSearchMatch";
import type { ServiceMapping } from "./CustomServiceDialog";
import { AiMappingDisclosure } from "./AiMappingDisclosure";

interface Props {
  existingNames: string[];
  onCreate: (payload: {
    name: string;
    suggestedDescription: string;
    mappings: ServiceMapping[];
  }) => void;
  onOpenFramework?: (frameworkId: string) => void;
  onAddProductToOffer?: (productId: string) => void;
}

const MODES: Array<{ id: SearchKind; label: string }> = [
  { id: "service", label: "Tjeneste/oppgave" },
  { id: "framework", label: "Regelverk" },
  { id: "product", label: "Mynder-produkt" },
];


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

export function ServiceCoverageSearch({
  existingNames,
  onCreate,
  onOpenFramework,
  onAddProductToOffer,
}: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [modeOverride, setModeOverride] = useState<SearchKind | null>(null);
  const { defaultHourlyRate, currency } = useServiceDefaults();

  const { data: reqRows = [] } = useQuery({
    queryKey: ["all-compliance-requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_requirements")
        .select("framework_id, requirement_id, name_no, category");
      if (error) return [] as Array<{ framework_id: string }>;
      return (data ?? []) as unknown as Array<{ framework_id: string }>;
    },
  });

  const detected = useMemo<SearchKind>(
    () => (debounced.length >= 2 ? detectSearchKind(debounced) : "service"),
    [debounced],
  );
  const mode = modeOverride ?? detected;
  const framework = useMemo(() => matchFramework(debounced), [debounced]);
  const product = useMemo(() => matchProduct(debounced), [debounced]);

  const fmt = (n: number) =>
    `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(Math.round(n))} ${currency}`;


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
    if (suggestions.length > 0) {
      setSelectedKey(keyFor(suggestions[0]));
    } else {
      setSelectedKey(null);
    }
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

  const selectedCount = selectedKey ? 1 : 0;

  const handleOpenForEdit = () => {
    if (!debounced || groups.length === 0 || isDuplicate || selectedCount === 0) return;
    const selected = suggestions.find((s) => selectedKey === keyFor(s));
    if (!selected) return;
    const mappings: ServiceMapping[] = [{
      frameworkId: selected.frameworkId,
      frameworkShortName: selected.frameworkShortName,
      controlId: selected.controlId,
      controlLabel: selected.controlLabel,
    }];
    const suggestedDescription = lookupServiceDescription(debounced) ?? "";
    onCreate({ name: debounced, suggestedDescription, mappings });
    setJustAdded(true);
    setQuery("");
    setDebounced("");
    setSelectedKey(null);
  };

  const requirementCount = framework
    ? reqRows.filter((r) => r.framework_id === framework.id).length
    : 0;
  const potential = frameworkPotential(requirementCount, defaultHourlyRate);

  return (
    <section className="space-y-3">
      <div
        className="inline-flex rounded-lg border border-border p-0.5"
        role="group"
        aria-label="Hva søker du etter?"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModeOverride(m.id)}
            aria-pressed={mode === m.id}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setModeOverride(null);
            }}
            placeholder="Skriv en tjeneste, oppgave, et regelverk (GDPR) eller et Mynder-produkt"
            className="pl-9 h-10"
            aria-label="Søk tjeneste, regelverk eller produkt"
          />
        </div>
        {mode === "service" && debounced.length >= 2 && groups.length > 0 && (
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

      {mode === "framework" && framework && (
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2.5">
              <Scale className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{framework.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {requirementCount} krav · foreslåtte timer {potential.hours} t (1 time per krav)
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Timene er et utgangspunkt — du kan justere timer per oppgave når du oppretter
                  tilbudet.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-muted-foreground">Salgspotensial</p>
              <p className="text-xl font-semibold text-foreground tabular-nums">
                {fmt(potential.amount)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {defaultHourlyRate.toLocaleString("nb-NO")} {currency}/t · eks. mva
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onOpenFramework?.(framework.id)}
              className="gap-1.5"
            >
              Åpne oppgavepakke
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpenFramework?.(framework.id)}>
              Bruk i tilbud
            </Button>
          </div>
        </Card>
      )}

      {mode === "product" && product && (
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2.5">
              <Package className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fra {fmt(product.fromPrice)}/mnd · din provisjon {product.commissionPct} %
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {product.tiers.map((t) => (
                    <Badge key={t.label} variant="secondary" className="text-[10px] font-normal">
                      {t.label}: {t.isFree ? "Gratis" : `${fmt(t.priceKr)}/mnd`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 max-w-xl">
                  Du kan lage et tilbud der produktet kombineres med rådgivningstimer, eller
                  aktivere det direkte på utvalgte kunder — aktivering gjøres inne på hvert
                  kundekort.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-muted-foreground">Årspris fra</p>
              <p className="text-xl font-semibold text-foreground tabular-nums">
                {fmt(annualPrice(product.fromPrice))}
              </p>
              <p className="text-[11px] text-muted-foreground">eks. mva</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={() => onAddProductToOffer?.(product.id)} className="gap-1.5">
              Legg i tilbud
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/msp-dashboard">Aktiver på kunde</a>
            </Button>
          </div>
        </Card>
      )}

      {mode === "service" && debounced.length >= 2 && groups.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Ingen tydelige treff. Prøv nøkkelord som beskriver aktiviteten
          (patch, awareness, DPO, backup …).
        </p>
      )}


      {mode === "service" && groups.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <RadioGroup value={selectedKey ?? ""} onValueChange={setSelectedKey}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px] px-3" />
                    <TableHead className="w-[140px]">Regelverk</TableHead>
                    <TableHead className="w-[110px]">
                      <span className="inline-flex items-center gap-1">
                        Krav (art. 20)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline h-3.5 w-3.5 text-muted-foreground cursor-help" aria-label="Hva vises i tabellen?" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Foreslåtte regelverk, krav, aktiviteter og kontrollområder de er tilknyttet.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Kontrollområde
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline h-3.5 w-3.5 text-muted-foreground cursor-help" aria-label="Hva er et kontrollområde?" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Et kontrollområde samler aktiviteter som bidrar til å oppfylle relevante krav. Mynder bruker fem kontrollområder: styring, drift og sikkerhet, identitet og tilgang, personvern og datahåndtering samt tredjepart og verdikjede.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
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
                      const checked = selectedKey === k;
                      return (
                        <TableRow
                          key={k}
                          className={cn(
                            !checked && "opacity-60",
                          )}
                        >
                          <TableCell className="px-3">
                            <RadioGroupItem value={k} aria-label={`Velg ${it.controlId}`} />
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
                    })
                  )}
                </TableBody>
              </Table>
            </RadioGroup>
          </div>
        </div>
      )}
    </section>
  );
}
