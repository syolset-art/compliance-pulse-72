import { RiskManagementTab } from "./RiskManagementTab";
import { IncidentManagementTab } from "./IncidentManagementTab";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface VendorRiskAuditTabProps {
  assetId: string;
}

export const VendorRiskAuditTab = ({ assetId }: VendorRiskAuditTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isNb ? "Revisjon og risiko" : "Audit & Risk Management"}
        </h3>
        <RiskManagementTab assetId={assetId} />
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isNb ? "Avvik og hendelser" : "Deviations & Incidents"}
        </h3>
        <IncidentManagementTab assetId={assetId} />
      </section>
    </div>
  );
};
