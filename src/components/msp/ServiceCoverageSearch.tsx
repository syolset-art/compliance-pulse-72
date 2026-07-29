import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Sparkles, Check, Pencil, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  suggestControlPoints,
  type ControlSuggestion,
} from "@/lib/serviceMappingSuggester";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { lookupServiceDescription } from "@/lib/serviceDescriptionLookup";
import type { ServiceMapping } from "./CustomServiceDialog";

interface Props {
  existingNames: string[];
  onAdd: (payload: {
    name: string;
    description: string;
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

export function ServiceCoverageSearch({ existingNames, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [descOverride, setDescOverride] = useState<string | null>(null);
  const [descEditing, setDescEditing] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setJustAdded(false);
    setDescOverride(null);
    setDescEditing(false);
  }, [query]);

  const suggestions = useMemo<ControlSuggestion[]>(() => {
    if (debounced.length < 2) return [];
    return suggestControlPoints({ name: debounced });
  }, [debounced]);

  const suggestedDescription = useMemo(
    () => (debounced.length >= 2 ? lookupServiceDescription(debounced) : undefined),
    [debounced],
  );

  const currentDescription = descOverride ?? suggestedDescription ?? "";
  const isOverridden = descOverride !== null && descOverride !== suggestedDescription;

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

  const topFrameworkId = groups[0]?.frameworkId;

  const handleAdd = () => {
    if (!debounced || groups.length === 0 || isDuplicate) return;
    const mappings: ServiceMapping[] = suggestions.map((s) => ({
      frameworkId: s.frameworkId,
      frameworkShortName: s.frameworkShortName,
      controlId: s.controlId,
      controlLabel: s.controlLabel,
    }));
    onAdd({ name: debounced, description: currentDescription.trim(), mappings });
    setJustAdded(true);
    setQuery("");
    setDebounced("");
    setDescOverride(null);
    setDescEditing(false);
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
            onClick={handleAdd}
            disabled={isDuplicate}
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
                Opprett
              </>
            )}
          </Button>
        )}
      </div>

      {justAdded && (
        <p className="text-xs text-success flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" /> Lagt til i katalogen.
        </p>
      )}

      {debounced.length >= 2 && groups.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Ingen tydelige treff. Prøv nøkkelord som beskriver aktiviteten
          (patch, awareness, DPO, backup …).
        </p>
      )}

      {debounced.length >= 2 && (suggestedDescription || descEditing) && (
        <div className="rounded-md border border-border bg-card px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {suggestedDescription && !isOverridden ? (
                <>
                  <Sparkles className="h-3 w-3 text-primary" />
                  Foreslått beskrivelse
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3" />
                  Egen beskrivelse
                </>
              )}
            </span>
            <div className="flex items-center gap-1">
              {isOverridden && suggestedDescription && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => {
                    setDescOverride(null);
                    setDescEditing(false);
                  }}
                >
                  <RotateCcw className="h-3 w-3" /> Tilbakestill
                </Button>
              )}
              {!descEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={() => setDescEditing(true)}
                >
                  <Pencil className="h-3 w-3" /> Rediger
                </Button>
              )}
            </div>
          </div>
          {descEditing ? (
            <Textarea
              value={currentDescription}
              onChange={(e) => setDescOverride(e.target.value)}
              onBlur={() => setDescEditing(false)}
              rows={3}
              className="text-sm resize-none"
              placeholder="Beskriv tjenesten kort — hva leveres og hvordan?"
              autoFocus
            />
          ) : (
            <p className="text-sm text-foreground/85 leading-relaxed">
              {currentDescription}
            </p>
          )}
        </div>
      )}

      {groups.length > 0 && (
        <div className="rounded-md border border-border bg-card divide-y divide-border">
          {groups.map((g) => {
            const theme = getFrameworkTheme(g.frameworkId);
            const isTop = g.frameworkId === topFrameworkId;
            return (
              <div
                key={g.frameworkId}
                className={cn(
                  "px-3 py-2.5 space-y-1.5",
                  isTop && "ring-1 ring-inset ring-primary/30 bg-primary/5",
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      theme.chip,
                    )}
                  >
                    {g.frameworkShortName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.items.length} {g.items.length === 1 ? "krav" : "krav"}
                  </span>
                  {isTop && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                      <Sparkles className="h-3 w-3" /> Best treff
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <span
                      key={`${it.frameworkId}:${it.controlId}`}
                      title={
                        it.matchedTerms.length > 0
                          ? `Traff: ${it.matchedTerms.join(", ")}`
                          : undefined
                      }
                      className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground/80"
                    >
                      <span className="font-medium">{it.controlId}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="truncate max-w-[220px]">
                        {it.controlLabel}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
