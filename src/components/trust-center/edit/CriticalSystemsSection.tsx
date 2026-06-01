import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Server, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAssetMetadata } from "./useAssetMetadata";

interface CriticalSystemsSectionProps {
  asset: any;
}

type SystemRow = {
  name: string;
  purpose?: string;
  category?: string | null;
  criticality?: "critical" | "high" | "medium" | "low" | null;
};

const MAX_SYSTEMS = 5;

// Vanlige systemkategorier for trust-profilen
const SYSTEM_CATEGORY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "erp", label: "ERP / Forretningssystem" },
  { key: "crm", label: "CRM / Salg" },
  { key: "hr", label: "HR / Lønn" },
  { key: "finance", label: "Økonomi / Regnskap" },
  { key: "comms", label: "E-post / Samhandling" },
  { key: "fileshare", label: "Fillagring / Dokumenter" },
  { key: "identity", label: "Identitet / Pålogging" },
  { key: "security", label: "Sikkerhet / EDR / SIEM" },
  { key: "backup", label: "Backup / Beredskap" },
  { key: "industry", label: "Bransjespesifikt fagsystem" },
  { key: "other", label: "Annet" },
];

const CRITICALITY_OPTIONS: Array<{ key: NonNullable<SystemRow["criticality"]>; label: string }> = [
  { key: "critical", label: "Kritisk" },
  { key: "high", label: "Høy" },
  { key: "medium", label: "Middels" },
  { key: "low", label: "Lav" },
];

const EMPTY_ROW: SystemRow = {
  name: "",
  purpose: "",
  category: null,
  criticality: null,
};

export function CriticalSystemsSection({ asset }: CriticalSystemsSectionProps) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const stored: SystemRow[] = Array.isArray(meta.criticalSystems) ? meta.criticalSystems : [];
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const [rows, setRows] = useState<SystemRow[]>(stored);
  useEffect(() => {
    setRows(Array.isArray(meta.criticalSystems) ? meta.criticalSystems : []);
  }, [JSON.stringify(meta.criticalSystems)]);

  const persist = (next: SystemRow[]) => {
    setRows(next);
    updatePath(["criticalSystems"], next, { silent: true });
  };

  const update = (i: number, patch: Partial<SystemRow>) => {
    persist(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    if (rows.length >= MAX_SYSTEMS) return;
    persist([...rows, { ...EMPTY_ROW }]);
  };
  const removeRow = (i: number) => persist(rows.filter((_, idx) => idx !== i));

  const filledCount = rows.filter((r) => r.name.trim().length > 0).length;
  const canAdd = rows.length < MAX_SYSTEMS;

  return (
    <section id="critical-systems" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Kritiske systemer</h2>
        <Badge variant="secondary" className="text-sm ml-auto">
          {filledCount}/{MAX_SYSTEMS}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Oppgi de inntil 5 mest kritiske systemene virksomheten er avhengig av — f.eks. ERP, CRM, e-post eller fagsystem.
      </p>

      {rows.length === 0 && (
        <Card className="p-6 text-center space-y-3 border-dashed">
          <p className="text-sm text-muted-foreground">
            Ingen kritiske systemer registrert ennå.
          </p>
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Legg til system
          </Button>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">System</label>
                    <Input
                      defaultValue={row.name}
                      placeholder="f.eks. Microsoft 365, Visma, SAP"
                      className="text-sm"
                      onBlur={(e) => e.target.value.trim() !== (row.name || "") && update(i, { name: e.target.value.trim() })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Type system</label>
                    <Select
                      value={row.category ?? ""}
                      onValueChange={(key) => {
                        const opt = SYSTEM_CATEGORY_OPTIONS.find((o) => o.key === key);
                        update(i, {
                          category: key,
                          purpose: key === "other" ? (row.purpose || "") : (opt?.label ?? ""),
                        });
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Velg systemtype…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_CATEGORY_OPTIONS.map((o) => (
                          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.category === "other" && (
                      <Input
                        defaultValue={row.purpose || ""}
                        placeholder="Beskriv systemet kort"
                        className="text-sm mt-1.5"
                        onBlur={(e) => e.target.value.trim() !== (row.purpose || "") && update(i, { purpose: e.target.value.trim() })}
                      />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeRow(i)}
                  aria-label="Fjern system"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Kritikalitet</label>
                <div className="flex flex-wrap gap-2">
                  {CRITICALITY_OPTIONS.map((o) => (
                    <Button
                      key={o.key}
                      variant={row.criticality === o.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => update(i, { criticality: o.key })}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          {canAdd && (
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Legg til system
            </Button>
          )}
          {!canAdd && (
            <p className="text-xs text-muted-foreground">
              Maks {MAX_SYSTEMS} kritiske systemer. Fjern et system for å legge til et nytt.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
