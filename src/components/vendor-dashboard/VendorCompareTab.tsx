import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, FileSpreadsheet, Scale } from "lucide-react";
import { CompareRadarChart } from "./CompareRadarChart";
import { CompareTable } from "./CompareTable";
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

  // Fetch analyses for selected vendors
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

  // Fetch documents for DPA & expiry check
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

  // Build comparison data
  const compareData = useMemo(() => {
    return selectedIds.map((id) => {
      const vendor = vendors.find((v) => v.id === id);
      // Latest analysis
      const analysis = analyses.find((a) => a.asset_id === id);
      const catScores = (analysis?.category_scores as Record<string, number>) || {};
      // Documents
      const vendorDocs = documents.filter((d) => d.asset_id === id);
      const hasDPA = vendorDocs.some(
        (d) => d.document_type?.toLowerCase().includes("dpa") || d.document_type?.toLowerCase().includes("databehandleravtale")
      );
      const now = new Date();
      const expiredDocs = vendorDocs.filter(
        (d) => d.valid_to && new Date(d.valid_to) < now
      ).length;

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
    const headers = [
      isNb ? "Dimensjon" : "Dimension",
      ...compareData.map((v) => v.name),
    ];
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

  return (
    <div className="space-y-6">
      {/* Vendor selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {isNb ? "Velg leverandører (2–5)" : "Select vendors (2–5)"}
            </CardTitle>
            <Badge variant="outline">{selectedIds.length}/5</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isNb ? "Søk leverandør..." : "Search vendor..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[220px]">
            <div className="space-y-1">
              {filteredVendors.map((v) => {
                const checked = selectedIds.includes(v.id);
                const disabled = !checked && selectedIds.length >= 5;
                return (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      checked ? "bg-accent" : "hover:bg-muted/50"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleVendor(v.id)}
                    />
                    <span className="flex-1 text-sm font-medium">{v.name}</span>
                    {v.compliance_score != null && (
                      <span className="text-xs text-muted-foreground">
                        {v.compliance_score}%
                      </span>
                    )}
                  </label>
                );
              })}
              {filteredVendors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isNb ? "Ingen treff" : "No matches"}
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Comparison view */}
      {showComparison && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompareRadarChart vendors={radarData} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {isNb ? "Totaloversikt" : "Overview"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compareData.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <span className="font-medium text-sm">{v.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {isNb ? "Compliance" : "Compliance"}
                        </span>
                        <span className="font-bold text-sm">
                          {v.compliance_score != null ? `${v.compliance_score}%` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <CompareTable vendors={compareData} />

          {/* Export */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {isNb ? "Eksporter PDF" : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {isNb ? "Eksporter Excel" : "Export Excel"}
            </Button>
          </div>
        </>
      )}

      {!showComparison && selectedIds.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {isNb
            ? "Velg minst 2 leverandører for å starte sammenligning"
            : "Select at least 2 vendors to start comparing"}
        </p>
      )}

      {selectedIds.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="font-semibold">
            {isNb ? "Sammenlign leverandører" : "Compare Vendors"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isNb
              ? "Velg 2–5 leverandører fra listen for å sammenligne compliance-modenhet side ved side"
              : "Select 2–5 vendors from the list to compare compliance maturity side by side"}
          </p>
        </div>
      )}
    </div>
  );
}
