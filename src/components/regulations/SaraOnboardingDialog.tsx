import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileCheck, Bot, Link, ShieldCheck, CheckCircle2 } from "lucide-react";

interface SaraOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaraOnboardingDialog({ open, onOpenChange }: SaraOnboardingDialogProps) {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Download,
      title: t("saraOnboarding.download"),
      description: t("saraOnboarding.downloadHint"),
    },
    {
      icon: FileCheck,
      title: t("saraOnboarding.install"),
      description: t("saraOnboarding.installHint"),
    },
    {
      icon: Bot,
      title: t("saraOnboarding.configure"),
      description: t("saraOnboarding.configureHint"),
    },
    {
      icon: Link,
      title: t("saraOnboarding.connect"),
      description: t("saraOnboarding.connectHint"),
    },
  ];

  const benefits = [
    t("saraOnboarding.noUpload"),
    t("saraOnboarding.localProcessing"),
    t("saraOnboarding.onlyEvidence"),
    t("saraOnboarding.newWay"),
  ];

  const handleDownload = () => {
    toast.info(t("saraOnboarding.coming"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t("saraOnboarding.title")}</DialogTitle>
            <Badge variant="outline" className="text-[10px]">
              {t("saraOnboarding.beta")}
            </Badge>
          </div>
          <DialogDescription>{t("saraOnboarding.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {idx + 1}. {step.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-primary/[0.03] p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {t("saraOnboarding.howItChanges")}
            </h4>
            <ul className="space-y-2">
              {benefits.map((text, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-[13px] text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("saraOnboarding.autoSync")}</p>
              <p className="text-[13px] text-muted-foreground">{t("saraOnboarding.syncText")}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("saraOnboarding.close")}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t("saraOnboarding.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
