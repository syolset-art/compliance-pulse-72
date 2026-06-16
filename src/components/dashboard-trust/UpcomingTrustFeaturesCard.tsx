import { useTranslation } from "react-i18next";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UpcomingTrustFeaturesCard() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  return (
    <Card className="p-5 border-dashed bg-muted/30">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Kommer snart" : "Coming soon"}
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {isNb ? "Forhåndsvisning" : "Preview"}
            </Badge>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-background border border-border/60">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-foreground">
                {isNb ? "Avvikshendelser fra dine leverandører" : "Incidents from your vendors"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isNb
                  ? "Få automatisk varsling når leverandører du har registrert i din Trust Profile rapporterer hendelser eller endrer sertifiseringsstatus."
                  : "Get automatic alerts when vendors registered in your Trust Profile report incidents or change certification status."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
