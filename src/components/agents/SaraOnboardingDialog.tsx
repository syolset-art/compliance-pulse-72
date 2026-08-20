import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, ArrowRight } from "lucide-react";

interface SaraOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Kort, handlingsrettet nedlastingsdialog for Sara.
 * Utdypende informasjon ligger under Innstillinger → Datakilder og agenter.
 */
export function SaraOnboardingDialog({ open, onOpenChange }: SaraOnboardingDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    t("saraOnboarding.step1"),
    t("saraOnboarding.step2"),
    t("saraOnboarding.step3"),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("saraOnboarding.title")}</DialogTitle>
          <DialogDescription>{t("saraOnboarding.short")}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-2.5">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                {idx + 1}
              </span>
              <span className="text-sm text-foreground">{step}</span>
            </li>
          ))}
        </ol>

        <p className="text-[13px] text-muted-foreground">{t("saraOnboarding.boundaryLine")}</p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate("/settings/integrations");
            }}
          >
            {t("saraOnboarding.readMore")}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button size="sm" onClick={() => toast.info(t("saraOnboarding.coming"))}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t("saraOnboarding.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
