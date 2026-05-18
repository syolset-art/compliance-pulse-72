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

      {/* Grid — samme kortdesign som katalogen, med valg-checkbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s) => {
          const isSelected = selected.has(s.id);
          const isEditing = editing === s.id;
          const isTop = s.id === topId && totalControlCount(s.frameworkMappings) > 0;

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
            <div key={s.id} className="relative">
              {isTop && (
                <span className="absolute -top-2 left-3 z-10 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-primary text-primary-foreground shadow-sm">
                  <Award className="h-2.5 w-2.5" />
                  Mest dekning
                </span>
              )}
              <ServiceCard
                service={s}
                onEdit={() => setEditing(s.id)}
                onTogglePublished={(checked) => togglePublished(s.id, checked)}
                selectable={{
                  selected: isSelected,
                  onToggleSelect: () => toggle(s.id),
                  onRemove: () => removeSuggestion(s.id),
                }}
              />
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
