import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  FileCheck,
  Bot,
  Link,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Ban,
  ListChecks,
  BadgeCheck,
} from "lucide-react";
import { SaraRequirementPackage } from "@/components/agents/SaraRequirementPackage";

interface SaraOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaraOnboardingDialog({ open, onOpenChange }: SaraOnboardingDialogProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;
  const [showNever, setShowNever] = useState(false);

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
    {
      icon: ListChecks,
      title: t("saraOnboarding.package"),
      description: t("saraOnboarding.packageHint"),
      requirementPackage: true,
    },
    {
      icon: BadgeCheck,
      title: t("saraOnboarding.confirm"),
      description: t("saraOnboarding.confirmHint"),
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t("saraOnboarding.title")}</DialogTitle>
            <Badge variant="outline" className="text-[10px]">
              {t("saraOnboarding.beta")}
            </Badge>
          </div>
          <DialogDescription>{t("saraOnboarding.problem")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-foreground">{t("saraOnboarding.solution")}</p>

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

                    {step.requirementPackage && (
                      <div className="mt-3">
                        <SaraRequirementPackage isNb={isNb} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust boundary */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {t("saraOnboarding.boundary")}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-[13px] font-medium text-foreground">
                    {t("saraOnboarding.staysTitle")}
                  </p>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {t("saraOnboarding.staysItems")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-primary/[0.03] p-3">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-[13px] font-medium text-foreground">
                    {t("saraOnboarding.sentTitle")}
                  </p>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {t("saraOnboarding.sentItems")}
                </p>
              </div>
            </div>
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

          {/* What Sara never does */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setShowNever((v) => !v)}
              aria-expanded={showNever}
              className="flex w-full items-center justify-between gap-2 p-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Ban className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t("saraOnboarding.neverTitle")}
              </span>
              {showNever ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
            {showNever && (
              <ul className="space-y-1.5 border-t border-border px-3 py-3">
                {[
                  t("saraOnboarding.never1"),
                  t("saraOnboarding.never2"),
                  t("saraOnboarding.never3"),
                ].map((text, idx) => (
                  <li key={idx} className="text-[13px] text-muted-foreground">
                    • {text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("saraOnboarding.manualRun")}</p>
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
