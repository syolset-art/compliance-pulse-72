import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface VendorDocumentsTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorDocumentsTab = ({ assetId, assetName, vendorName }: VendorDocumentsTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-8">
      <section>
        <DocumentsTab assetId={assetId} assetName={assetName} vendorName={vendorName} />
      </section>

      <Separator />

      <section>
        <LaraInboxTab assetId={assetId} assetName={assetName} />
      </section>
    </div>
  );
};
