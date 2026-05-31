import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAssetMetadata } from "./useAssetMetadata";

interface CriticalVendorsSectionProps {
  asset: any;
}

type VendorRow = {
  name: string;
  purpose?: string;
  processesPersonalData?: "yes" | "no" | null;
  dataCategories?: string[];
  dpa?: "yes" | "no" | "unknown" | null;
};

const DATA_CATEGORY_OPTIONS = ["Ansattdata", "Kundedata", "Pasientdata", "Annet"];

const EMPTY_ROW: VendorRow = {
  name: "",
  purpose: "",
  processesPersonalData: null,
  dataCategories: [],
  dpa: null,
};

export function CriticalVendorsSection({ asset }: CriticalVendorsSectionProps) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const stored: VendorRow[] = Array.isArray(meta.criticalVendors) ? meta.criticalVendors : [];
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const [rows, setRows] = useState<VendorRow[]>(stored.length ? stored : []);
  useEffect(() => {
    setRows(Array.isArray(meta.criticalVendors) ? meta.criticalVendors : []);
  }, [JSON.stringify(meta.criticalVendors)]);

  const persist = (next: VendorRow[]) => {
    setRows(next);
    updatePath(["criticalVendors"], next, { silent: true });
  };

  const update = (i: number, patch: Partial<VendorRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    persist(next);
  };

  const addRow = () => persist([...rows, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => persist(rows.filter((_, idx) => idx !== i));

  const toggleCategory = (i: number, cat: string) => {
    const current = rows[i].dataCategories || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    update(i, { dataCategories: next });
  };

  return (
    <section id="critical-vendors" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Leverandører</h2>
        <Badge variant="secondary" className="text-sm ml-auto">
          {rows.filter((r) => r.name.trim().length > 0).length}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Kritiske leverandører som behandler data eller leverer tjenester på dine vegne. Speiler det du oppga ved aktivering — oppdater her ved behov.
      </p>

      {rows.length === 0 && (
        <Card className="p-6 text-center space-y-3 border-dashed">
          <p className="text-sm text-muted-foreground">
            Ingen kritiske leverandører registrert ennå.
          </p>
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Legg til leverandør
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
                    <label className="text-sm font-medium text-foreground">Leverandør</label>
                    <Input
                      defaultValue={row.name}
                      placeholder="f.eks. Microsoft, Visma, AWS"
                      className="text-sm"
                      onBlur={(e) => e.target.value.trim() !== (row.name || "") && update(i, { name: e.target.value.trim() })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Hva gjør de for dere</label>
                    <Input
                      defaultValue={row.purpose || ""}
                      placeholder="Skylagring, HR-system, Fakturering …"
                      className="text-sm"
                      onBlur={(e) => e.target.value.trim() !== (row.purpose || "") && update(i, { purpose: e.target.value.trim() })}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeRow(i)}
                  aria-label="Fjern leverandør"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-sm font-medium text-foreground">Behandler de personopplysninger på deres vegne?</label>
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <Button
                      key={v}
                      variant={row.processesPersonalData === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => update(i, { processesPersonalData: v, ...(v === "no" ? { dataCategories: [], dpa: row.dpa === "no" ? null : row.dpa } : {}) })}
                    >
                      {v === "yes" ? "Ja" : "Nei"}
                    </Button>
                  ))}
                </div>
              </div>

              {row.processesPersonalData === "yes" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Hvilken kategori?</label>
                  <div className="flex flex-wrap gap-2">
                    {DATA_CATEGORY_OPTIONS.map((cat) => {
                      const selected = (row.dataCategories || []).includes(cat);
                      return (
                        <Button
                          key={cat}
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(i, cat)}
                        >
                          {cat}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Har dere en databehandleravtale (DPA)?</label>
                <div className="flex gap-2">
                  {(["yes", row.processesPersonalData === "no" ? null : "no", "unknown"]
                    .filter(Boolean) as Array<"yes" | "no" | "unknown">).map((v) => (
                    <Button
                      key={v}
                      variant={row.dpa === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => update(i, { dpa: v })}
                    >
                      {v === "yes" ? "Ja" : v === "no" ? "Nei" : "Vet ikke"}
                    </Button>
                  ))}
                </div>
                {row.processesPersonalData === "no" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="h-3 w-3" />
                    DPA normalt ikke påkrevd når leverandøren ikke behandler personopplysninger.
                  </p>
                )}
              </div>
            </Card>
          ))}

          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Legg til leverandør
          </Button>
        </div>
      )}
    </section>
  );
}
