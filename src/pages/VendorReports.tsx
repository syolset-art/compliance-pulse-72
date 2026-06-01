import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Share2,
  ScanSearch,
  Loader2,
  TrendingUp,
  Building2,
  ArrowRight,
} from "lucide-react";
import { generateVendorPortfolioReport } from "@/components/vendor-dashboard/generateVendorPortfolioReport";
import { ShareReportDialog } from "@/components/regulations/ShareReportDialog";
import { BulkGapAnalysisDialog } from "@/components/vendor-dashboard/BulkGapAnalysisDialog";
import { useToast } from "@/hooks/use-toast";

export default function VendorReports() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("company_profile")
      .select("name")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setCompanyName(data.name);
      });
  }, []);

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendor-assets-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "vendor");
      if (error) throw error;
      return data || [];
    },
  });

  const total = vendors.length;
  const highRisk = vendors.filter(
    (v: any) => (v.risk_level || "").toLowerCase() === "high",
  ).length;
  const avgScore = total
    ? Math.round(
        vendors.reduce((sum: number, v: any) => sum + (v.compliance_score || 0), 0) / total,
      )
    : 0;

  const handleExportPortfolio = async () => {
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      generateVendorPortfolioReport(vendors, companyName);
      toast({ title: "PDF generert", description: "Leverandørporteføljen er lastet ned." });
    } catch {
      toast({
        title: "Feil",
        description: "Kunne ikke generere PDF.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const reports = [
    {
      key: "portfolio",
      title: "Porteføljerapport",
      description:
        "Komplett oversikt over alle leverandører, compliance-score, risiko og kategorier — klar for ledelse og styre.",
      icon: FileText,
      action: (
        <Button onClick={handleExportPortfolio} disabled={generating} className="gap-2">
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Last ned PDF
        </Button>
      ),
    },
    {
      key: "gap",
      title: "Gap-analyse",
      description:
        "Identifiser hvilke leverandører som mangler dokumentasjon, sertifiseringer eller oppfølging.",
      icon: ScanSearch,
      action: (
        <Button variant="outline" onClick={() => setGapOpen(true)} className="gap-2">
          <ScanSearch className="h-4 w-4" />
          Kjør analyse
        </Button>
      ),
    },
    {
      key: "share",
      title: "Del eksternt",
      description:
        "Generer en sikker delbar lenke til leverandørrapporten for revisor, kunde eller partner.",
      icon: Share2,
      action: (
        <Button variant="outline" onClick={() => setShareOpen(true)} className="gap-2">
          <Share2 className="h-4 w-4" />
          Opprett lenke
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Leverandører</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          <span>Rapporter</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Leverandørrapporter</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Generer rapporter, gap-analyser og delbare oversikter over leverandørporteføljen din.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Card variant="flat" className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Leverandører
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">{total}</div>
        </Card>
        <Card variant="flat" className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Snitt compliance
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">{avgScore}%</div>
        </Card>
        <Card variant="flat" className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Badge variant="outline" className="h-4 px-1 text-[11px]">
              Høy risiko
            </Badge>
          </div>
          <div className="text-2xl font-bold text-destructive tabular-nums">{highRisk}</div>
        </Card>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.key} variant="flat" className="p-5 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <r.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1.5">{r.title}</h2>
            <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
            <div>{r.action}</div>
          </Card>
        ))}
      </div>

      <ShareReportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        frameworkName="Leverandørportefølje"
        frameworkId="vendor-portfolio"
      />
      <BulkGapAnalysisDialog open={gapOpen} onOpenChange={setGapOpen} vendors={vendors} />
    </div>
  );
}
