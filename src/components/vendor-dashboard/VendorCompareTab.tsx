import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, FileDown, FileSpreadsheet, Scale, X, ChevronDown, Shield, Settings, Key, Users, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addMynderFooter } from "@/lib/pdfBranding";
import * as XLSX from "xlsx";
import {
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  groupControlsByArea,
  type EvaluatedControl,
  type ControlArea,
  type TrustControlStatus,
} from "@/lib/trustControlDefinitions";

interface VendorCompareTabProps {
  vendors: any[];
}

// Re-use evaluation logic from TrustControlsPanel
function evaluateGenericControl(key: string, asset: any, docsCount: number): TrustControlStatus {
  switch (key) {
    case "owner_assigned": return asset.asset_owner || asset.work_area_id ? "implemented" : "missing";
    case "responsible_person": return asset.asset_manager ? "implemented" : "missing";
    case "description_defined":
      return asset.description && asset.description.length > 10 ? "implemented" : asset.description ? "partial" : "missing";
    case "risk_level_defined": return asset.risk_level ? "implemented" : "missing";
    case "criticality_defined": return asset.criticality ? "implemented" : "missing";
    case "risk_assessment": return asset.risk_level ? "partial" : "missing";
    case "review_cycle": return asset.next_review_date ? "implemented" : "missing";
    case "documentation_available": return docsCount >= 3 ? "implemented" : docsCount > 0 ? "partial" : "missing";
    default: return "missing";
  }
}

function evaluateTypeControl(key: string, asset: any, docsCount: number): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const maps: Record<string, () => TrustControlStatus> = {
    dpa_verified: () => meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing",
    security_contact: () => asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing",
    sub_processors_disclosed: () => meta.sub_processors_disclosed ? "implemented" : "missing",
    vendor_security_review: () => meta.vendor_security_review ? "implemented" : "missing",
  };
  return maps[key]?.() ?? "missing";
}

function evaluateVendorControls(vendor: any, docsCount: number) {
  const generic: EvaluatedControl[] = GENERIC_CONTROLS.map((c) => ({
    ...c,
    status: evaluateGenericControl(c.key, vendor, docsCount),
  }));
  const typeControls = getTypeSpecificControls("vendor");
  const typeEval: EvaluatedControl[] = typeControls.map((c) => ({
    ...c,
    status: evaluateTypeControl(c.key, vendor, docsCount),
  }));
  const all = [...generic, ...typeEval];
  const grouped = groupControlsByArea(all);
  const trustScore = calculateTrustScore(all);

  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (!controls || controls.length === 0) return null;
    const impl = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    return Math.round(((impl + partial * 0.5) / controls.length) * 100);
  };

  return {
    trustScore,
    areas: {
      governance: areaScore("governance"),
      risk_compliance: areaScore("risk_compliance"),
      security_posture: areaScore("security_posture"),
      supplier_governance: areaScore("supplier_governance"),
    },
    controls: all,
    grouped,
  };
}

const AREA_CONFIG: { area: ControlArea; icon: any; labelNb: string; labelEn: string }[] = [
  { area: "governance", icon: Shield, labelNb: "Styring", labelEn: "Governance" },
  { area: "risk_compliance", icon: Settings, labelNb: "Drift og sikkerhet", labelEn: "Operations & Security" },
  { area: "security_posture", icon: Key, labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling" },
  { area: "supplier_governance", icon: Users, labelNb: "Tredjepartstyring og verdikjede", labelEn: "Third-Party & Value Chain" },
];

function StatusIcon({ status }: { status: TrustControlStatus }) {
  if (status === "implemented") return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
  if (status === "partial") return <MinusCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
}

function ScoreBar({ score, compact }: { score: number | null; compact?: boolean }) {
  if (score === null) return <span className="text-xs text-muted-foreground">–</span>;
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-orange-500" : "bg-destructive";
  return (
    <div className={cn("flex items-center gap-2", compact ? "w-full" : "w-full")}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", score >= 75 ? "text-green-600 dark:text-green-400" : score >= 50 ? "text-orange-500" : "text-destructive")}>
        {score}%
      </span>
    </div>
  );
}

export function VendorCompareTab({ vendors }: VendorCompareTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, search]);

  const toggleVendor = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  // Fetch document counts per vendor
  const { data: docCounts = {} } = useQuery({
    queryKey: ["vendor-compare-doc-counts", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return {};
      const { data } = await supabase
        .from("vendor_documents")
        .select("asset_id")
        .in("asset_id", selectedIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => {
        counts[d.asset_id] = (counts[d.asset_id] || 0) + 1;
      });
      return counts;
    },
    enabled: selectedIds.length >= 2,
  });

  const compareData = useMemo(() => {
    return selectedIds.map((id) => {
      const vendor = vendors.find((v) => v.id === id);
      if (!vendor) return null;
      const docsCount = docCounts[id] || 0;
      const evaluation = evaluateVendorControls(vendor, docsCount);
      return {
        id,
        name: vendor.name,
        risk_level: vendor.risk_level,
        country: vendor.country,
        ...evaluation,
      };
    }).filter(Boolean) as any[];
  }, [selectedIds, vendors, docCounts]);

  const showComparison = selectedIds.length >= 2;
  const selectedVendors = selectedIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(isNb ? "Sammenligning av sikkerhetskontroller" : "Security Controls Comparison", 14, 20);
    const headers = [isNb ? "Kontrollområde" : "Control Area", ...compareData.map((v: any) => v.name)];
    const rows = [
      [isNb ? "Trust Score" : "Trust Score", ...compareData.map((v: any) => `${v.trustScore}%`)],
      ...AREA_CONFIG.map((a) => [
        isNb ? a.labelNb : a.labelEn,
        ...compareData.map((v: any) => v.areas[a.area] != null ? `${v.areas[a.area]}%` : "–"),
      ]),
    ];
    autoTable(doc, { head: [headers], body: rows, startY: 30 });
    addMynderFooter(doc);
    doc.save("vendor-security-comparison.pdf");
  };

  const exportExcel = () => {
    const headers = [isNb ? "Kontrollområde" : "Control Area", ...compareData.map((v: any) => v.name)];
    const rows = [
      ["Trust Score", ...compareData.map((v: any) => v.trustScore)],
      ...AREA_CONFIG.map((a) => [
        isNb ? a.labelNb : a.labelEn,
        ...compareData.map((v: any) => v.areas[a.area] ?? ""),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Security Comparison");
    XLSX.writeFile(wb, "vendor-security-comparison.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Vendor picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              {isNb ? "Velg leverandører" : "Select vendors"}
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{selectedIds.length}</Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isNb ? "Søk..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredVendors.map((v) => {
                const checked = selectedIds.includes(v.id);
                const disabled = !checked && selectedIds.length >= 5;
                return (
                  <button
                    key={v.id}
                    onClick={() => !disabled && toggleVendor(v.id)}
                    disabled={disabled}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors",
                      checked ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0",
                      checked ? "bg-primary border-primary" : "border-border"
                    )}>
                      {checked && <span className="text-primary-foreground text-[9px]">✓</span>}
                    </div>
                    <span className="truncate flex-1">{v.name}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {selectedVendors.map((v: any) => (
          <Badge key={v.id} variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5">
            {v.name}
            <button onClick={() => toggleVendor(v.id)}><X className="h-3 w-3" /></button>
          </Badge>
        ))}

        {selectedIds.length < 2 && (
          <span className="text-xs text-muted-foreground">
            {isNb ? "Velg minst 2 for å sammenligne sikkerhetskontroller" : "Select at least 2 to compare security controls"}
          </span>
        )}

        {showComparison && (
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={exportPDF} className="h-7 px-2 text-xs gap-1">
              <FileDown className="h-3 w-3" /> PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={exportExcel} className="h-7 px-2 text-xs gap-1">
              <FileSpreadsheet className="h-3 w-3" /> Excel
            </Button>
          </div>
        )}
      </div>

      {/* Comparison results */}
      {showComparison && (
        <div className="space-y-4">
          {/* Trust Score overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isNb ? "Samlet Trust Score" : "Overall Trust Score"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(compareData.length, 5)}, 1fr)` }}>
                {compareData.map((v: any) => (
                  <div key={v.id} className="text-center space-y-2">
                    <p className="text-sm font-medium truncate">{v.name}</p>
                    <div className="relative mx-auto w-16 h-16">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                        <circle
                          cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                          strokeDasharray={`${v.trustScore * 0.975} 100`}
                          strokeLinecap="round"
                          className={cn(
                            v.trustScore >= 75 ? "stroke-green-500" : v.trustScore >= 50 ? "stroke-orange-500" : "stroke-destructive"
                          )}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {v.trustScore}
                      </span>
                    </div>
                    <Badge variant={v.risk_level === "high" ? "destructive" : v.risk_level === "medium" ? "secondary" : "outline"} className="text-[10px]">
                      {v.risk_level || "–"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security pillar comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isNb ? "Sikkerhetskontroller per område" : "Security Controls by Area"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <TooltipProvider>
                {AREA_CONFIG.map((areaConf) => {
                  const Icon = areaConf.icon;
                  const isExpanded = expandedArea === areaConf.area;
                  return (
                    <div key={areaConf.area} className="border-b last:border-b-0 border-border/50">
                      <button
                        onClick={() => setExpandedArea(isExpanded ? null : areaConf.area)}
                        className="w-full px-3 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 w-40 shrink-0 pt-0.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-left">{isNb ? areaConf.labelNb : areaConf.labelEn}</span>
                        </div>
                        <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${compareData.length}, 1fr)` }}>
                          {compareData.map((v: any) => (
                            <ScoreBar key={v.id} score={v.areas[areaConf.area]} />
                          ))}
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform mt-0.5", isExpanded && "rotate-180")} />
                      </button>

                      {/* Expanded: individual control statuses */}
                      {isExpanded && (
                        <div className="bg-muted/20 px-3 pb-3 space-y-1">
                          {/* Header row */}
                          <div className="flex items-center gap-3 px-0 py-1">
                            <div className="w-40 shrink-0" />
                            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${compareData.length}, 1fr)` }}>
                              {compareData.map((v: any) => (
                                <span key={v.id} className="text-[10px] font-medium text-muted-foreground text-center truncate">{v.name}</span>
                              ))}
                            </div>
                            <div className="w-3.5" />
                          </div>
                          {/* Control rows */}
                          {compareData[0]?.grouped[areaConf.area]?.map((ctrl: EvaluatedControl) => (
                            <div key={ctrl.key} className="flex items-center gap-3 px-0 py-1 rounded hover:bg-muted/30">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="w-40 shrink-0 text-xs text-muted-foreground truncate cursor-help">
                                    {isNb ? ctrl.labelNb : ctrl.labelEn}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  {isNb ? (ctrl.descriptionNb || ctrl.labelNb) : (ctrl.descriptionEn || ctrl.labelEn)}
                                </TooltipContent>
                              </Tooltip>
                              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${compareData.length}, 1fr)` }}>
                                {compareData.map((v: any) => {
                                  const vendorCtrl = v.grouped[areaConf.area]?.find((c: EvaluatedControl) => c.key === ctrl.key);
                                  return (
                                    <div key={v.id} className="flex justify-center">
                                      <StatusIcon status={vendorCtrl?.status || "missing"} />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="w-3.5" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Quick info row */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid gap-2" style={{ gridTemplateColumns: `160px repeat(${compareData.length}, 1fr)` }}>
                <span className="text-xs font-medium text-muted-foreground">{isNb ? "Land" : "Country"}</span>
                {compareData.map((v: any) => <span key={v.id} className="text-xs text-center">{v.country || "–"}</span>)}

                <span className="text-xs font-medium text-muted-foreground">{isNb ? "Risikonivå" : "Risk Level"}</span>
                {compareData.map((v: any) => (
                  <div key={v.id} className="flex justify-center">
                    <Badge variant={v.risk_level === "high" ? "destructive" : v.risk_level === "medium" ? "secondary" : "outline"} className="text-[10px]">
                      {v.risk_level || "–"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedIds.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {isNb
              ? "Velg 2–5 leverandører for å sammenligne sikkerhetskontroller side ved side"
              : "Select 2–5 vendors to compare security controls side by side"}
          </p>
        </div>
      )}
    </div>
  );
}
