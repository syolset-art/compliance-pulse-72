import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, FileSpreadsheet, Scale, X, ChevronDown } from "lucide-react";
import { CompareRadarChart } from "./CompareRadarChart";
import { CompareTable } from "./CompareTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface VendorCompareTabProps {
  vendors: any[];
}

export function VendorCompareTab({ vendors }: VendorCompareTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const { data: analyses = [] } = useQuery({
    queryKey: ["vendor-compare-analyses", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const { data } = await supabase
        .from("vendor_analyses")
        .select("asset_id, overall_score, category_scores, created_at")
        .in("asset_id", selectedIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: selectedIds.length >= 2,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["vendor-compare-docs", selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("asset_id, document_type, valid_to")
        .in("asset_id", selectedIds);
      return data || [];
    },
    enabled: selectedIds.length >= 2,
  });

  const compareData = useMemo(() => {
    return selectedIds.map((id) => {
      const vendor = vendors.find((v) => v.id === id);
      const analysis = analyses.find((a) => a.asset_id === id);
      const catScores = (analysis?.category_scores as Record<string, number>) || {};
      const vendorDocs = documents.filter((d) => d.asset_id === id);
      const hasDPA = vendorDocs.some(
        (d) => d.document_type?.toLowerCase().includes("dpa") || d.document_type?.toLowerCase().includes("databehandleravtale")
      );
      const now = new Date();
      const expiredDocs = vendorDocs.filter((d) => d.valid_to && new Date(d.valid_to) < now).length;

      return {
        id,
        name: vendor?.name || id,
        compliance_score: vendor?.compliance_score ?? null,
        risk_level: vendor?.risk_level ?? null,
        gdpr_role: vendor?.gdpr_role ?? null,
        vendor_category: vendor?.vendor_category ?? null,
        country: vendor?.country ?? null,
        hasDPA,
        categoryScores: {
          security: catScores.security ?? null,
          data_handling: catScores.data_handling ?? null,
          privacy: catScores.privacy ?? null,
          availability: catScores.availability ?? null,
        },
        overall_score: analysis?.overall_score ?? null,
        expiredDocs,
      };
    });
  }, [selectedIds, vendors, analyses, documents]);

  const radarData = compareData.map((v) => ({
    name: v.name,
    scores: {
      security: v.categoryScores.security ?? 0,
      data_handling: v.categoryScores.data_handling ?? 0,
      privacy: v.categoryScores.privacy ?? 0,
      availability: v.categoryScores.availability ?? 0,
    },
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(isNb ? "Leverandørsammenligning" : "Vendor Comparison", 14, 20);
    const headers = [isNb ? "Dimensjon" : "Dimension", ...compareData.map((v) => v.name)];
    const rows = [
      [isNb ? "Compliance" : "Compliance", ...compareData.map((v) => v.compliance_score != null ? `${v.compliance_score}%` : "—")],
      [isNb ? "Sikkerhet" : "Security", ...compareData.map((v) => v.categoryScores.security != null ? `${v.categoryScores.security}%` : "—")],
      [isNb ? "Datahåndtering" : "Data Handling", ...compareData.map((v) => v.categoryScores.data_handling != null ? `${v.categoryScores.data_handling}%` : "—")],
      [isNb ? "Personvern" : "Privacy", ...compareData.map((v) => v.categoryScores.privacy != null ? `${v.categoryScores.privacy}%` : "—")],
      [isNb ? "Tilgjengelighet" : "Availability", ...compareData.map((v) => v.categoryScores.availability != null ? `${v.categoryScores.availability}%` : "—")],
      [isNb ? "Risiko" : "Risk", ...compareData.map((v) => v.risk_level || "—")],
      ["DPA", ...compareData.map((v) => v.hasDPA ? (isNb ? "Ja" : "Yes") : (isNb ? "Nei" : "No"))],
      [isNb ? "GDPR-rolle" : "GDPR Role", ...compareData.map((v) => v.gdpr_role || "—")],
    ];
    autoTable(doc, { head: [headers], body: rows, startY: 30 });
    doc.save("vendor-comparison.pdf");
  };

  const exportExcel = () => {
    const headers = [isNb ? "Dimensjon" : "Dimension", ...compareData.map((v) => v.name)];
    const rows = [
      [isNb ? "Compliance-score" : "Compliance Score", ...compareData.map((v) => v.compliance_score ?? "")],
      [isNb ? "Sikkerhet" : "Security", ...compareData.map((v) => v.categoryScores.security ?? "")],
      [isNb ? "Datahåndtering" : "Data Handling", ...compareData.map((v) => v.categoryScores.data_handling ?? "")],
      [isNb ? "Personvern" : "Privacy", ...compareData.map((v) => v.categoryScores.privacy ?? "")],
      [isNb ? "Tilgjengelighet" : "Availability", ...compareData.map((v) => v.categoryScores.availability ?? "")],
      [isNb ? "Risiko" : "Risk", ...compareData.map((v) => v.risk_level ?? "")],
      ["DPA", ...compareData.map((v) => v.hasDPA ? (isNb ? "Ja" : "Yes") : (isNb ? "Nei" : "No"))],
      [isNb ? "GDPR-rolle" : "GDPR Role", ...compareData.map((v) => v.gdpr_role ?? "")],
      [isNb ? "Land" : "Country", ...compareData.map((v) => v.country ?? "")],
      [isNb ? "Utdaterte dok." : "Expired Docs", ...compareData.map((v) => v.expiredDocs)],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comparison");
    XLSX.writeFile(wb, "vendor-comparison.xlsx");
  };

  const showComparison = selectedIds.length >= 2;
  const selectedVendors = selectedIds.map((id) => vendors.find((v) => v.id === id)).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Compact vendor picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              {isNb ? "Velg leverandører" : "Select vendors"}
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
                    {v.compliance_score != null && (
                      <span className="text-[11px] text-muted-foreground">{v.compliance_score}%</span>
                    )}
                  </button>
                );
              })}
              {filteredVendors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">{isNb ? "Ingen treff" : "No matches"}</p>
              )}
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
            {isNb ? "Velg minst 2 for å sammenligne" : "Select at least 2 to compare"}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompareRadarChart vendors={radarData} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isNb ? "Totaloversikt" : "Overview"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {compareData.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/30">
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-sm font-bold">
                        {v.compliance_score != null ? `${v.compliance_score}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <CompareTable vendors={compareData} />
        </div>
      )}

      {selectedIds.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {isNb
              ? "Velg 2–5 leverandører for å sammenligne compliance-modenhet side ved side"
              : "Select 2–5 vendors to compare compliance maturity side by side"}
          </p>
        </div>
      )}
    </div>
  );
}
