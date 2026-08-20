import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Circle, CheckCircle2, MinusCircle, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";

export interface GapRequirementItem {
  requirement_id: string;
  name: string;
  status: "implemented" | "partial" | "missing" | "not_relevant";
  rationale?: string;
  next_action?: string;
  evidence?: string[];
}

interface GapRequirementsViewProps {
  frameworkId: string;
  items: GapRequirementItem[];
  vendorName: string;
}

type Bucket = "not_met" | "partial" | "met";
type FilterKey = "all" | Bucket;

function bucketOf(status: GapRequirementItem["status"]): Bucket | null {
  if (status === "implemented") return "met";
  if (status === "partial") return "partial";
  if (status === "missing") return "not_met";
  return null;
}

export function GapRequirementsView({ frameworkId, items, vendorName }: GapRequirementsViewProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<Bucket>>(new Set());

  const catalogue = useMemo(() => {
    const map = new Map<string, { description: string }>();
    for (const r of getRequirementsByFramework(frameworkId)) {
      map.set(r.requirement_id, { description: isNb ? r.description_no : (r as any).description_en || r.description_no });
    }
    return map;
  }, [frameworkId, isNb]);

  const counts = useMemo(() => {
    let met = 0, partial = 0, notMet = 0;
    for (const i of items) {
      const b = bucketOf(i.status);
      if (b === "met") met++;
      else if (b === "partial") partial++;
      else if (b === "not_met") notMet++;
    }
    return { met, partial, notMet, total: met + partial + notMet };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const b = bucketOf(i.status);
      if (!b) return false;
      if (filter !== "all" && b !== filter) return false;
      if (q && !`${i.requirement_id} ${i.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, search]);

  const groups: { key: Bucket; label: string; tone: string; items: GapRequirementItem[] }[] = [
    { key: "not_met", label: isNb ? "IKKE OPPFYLT" : "NOT MET", tone: "text-destructive", items: filtered.filter((i) => bucketOf(i.status) === "not_met") },
    { key: "partial", label: isNb ? "DELVIS OPPFYLT" : "PARTIALLY MET", tone: "text-warning", items: filtered.filter((i) => bucketOf(i.status) === "partial") },
    { key: "met", label: isNb ? "OPPFYLT" : "MET", tone: "text-success", items: filtered.filter((i) => bucketOf(i.status) === "met") },
  ];

  const pills: { key: FilterKey; label: string; count: number }[] = [
    { key: "not_met", label: isNb ? "Mangler" : "Missing", count: counts.notMet },
    { key: "partial", label: isNb ? "Delvis" : "Partial", count: counts.partial },
    { key: "met", label: isNb ? "Oppfylt" : "Met", count: counts.met },
    { key: "all", label: isNb ? "Alle" : "All", count: counts.total },
  ];

  const toggleGroup = (key: Bucket) =>
    setCollapsedGroups((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const statusIcon = (b: Bucket) => {
    if (b === "met") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (b === "partial") return <MinusCircle className="h-4 w-4 text-warning" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const statusPill = (b: Bucket) => {
    if (b === "met") return { label: isNb ? "Oppfylt" : "Met", cls: "text-success border-success/30 bg-success/5" };
    if (b === "partial") return { label: isNb ? "Delvis" : "Partial", cls: "text-warning border-warning/30 bg-warning/5" };
    return { label: isNb ? "Ikke oppfylt" : "Not met", cls: "text-destructive border-destructive/30 bg-destructive/5" };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold mr-1">
          {isNb ? "Krav" : "Requirements"}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {counts.total} {isNb ? "krav" : "requirements"} · {counts.met} {isNb ? "oppfylt" : "met"}
          </span>
        </h3>
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              filter === p.key
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:bg-muted/50",
            )}
          >
            {p.label} <span className="tabular-nums opacity-70">{p.count}</span>
          </button>
        ))}
        <div className="relative ml-auto min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-8"
            placeholder={isNb ? "Søk i krav..." : "Search requirements..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {counts.total === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {isNb ? `Ingen kravresultater for ${vendorName} ennå.` : `No requirement results for ${vendorName} yet.`}
          </CardContent>
        </Card>
      )}

      {groups.filter((g) => g.items.length > 0).map((g) => {
        const collapsed = collapsedGroups.has(g.key);
        return (
          <div key={g.key} className="space-y-2">
            <button
              onClick={() => toggleGroup(g.key)}
              className="flex w-full items-center gap-3 px-1 text-left"
            >
              <span className={cn("text-[12px] font-semibold tracking-wider", g.tone)}>{g.label}</span>
              <span className="text-[12px] text-muted-foreground tabular-nums">({g.items.length})</span>
              <div className="flex-1 h-px bg-border" />
              {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
            </button>

            {!collapsed && g.items.map((item) => {
              const b = bucketOf(item.status)!;
              const pill = statusPill(b);
              const open = expandedId === item.requirement_id;
              const description = catalogue.get(item.requirement_id)?.description;
              const docs = item.evidence ?? [];
              return (
                <Card key={item.requirement_id} className="overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(open ? null : item.requirement_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0">{statusIcon(b)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold leading-snug">{item.name}</span>
                            {docs.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                {docs.length}
                              </span>
                            )}
                          </div>
                          {!open && (description || item.rationale) && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {description || item.rationale}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={cn("h-6 px-2 text-[12px]", pill.cls)}>
                            {pill.label}
                          </Badge>
                          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {open && (
                    <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
                      <div className="text-[12px] font-mono text-muted-foreground">{item.requirement_id}</div>
                      {description && <p className="text-sm leading-relaxed">{description}</p>}
                      {item.rationale && (
                        <div>
                          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {isNb ? "Laras vurdering" : "Lara's assessment"}
                          </p>
                          <p className="text-sm mt-1 leading-relaxed">{item.rationale}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {isNb ? "Dokumentasjon" : "Documentation"}
                        </p>
                        {docs.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {docs.map((d, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-sm">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-destructive mt-1">{isNb ? "Ingen dokumentasjon mottatt" : "No documentation received"}</p>
                        )}
                      </div>
                      {item.next_action && (
                        <div>
                          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {isNb ? "Neste steg" : "Next step"}
                          </p>
                          <p className="text-sm mt-1 leading-relaxed">{item.next_action}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
