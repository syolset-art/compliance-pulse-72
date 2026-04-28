import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { useTranslation } from "react-i18next";

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-10">
      {/* Interne dokumenter — manuelt opplastet */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {isNb ? "Interne dokumenter" : "Internal documents"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isNb ? "Dokumenter du har lastet opp selv" : "Documents you have uploaded"}
          </p>
        </div>
        <DocumentsTab assetId={assetId} assetName={assetName} vendorName={vendorName} />
      </section>

      {/* Eksterne dokumenter — mottatt og klar for godkjenning */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {isNb ? "Eksterne dokumenter" : "External documents"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isNb ? "Mottatt fra leverandør · klar for godkjenning" : "Received from vendor · ready for approval"}
          </p>
        </div>
        <LaraInboxTab assetId={assetId} assetName={assetName} />
      </section>
    </div>
  );
};
