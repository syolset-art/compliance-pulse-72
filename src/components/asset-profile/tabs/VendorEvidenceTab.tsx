import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { Separator } from "@/components/ui/separator";

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  return (
    <div className="space-y-5">

      {/* Reuse existing DocumentsTab which groups by type */}
      <section>
        <DocumentsTab assetId={assetId} assetName={assetName} vendorName={vendorName} />
      </section>

      <Separator />

      {/* Lara inbox for auto-matched docs */}
      <section>
        <LaraInboxTab assetId={assetId} assetName={assetName} />
      </section>
    </div>
  );
};
