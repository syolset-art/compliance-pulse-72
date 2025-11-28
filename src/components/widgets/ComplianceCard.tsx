import { Card } from "@/components/ui/card";
import { Shield, Lock, Globe, FileCheck, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

const icons = {
  gdpr: Shield,
  iso: Lock,
  nis2: Globe,
  cra: FileCheck,
};

interface ComplianceItem {
  requirement: string;
  status: "compliant" | "needs-attention";
}

interface ComplianceCardProps {
  standard: "gdpr" | "iso" | "nis2" | "cra";
  title: string;
  percentage: number;
  subtitle: string;
}

const complianceDetails: Record<string, ComplianceItem[]> = {
  gdpr: [
    { requirement: "Behandlingsgrunnlag dokumentert", status: "compliant" },
    { requirement: "Personvernpolicy publisert", status: "compliant" },
    { requirement: "DPIA gjennomført for høyrisiko-behandlinger", status: "compliant" },
    { requirement: "Databehandleravtaler på plass", status: "compliant" },
    { requirement: "Rutiner for innsynsforespørsler", status: "needs-attention" },
    { requirement: "Rutiner for sletting av persondata", status: "needs-attention" },
    { requirement: "Personvernombud oppnevnt", status: "needs-attention" },
  ],
  iso: [
    { requirement: "Risikovurdering gjennomført", status: "compliant" },
    { requirement: "Sikkerhetspolicy dokumentert", status: "compliant" },
    { requirement: "Tilgangskontroll implementert", status: "compliant" },
    { requirement: "Hendelseshåndtering etablert", status: "compliant" },
    { requirement: "Leverandørstyring dokumentert", status: "needs-attention" },
    { requirement: "Kontinuitetsplaner testet", status: "needs-attention" },
    { requirement: "Intern revisjon gjennomført", status: "needs-attention" },
  ],
  nis2: [
    { requirement: "Risikoanalyse for kritiske systemer", status: "compliant" },
    { requirement: "Hendelsesrapportering etablert", status: "compliant" },
    { requirement: "Sikkerhetsovervåking aktiv", status: "compliant" },
    { requirement: "Kryptering av sensitiv data", status: "compliant" },
    { requirement: "Sårbarhetshåndtering", status: "compliant" },
    { requirement: "Leverandørkjede-sikkerhet", status: "needs-attention" },
    { requirement: "Beredskapsøvelser gjennomført", status: "needs-attention" },
  ],
  cra: [
    { requirement: "Sikkerhetsoppdateringer implementert", status: "compliant" },
    { requirement: "Sårbarhetsrapportering etablert", status: "compliant" },
    { requirement: "Secure by design prinsipper", status: "compliant" },
    { requirement: "Produktdokumentasjon oppdatert", status: "compliant" },
    { requirement: "Sikkerhetsevaluering gjennomført", status: "compliant" },
    { requirement: "CE-merking dokumentasjon", status: "needs-attention" },
    { requirement: "Konformitetserklæring", status: "needs-attention" },
  ],
};

export function ComplianceCard({ standard, title, percentage, subtitle }: ComplianceCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const Icon = icons[standard];
  const isGood = percentage >= 80;
  const details = complianceDetails[standard] || [];
  const compliantCount = details.filter(d => d.status === "compliant").length;
  const needsAttentionCount = details.filter(d => d.status === "needs-attention").length;
  
  return (
    <>
      <Card 
        className="p-6 transition-all hover:shadow-md cursor-pointer hover:scale-105" 
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg mb-4",
            isGood ? "bg-success/10" : "bg-warning/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              isGood ? "text-success" : "text-warning"
            )} />
          </div>
          
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          
          <div className="relative w-full h-2 bg-muted rounded-full mb-3">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                isGood ? "bg-success" : "bg-warning"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <p className={cn(
            "text-3xl font-bold mb-2",
            isGood ? "text-success" : "text-warning"
          )}>
            {percentage}%
          </p>
          
          <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>{t("widgets.compliance.clickForDetails")}</span>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={cn(
                "h-6 w-6",
                isGood ? "text-success" : "text-warning"
              )} />
              {title} - {percentage}% {t("widgets.compliance.compliance")}
            </DialogTitle>
            <DialogDescription>
              {subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {compliantCount} {t("widgets.compliance.compliant")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-warning" />
                {needsAttentionCount} {t("widgets.compliance.needsFollowUp")}
              </Badge>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {t("widgets.compliance.compliantRequirements")}
                  </h4>
                  <div className="space-y-2">
                    {details
                      .filter(item => item.status === "compliant")
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20"
                        >
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{item.requirement}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {needsAttentionCount > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      {t("widgets.compliance.needsAttention")}
                    </h4>
                    <div className="space-y-2">
                      {details
                        .filter(item => item.status === "needs-attention")
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
                          >
                            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-foreground">{item.requirement}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
