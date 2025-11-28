import { Card } from "@/components/ui/card";
import { Server } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SystemsInUseWidget() {
  const { t } = useTranslation();
  const total = 50;
  const withIssues = 47;
  const withoutIssues = 3;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Server className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{t("widgets.systems.title")}</h3>
      </div>

      <p className="text-4xl font-bold text-foreground mb-6">{total}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">{t("widgets.systems.withoutIssues")}</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{withoutIssues}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">{t("widgets.systems.withIssues")}</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{withIssues}</span>
        </div>
      </div>
    </Card>
  );
}
