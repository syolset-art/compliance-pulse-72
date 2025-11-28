import { Card } from "@/components/ui/card";
import { Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ThirdPartyWidget() {
  const { t } = useTranslation();
  const stats = {
    total: 24,
    missingAgreement: 3,
    missingCertification: 5,
    compliant: 16,
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t("widgets.thirdParty.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("widgets.thirdParty.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{t("widgets.thirdParty.total")}</span>
          </div>
          <span className="text-lg font-bold text-foreground">{stats.total}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground">{t("widgets.thirdParty.missingDPA")}</span>
          </div>
          <span className="text-sm font-semibold text-destructive">{stats.missingAgreement}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-foreground">{t("widgets.thirdParty.missingCertification")}</span>
          </div>
          <span className="text-sm font-semibold text-warning">{stats.missingCertification}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-foreground">{t("widgets.thirdParty.fullyDocumented")}</span>
          </div>
          <span className="text-sm font-semibold text-success">{stats.compliant}</span>
        </div>
      </div>
    </Card>
  );
}
