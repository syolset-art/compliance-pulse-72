import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Pencil,
  Plus,
  Sparkles,
  Server,
  MapPin,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCriticality } from "@/lib/criticality";
import { computeRisk } from "@/lib/derivedRisk";
import { cn } from "@/lib/utils";

interface Props {
  isNb: boolean;
  readOnly?: boolean;
}

const CRIT_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const gdprRoleLabel = (role: string | null | undefined, isNb: boolean) => {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes("processor") || r.includes("databehandler"))
    return isNb ? "Databehandler" : "Data processor";
  if (r.includes("controller") || r.includes("behandlingsansvarlig"))
    return isNb ? "Behandlingsansvarlig" : "Data controller";
  if (r.includes("joint")) return isNb ? "Felles ansvarlig" : "Joint controller";
  return role;
};

export function VendorSystemsRollupSection({ isNb, readOnly = false }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["tp-vendor-rollup-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          "id, name, description, criticality, risk_level, compliance_score, vendor_category, category, country, gdpr_role"
        )
        .eq("asset_type", "vendor");
      if (error) throw error;
      return data ?? [];
    },
  });

  const vendorIds = vendors.map((v: any) => v.id);

  const { data: systems = [] } = useQuery({
    queryKey: ["tp-vendor-rollup-systems", vendorIds],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name, description, vendor_asset_id, risk_level, criticality")
        .in("vendor_asset_id", vendorIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const systemIds = systems.map((s: any) => s.id);

  const { data: dataHandling = [] } = useQuery({
    queryKey: ["tp-vendor-rollup-data-handling", systemIds],
    enabled: systemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_data_handling")
        .select("system_id, data_locations")
        .in("system_id", systemIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: dpaDocs = [] } = useQuery({
    queryKey: ["tp-vendor-rollup-dpa", vendorIds],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("asset_id, document_type")
        .in("asset_id", vendorIds)
        .eq("document_type", "dpa");
      if (error) throw error;
      return data ?? [];
    },
  });

  const dpaSet = new Set(dpaDocs.map((d: any) => d.asset_id));
  const locationsBySystem = new Map<string, string[]>();
  dataHandling.forEach((d: any) => {
    locationsBySystem.set(d.system_id, d.data_locations || []);
  });
  const systemsByVendor = new Map<string, any[]>();
  systems.forEach((s: any) => {
    if (!s.vendor_asset_id) return;
    const arr = systemsByVendor.get(s.vendor_asset_id) || [];
    arr.push(s);
    systemsByVendor.set(s.vendor_asset_id, arr);
  });

  const ranked = [...vendors]
    .map((v: any) => {
      const crit = getCriticality(v);
      const risk = computeRisk({
        criticality: v.criticality || v.risk_level,
        complianceScore: v.compliance_score,
        country: v.country,
      });
      return { v, crit, risk };
    })
    .sort((a, b) => {
      const ca = a.crit ? CRIT_ORDER[a.crit.key] : 9;
      const cb = b.crit ? CRIT_ORDER[b.crit.key] : 9;
      if (ca !== cb) return ca - cb;
      return b.risk.score - a.risk.score;
    });

  const topFive = ranked.slice(0, 5);
  const moreCount = Math.max(0, ranked.length - topFive.length);

  const riskTone = (grade: "low" | "medium" | "high") =>
    grade === "high"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : grade === "medium"
      ? "bg-warning/10 text-warning border-warning/40"
      : "bg-success/10 text-success border-success/30";

  const riskLabel = (grade: "low" | "medium" | "high") =>
    isNb
      ? grade === "high"
        ? "Høy risiko"
        : grade === "medium"
        ? "Moderat risiko"
        : "Lav risiko"
      : grade === "high"
      ? "High risk"
      : grade === "medium"
      ? "Moderate risk"
      : "Low risk";

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <section
        id="tc-section-vendors"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Leverandører og systemer" : "Vendors and systems"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isNb
                  ? "Tredjeparter vi bruker, med tilhørende systemer og behandlingssted"
                  : "Third parties we use, with their systems and processing locations"}
              </p>
            </div>
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs shrink-0"
              onClick={() => navigate("/vendors")}
            >
              <Pencil className="h-3 w-3" />
              {isNb ? "Administrer" : "Manage"}
            </Button>
          )}
        </div>

        <div className="divide-y divide-border border-t border-border">
          {isLoading && (
            <div className="px-5 py-6 text-xs text-muted-foreground">
              {isNb ? "Henter leverandører…" : "Loading vendors…"}
            </div>
          )}

          {!isLoading && topFive.length === 0 && (
            <div className="px-5 py-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Ingen leverandører er kartlagt ennå."
                  : "No vendors have been mapped yet."}
              </p>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => navigate("/vendors")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isNb ? "Legg til leverandør" : "Add vendor"}
                </Button>
              )}
            </div>
          )}

          {!isLoading &&
            topFive.map(({ v, crit, risk }) => {
              const vendorSystems = systemsByVendor.get(v.id) || [];
              const hasDpa = dpaSet.has(v.id);
              const isOpen = expanded.has(v.id);
              const roleLabel = gdprRoleLabel(v.gdpr_role, isNb);
              const desc =
                v.description ||
                v.vendor_category ||
                v.category ||
                (isNb ? "Ingen beskrivelse" : "No description");

              return (
                <div key={v.id}>
                  <button
                    type="button"
                    onClick={() => toggle(v.id)}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                        isOpen && "rotate-90"
                      )}
                    />
                    <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {v.name}
                        </p>
                        <span className="text-xs text-muted-foreground truncate">
                          — {desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {roleLabel && (
                          <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {roleLabel}
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                            hasDpa
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {hasDpa ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <CircleDashed className="h-3 w-3" />
                          )}
                          DPA {hasDpa ? "✓" : "–"}
                        </span>
                        {v.country && (
                          <span className="text-[11px] text-muted-foreground">
                            {v.country}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          ·{" "}
                          {vendorSystems.length}{" "}
                          {isNb
                            ? vendorSystems.length === 1
                              ? "system"
                              : "systemer"
                            : vendorSystems.length === 1
                            ? "system"
                            : "systems"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {crit && (
                        <span
                          className={cn(
                            "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full",
                            crit.pillClass
                          )}
                        >
                          {isNb ? crit.labelNb : crit.labelEn}
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                              riskTone(risk.grade)
                            )}
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {riskLabel(risk.grade)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[260px] text-[12px]">
                          {isNb
                            ? "Avledet av Mynder/Lara fra data"
                            : "Derived by Mynder/Lara from data"}
                          {risk.reasons.length > 0 && (
                            <ul className="mt-1 list-disc pl-4 space-y-0.5">
                              {risk.reasons.slice(0, 3).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 bg-muted/20 border-t border-border/50">
                      {vendorSystems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2 pl-7">
                          {isNb
                            ? "Ingen systemer er knyttet til denne leverandøren."
                            : "No systems linked to this vendor."}
                        </p>
                      ) : (
                        <ul className="space-y-2 pl-7">
                          {vendorSystems.map((s: any) => {
                            const locs = locationsBySystem.get(s.id) || [];
                            return (
                              <li
                                key={s.id}
                                className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0"
                              >
                                <Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {s.name}
                                  </p>
                                  {s.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {s.description}
                                    </p>
                                  )}
                                  {locs.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      {locs.map((l, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                                        >
                                          {l}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {moreCount > 0 && !readOnly && (
            <button
              onClick={() => navigate("/vendors")}
              className="w-full px-5 py-2.5 text-xs text-primary hover:bg-muted/40 text-left"
            >
              {isNb ? `Vis alle (${ranked.length})` : `View all (${ranked.length})`}
            </button>
          )}
        </div>
      </section>
      <div className="border-t border-border" />
    </>
  );
}
