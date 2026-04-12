import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, AlertTriangle, Link2 } from "lucide-react";
import { RiskManagementTab } from "./RiskManagementTab";
import { IncidentManagementTab } from "./IncidentManagementTab";
import { RelationsTab } from "./RelationsTab";
import { CustomerRequestsTab } from "./CustomerRequestsTab";

interface VendorHistoryTabProps {
  assetId: string;
}

export const VendorHistoryTab = ({ assetId }: VendorHistoryTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="space-y-6">
      {/* ── Our follow-up (TPRM) ── */}
      <section className="space-y-4">
        <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
          <ClipboardList className="h-3.5 w-3.5" />
          {isNb ? "Vår oppfølging (TPRM)" : "Our follow-up (TPRM)"}
        </Badge>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {isNb ? "Revisjon og risiko" : "Audit & Risk"}
          </h3>
          <RiskManagementTab assetId={assetId} />
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {isNb ? "Forespørsler" : "Requests"}
          </h3>
          <CustomerRequestsTab />
        </div>
      </section>

      <Separator className="my-2" />

      {/* ── Vendor incidents ── */}
      <section className="space-y-4">
        <Badge variant="outline" className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {isNb ? "Leverandørhendelser" : "Vendor incidents"}
        </Badge>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {isNb ? "Avvik og hendelser" : "Deviations & Incidents"}
          </h3>
          <IncidentManagementTab assetId={assetId} />
        </div>
      </section>

      <Separator className="my-2" />

      {/* ── Relations / supply chain ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Relasjoner og leverandørkjede" : "Relations & Supply chain"}
          </h3>
        </div>
        <RelationsTab assetId={assetId} />
      </section>
    </div>
  );
};
