import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download, Loader2 } from "lucide-react";
import { ShareReportDialog } from "@/components/regulations/ShareReportDialog";
import { generateVendorPortfolioReport } from "./generateVendorPortfolioReport";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorPortfolioActionsProps {
  vendors: any[];
}

export function VendorPortfolioActions({ vendors }: VendorPortfolioActionsProps) {
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    supabase.from("company_profile").select("name").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.name) setCompanyName(data.name); });
  }, []);

  const handleExport = async () => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      generateVendorPortfolioReport(vendors, companyName);
      toast({ title: "PDF generert", description: "Leverandørporteføljen er lastet ned." });
    } catch {
      toast({ title: "Feil", description: "Kunne ikke generere PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
        <Share2 className="h-4 w-4" />
        Del
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={generating}>
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Last ned PDF
      </Button>

      <ShareReportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        frameworkName="Leverandørportefølje"
        frameworkId="vendor-portfolio"
      />
    </>
  );
}
