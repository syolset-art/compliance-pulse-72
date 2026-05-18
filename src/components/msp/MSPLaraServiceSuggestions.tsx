import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Shield,
  X,
  ArrowDown,
  Award,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ServiceEvidenceSection,
  totalControlCount,
  primaryFrameworkId,
} from "./ServiceEvidenceSection";
import { ServiceForm } from "./ServiceForm";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import type { PartnerService } from "@/lib/serviceCatalog";

interface Props {
  suggestions: PartnerService[];
  onChangeSuggestions: (next: PartnerService[]) => void;
  onImport: (services: PartnerService[]) => void;
  onDismiss: () => void;
}

export function MSPLaraServiceSuggestions({
  suggestions,
  onChangeSuggestions,
  onImport,
  onDismiss,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.id)),
  );
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(suggestions.map((s) => s.id)));

  const updateSuggestion = (id: string, updated: PartnerService) => {
    onChangeSuggestions(suggestions.map((s) => (s.id === id ? { ...updated, id: s.id } : s)));
    setEditing(null);
  };

  const removeSuggestion = (id: string) => {
    onChangeSuggestions(suggestions.filter((s) => s.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const togglePublished = (id: string, value: boolean) => {
    onChangeSuggestions(
      suggestions.map((s) => (s.id === id ? { ...s, publishedToCustomers: value } : s)),
    );
  };

  const frameworkFilters = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    suggestions.forEach((s) =>
      s.frameworkMappings.forEach((m) => {
        const prev = map.get(m.frameworkId);
        if (prev) prev.count += 1;
        else map.set(m.frameworkId, { id: m.frameworkId, label: m.frameworkLabel, count: 1 });
      }),
    );
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [suggestions]);

  const filtered = useMemo(() => {
    if (filter === "all") return suggestions;
    return suggestions.filter((s) =>
      s.frameworkMappings.some((m) => m.frameworkId === filter),
    );
  }, [suggestions, filter]);

  const topId = useMemo(() => {
    if (suggestions.length === 0) return null;
    return [...suggestions].sort(
      (a, b) => totalControlCount(b.frameworkMappings) - totalControlCount(a.frameworkMappings),
    )[0].id;
  }, [suggestions]);

  const selectedControlCount = useMemo(() => {
    const ids = new Set<string>();
    suggestions
      .filter((s) => selected.has(s.id))
      .forEach((s) =>
        s.frameworkMappings.forEach((m) =>
          m.controlIds.forEach((c) => ids.add(`${m.frameworkId}:${c}`)),
        ),
      );
    return ids.size;
  }, [suggestions, selected]);

  const handleImport = () => {
    const chosen = suggestions
      .filter((s) => selected.has(s.id))
      .map((s) => ({ ...s, id: `svc-${Date.now()}-${s.id}` }));
    onImport(chosen);
  };

  return (
    <div className="space-y-3">
      {/* Lara mini-banner med velg-alle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Basert på din kundeportefølje og kontrollpunkter du mangler dekning på.
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={selectAll}>
          Velg alle
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">Filter:</span>
        <FilterChip
          label="Alle"
          count={suggestions.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {frameworkFilters.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            count={f.count}
            frameworkId={f.id}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s) => {
          const isSelected = selected.has(s.id);
          const isEditing = editing === s.id;
          const isTop = s.id === topId && totalControlCount(s.frameworkMappings) > 0;
          const primaryId = primaryFrameworkId(s.frameworkMappings);
          const theme = primaryId ? getFrameworkTheme(primaryId) : null;
          const controls = totalControlCount(s.frameworkMappings);

          if (isEditing) {
            return (
              <div key={s.id} className="md:col-span-2">
                <ServiceForm
                  initial={s}
                  onCancel={() => setEditing(null)}
                  onSave={(updated) => updateSuggestion(s.id, updated)}
                />
              </div>
            );
          }

          return (
            <div
              key={s.id}
              className={cn(
                "rounded-lg bg-card border transition-all p-3 border-l-4",
                theme ? theme.border : "border-l-muted",
                isSelected
                  ? "border-border ring-1 ring-primary/30"
                  : "border-border opacity-70 hover:opacity-100",
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="shrink-0 pt-0.5"
                  aria-label={isSelected ? "Fjern fra import" : "Velg for import"}
                >
                  <Checkbox checked={isSelected} tabIndex={-1} />
                </button>
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    theme ? theme.iconBg : "bg-muted",
                  )}
                >
                  <Shield className={cn("h-4 w-4", theme ? theme.iconColor : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{s.name}</span>
                        {isTop && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/25">
                            <Award className="h-2.5 w-2.5" />
                            Mest dekning
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.defaultChecklist.length} leveransepunkter
                        {controls > 0 && <> · {controls} kontrollpunkter</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <label
                        className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1.5 py-1 cursor-pointer hover:bg-muted/60 transition-colors"
                        title={
                          s.publishedToCustomers
                            ? "Vil være synlig for kunden ved import"
                            : "Vil være skjult etter import"
                        }
                      >
                        {s.publishedToCustomers ? (
                          <Eye className="h-3 w-3 text-primary" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                        <Switch
                          checked={!!s.publishedToCustomers}
                          onCheckedChange={(checked) => togglePublished(s.id, checked)}
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditing(s.id)}
                        title="Rediger forslag"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSuggestion(s.id)}
                        title="Fjern forslag"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug line-clamp-2">
                    {s.description}
                  </p>
                  <ServiceEvidenceSection mappings={s.frameworkMappings} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom action bar */}
      <Card className="sticky bottom-3 z-10 p-3 border-border bg-card/95 backdrop-blur shadow-md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[13px] text-foreground">
            <span className="font-medium">
              {selected.size} av {suggestions.length} tjenester valgt
            </span>
            {selectedControlCount > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  vil dekke <span className="font-semibold text-primary">{selectedControlCount} nye kontrollpunkter</span>
                </span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <ArrowDown className="h-3 w-3 text-primary" />
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={onDismiss}>
              <Trash2 className="h-3.5 w-3.5" />
              Forkast
            </Button>
            <Button size="sm" onClick={handleImport} disabled={selected.size === 0}>
              Importer {selected.size} tjenester til katalog
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FilterChip({
  label,
  count,
  frameworkId,
  active,
  onClick,
}: {
  label: string;
  count: number;
  frameworkId?: string;
  active: boolean;
  onClick: () => void;
}) {
  const theme = frameworkId ? getFrameworkTheme(frameworkId) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : theme
            ? cn(theme.chip, "hover:opacity-80")
            : "bg-background text-foreground/70 border-border hover:bg-muted",
      )}
    >
      <span>{label}</span>
      <span className={cn("opacity-70", active && "opacity-90")}>· {count}</span>
    </button>
  );
}
