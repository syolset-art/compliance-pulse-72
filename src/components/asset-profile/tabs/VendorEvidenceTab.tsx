import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { FileCheck } from "lucide-react";
import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { Separator } from "@/components/ui/separator";

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-5">
      {/* Context badge */}
      <Badge variant="outline" className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400">
        <FileCheck className="h-3.5 w-3.5" />
        {isNb ? "Leverandørens profil / evidens" : "Vendor profile / evidence"}
      </Badge>

      {/* Reuse existing DocumentsTab which groups by type */}
      <section>
        <DocumentsTab assetId={assetId} assetName={assetName} vendorName={vendorName} />
      </section>

      <Separator />

      {/* Lara inbox for auto-matched docs */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {isNb ? "Innboks (automatisk mottatt)" : "Inbox (auto-received)"}
        </h3>
        <LaraInboxTab assetId={assetId} assetName={assetName} />
      </section>
    </div>
  );
};
