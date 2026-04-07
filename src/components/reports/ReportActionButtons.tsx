import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";
import { ShareReportDialog } from "@/components/regulations/ShareReportDialog";
import { DownloadReportDialog, type ReportData } from "./DownloadReportDialog";

interface ReportActionButtonsProps {
  reportName: string;
  reportId: string;
  reportData: ReportData;
}

export const ReportActionButtons = ({ reportName, reportId, reportData }: ReportActionButtonsProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" />
          Del
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setDownloadOpen(true)}>
          <Download className="h-4 w-4" />
          Last ned PDF
        </Button>
      </div>

      <ShareReportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        frameworkName={reportName}
        frameworkId={reportId}
      />

      <DownloadReportDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        reportName={reportName}
        reportData={reportData}
      />
    </>
  );
};
