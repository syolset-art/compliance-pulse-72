import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function AlertBanner() {
  const { t } = useTranslation();
  
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("widgets.alertBanner.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("widgets.alertBanner.description")}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" className="gap-1">
          5 {t("widgets.alertBanner.button")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
