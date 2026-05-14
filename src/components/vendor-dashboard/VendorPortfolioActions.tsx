import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanSearch } from "lucide-react";
import { BulkGapAnalysisDialog } from "./BulkGapAnalysisDialog";

interface VendorPortfolioActionsProps {
  vendors: any[];
}

export function VendorPortfolioActions({ vendors }: VendorPortfolioActionsProps) {
  const [gapOpen, setGapOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setGapOpen(true)}>
        <ScanSearch className="h-4 w-4" />
        Gap-analyse
      </Button>

      <BulkGapAnalysisDialog
        open={gapOpen}
        onOpenChange={setGapOpen}
        vendors={vendors}
      />
    </>
  );
}
