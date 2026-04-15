import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareReportDialog } from "@/components/regulations/ShareReportDialog";
import {
  Download, Share2, Users, Monitor, Package, AlertTriangle, ShieldCheck,
  AlertOctagon, CheckCircle, Minus, Loader2, Building2, TrendingUp
} from "lucide-react";
import { generateVendorPortfolioReport } from "@/components/vendor-dashboard/generateVendorPortfolioReport";
import { generateExecutivePortfolioReport } from "@/components/reports/generateExecutivePortfolioReport";
import { supabase } from "@/integrations/supabase/client";

interface AssetRow {
  id: string;
  name: string;
  asset_type: string;
  risk_level?: string | null;
  compliance_score?: number | null;
  lifecycle_status?: string | null;
  category?: string | null;
  country?: string | null;
  criticality?: string | null;
  gdpr_role?: string | null;
}

interface PortfolioReportViewProps {
  vendors: AssetRow[];
  systems: AssetRow[];
  allAssets: AssetRow[];
}

function countByRisk(items: AssetRow[]) {
  const critical = items.filter(a => a.risk_level === "critical").length;
  const high = items.filter(a => a.risk_level === "high").length;
  const medium = items.filter(a => a.risk_level === "medium").length;
  const low = items.filter(a => a.risk_level === "low").length;
  const unset = items.length - critical - high - medium - low;
  return { critical, high, medium, low, unset };
}

function avgScore(items: AssetRow[]) {
  const scored = items.filter(a => (a.compliance_score ?? 0) > 0);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((s, a) => s + (a.compliance_score ?? 0), 0) / scored.length);
}

const riskBadge = (level?: string | null) => {
  if (!level) return <Badge variant="outline" className="text-[13px]">–</Badge>;
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: "Kritisk", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    high: { label: "Høy", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    medium: { label: "Middels", cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
    low: { label: "Lav", cls: "bg-green-500/10 text-green-700 border-green-500/20" },
  };
  const m = map[level];
  return m ? <Badge className={`text-[13px] ${m.cls}`}>{m.label}</Badge> : <Badge variant="outline" className="text-[13px]">{level}</Badge>;
};

function ScoreDisplay({ score }: { score?: number | null }) {
  if (!score || score === 0) return <span className="text-xs text-muted-foreground">Ikke vurdert</span>;
  const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-destructive";
  return <span className={`text-xs font-semibold ${color}`}>{score}%</span>;
}

export function PortfolioReportView({ vendors, systems, allAssets }: PortfolioReportViewProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [shareOpen, setShareOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    supabase.from("company_profile").select("name").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.name) setCompanyName(data.name); });
  }, []);

  const otherAssets = useMemo(() => allAssets.filter(a => a.asset_type !== "vendor" && a.asset_type !== "system"), [allAssets]);
  const vendorRisk = useMemo(() => countByRisk(vendors), [vendors]);
  const systemRisk = useMemo(() => countByRisk(systems), [systems]);
  const vendorAvg = useMemo(() => avgScore(vendors), [vendors]);
  const systemAvg = useMemo(() => avgScore(systems), [systems]);
  const overallAvg = useMemo(() => avgScore(allAssets), [allAssets]);

  const handleDownloadVendor = async () => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      generateVendorPortfolioReport(vendors, companyName);
    } finally { setGenerating(false); }
  };

  const handleDownloadExecutive = async () => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      generateExecutivePortfolioReport({ vendors, systems, allAssets }, companyName);
    } finally { setGenerating(false); }
  };

  const handleDownloadAssetPdf = async (items: AssetRow[], title: string, filename: string) => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const { addMynderFooter } = await import("@/lib/pdfBranding");

      const doc = new jsPDF();
      const now = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
      const company = companyName || "Ukjent virksomhet";

      doc.setFontSize(20);
      doc.setTextColor(30, 30, 30);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`${company}  •  Generert ${now}`, 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Totalt ${items.length} registrert.`, 14, 42);

      const riskLabel = (r?: string | null) => {
        if (!r) return "–";
        const map: Record<string, string> = { critical: "Kritisk", high: "Høy", medium: "Middels", low: "Lav" };
        return map[r] || r;
      };

      autoTable(doc, {
        startY: 50,
        head: [["Navn", "Risiko", "Score", "Kritikalitet"]],
        body: items.map(a => [
          a.name,
          riskLabel(a.risk_level),
          a.compliance_score && a.compliance_score > 0 ? `${a.compliance_score}%` : "Ikke vurdert",
          a.criticality || "–",
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      });

      addMynderFooter(doc);
      doc.save(`${filename}_${now.replace(/\s/g, "_")}.pdf`);
    } finally { setGenerating(false); }
  };

  const now = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Report header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {isNb ? "Porteføljerapport" : "Portfolio Report"}
              </CardTitle>
              <CardDescription className="mt-1">
                {companyName || (isNb ? "Din organisasjon" : "Your organization")} — {now}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" />
                {isNb ? "Del" : "Share"}
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleDownloadExecutive} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isNb ? "Last ned PDF" : "Download PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isNb ? "Oppsummering" : "Executive Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users className="h-5 w-5" />}
              label={isNb ? "Leverandører" : "Vendors"}
              value={vendors.length}
              avg={vendorAvg}
              risk={vendorRisk}
            />
            <SummaryCard
              icon={<Monitor className="h-5 w-5" />}
              label={isNb ? "Systemer" : "Systems"}
              value={systems.length}
              avg={systemAvg}
              risk={systemRisk}
            />
            <SummaryCard
              icon={<Package className="h-5 w-5" />}
              label={isNb ? "Øvrige eiendeler" : "Other assets"}
              value={otherAssets.length}
              avg={avgScore(otherAssets)}
              risk={countByRisk(otherAssets)}
            />
            <div className="rounded-lg border p-4 flex flex-col items-center justify-center gap-1">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isNb ? "Snitt-score" : "Average score"}
              </span>
              <span className={`text-3xl font-bold ${
                overallAvg === null ? "text-muted-foreground" :
                overallAvg >= 70 ? "text-green-600" :
                overallAvg >= 40 ? "text-yellow-600" : "text-destructive"
              }`}>
                {overallAvg !== null ? `${overallAvg}%` : "–"}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {allAssets.length} {isNb ? "totalt" : "total"}
              </span>
            </div>
          </div>

          {/* Risk distribution bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><AlertOctagon className="h-3 w-3 text-destructive" /> {vendorRisk.critical + vendorRisk.high + systemRisk.critical + systemRisk.high} {isNb ? "høy/kritisk" : "high/critical"}</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-600" /> {vendorRisk.medium + systemRisk.medium} {isNb ? "middels" : "medium"}</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-600" /> {vendorRisk.low + systemRisk.low} {isNb ? "lav" : "low"}</span>
              <span className="flex items-center gap-1"><Minus className="h-3 w-3 text-muted-foreground" /> {vendorRisk.unset + systemRisk.unset} {isNb ? "ikke vurdert" : "not assessed"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed tables */}
      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            {isNb ? "Leverandører" : "Vendors"} ({vendors.length})
          </TabsTrigger>
          <TabsTrigger value="systems" className="gap-1.5 text-xs sm:text-sm">
            <Monitor className="h-3.5 w-3.5" />
            {isNb ? "Systemer" : "Systems"} ({systems.length})
          </TabsTrigger>
          {otherAssets.length > 0 && (
            <TabsTrigger value="other" className="gap-1.5 text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              {isNb ? "Øvrige" : "Other"} ({otherAssets.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{isNb ? "Leverandøroversikt" : "Vendor Overview"}</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={handleDownloadVendor} disabled={generating}>
                <Download className="h-3 w-3" />
                {isNb ? "Last ned" : "Download"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <AssetTable items={vendors} showCategory showCountry />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{isNb ? "Systemoversikt" : "System Overview"}</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handleDownloadAssetPdf(systems, isNb ? "Systemoversikt" : "System Overview", "systemoversikt")} disabled={generating}>
                <Download className="h-3 w-3" />
                {isNb ? "Last ned" : "Download"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <AssetTable items={systems} showCategory={false} showCountry={false} />
            </CardContent>
          </Card>
        </TabsContent>

        {otherAssets.length > 0 && (
          <TabsContent value="other">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{isNb ? "Øvrige eiendeler" : "Other Assets"}</CardTitle>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handleDownloadAssetPdf(otherAssets, isNb ? "Øvrige eiendeler" : "Other Assets", "ovrige_eiendeler")} disabled={generating}>
                  <Download className="h-3 w-3" />
                  {isNb ? "Last ned" : "Download"}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <AssetTable items={otherAssets} showCategory showCountry={false} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ShareReportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        frameworkName="Porteføljerapport"
        frameworkId="portfolio-report"
      />
    </div>
  );
}

function SummaryCard({ icon, label, value, avg, risk }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  avg: number | null;
  risk: ReturnType<typeof countByRisk>;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {avg !== null && (
          <span className={`text-xs font-medium ${avg >= 70 ? "text-green-600" : avg >= 40 ? "text-yellow-600" : "text-destructive"}`}>
            snitt {avg}%
          </span>
        )}
      </div>
      <div className="flex gap-1.5 text-[13px]">
        {(risk.critical + risk.high) > 0 && (
          <span className="text-destructive font-medium">{risk.critical + risk.high} høy</span>
        )}
        {risk.medium > 0 && (
          <span className="text-yellow-600 font-medium">{risk.medium} middels</span>
        )}
        {risk.low > 0 && (
          <span className="text-green-600 font-medium">{risk.low} lav</span>
        )}
      </div>
    </div>
  );
}

function AssetTable({ items, showCategory, showCountry }: {
  items: AssetRow[];
  showCategory: boolean;
  showCountry: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Ingen registrert</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[13px] font-semibold uppercase">Navn</TableHead>
          {showCategory && <TableHead className="text-[13px] font-semibold uppercase hidden sm:table-cell">Kategori</TableHead>}
          {showCountry && <TableHead className="text-[13px] font-semibold uppercase hidden md:table-cell">Land</TableHead>}
          <TableHead className="text-[13px] font-semibold uppercase">Risiko</TableHead>
          <TableHead className="text-[13px] font-semibold uppercase">Score</TableHead>
          <TableHead className="text-[13px] font-semibold uppercase hidden sm:table-cell">Kritikalitet</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-sm">{item.name}</TableCell>
            {showCategory && <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{item.category || item.gdpr_role || "–"}</TableCell>}
            {showCountry && <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.country || "–"}</TableCell>}
            <TableCell>{riskBadge(item.risk_level)}</TableCell>
            <TableCell><ScoreDisplay score={item.compliance_score} /></TableCell>
            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{item.criticality || "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
