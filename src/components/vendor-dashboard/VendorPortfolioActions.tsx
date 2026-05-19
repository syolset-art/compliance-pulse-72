import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanSearch, Share2 } from "lucide-react";
import { BulkGapAnalysisDialog } from "./BulkGapAnalysisDialog";
import { ShareVendorPortfolioDialog } from "./ShareVendorPortfolioDialog";

interface VendorPortfolioActionsProps {
  vendors: any[];
}

export function VendorPortfolioActions({ vendors }: VendorPortfolioActionsProps) {
  const [gapOpen, setGapOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setGapOpen(true)}>
        <ScanSearch className="h-4 w-4" />
        Gap-analyse
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
        <Share2 className="h-4 w-4" />
        Del
      </Button>

      <BulkGapAnalysisDialog
        open={gapOpen}
        onOpenChange={setGapOpen}
        vendors={vendors}
      />
      <ShareVendorPortfolioDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        vendors={vendors}
      />
    </>
  );
}
