import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { useTranslation } from "react-i18next";
import { FolderLock, Inbox } from "lucide-react";

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-8">
      {/* Interne dokumenter — manuelt opplastet */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderLock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {isNb ? "Interne dokumenter" : "Internal documents"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isNb ? "Dokumenter du har lastet opp selv" : "Documents you have uploaded"}
              </p>
            </div>
          </div>
        </div>
        <DocumentsTab assetId={assetId} assetName={assetName} vendorName={vendorName} />
      </section>

      {/* Eksterne dokumenter — mottatt og klar for godkjenning */}
      <section className="rounded-2xl border border-warning/25 bg-gradient-to-br from-warning/[0.04] via-card/40 to-transparent p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-warning/15 flex items-center justify-center">
              <Inbox className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {isNb ? "Eksterne dokumenter" : "External documents"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isNb ? "Mottatt fra leverandør · klar for godkjenning" : "Received from vendor · ready for approval"}
              </p>
            </div>
          </div>
        </div>
        <LaraInboxTab assetId={assetId} assetName={assetName} />
      </section>
    </div>
  );
};
