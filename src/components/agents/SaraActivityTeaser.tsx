import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { useSaraAgent } from "@/lib/saraAgent";
import { cn } from "@/lib/utils";
import { X, ArrowRight } from "lucide-react";

const DISMISS_KEY = "mynder.sara.activityTeaser.dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "true";
}

function setDismissed(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(value));
}

export function SaraActivityTeaser() {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;
  const { installed } = useSaraAgent();
  const [dismissed, setDismissedState] = useState(readDismissed);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    setDismissedState(readDismissed());
  }, []);

  if (installed || dismissed) return null;

  return (
    <>
      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3.5">
        <div className="flex items-start gap-3">
          <SaraIcon size={28} className="mt-0.5" ariaLabel={isNb ? "Sara" : "Sara agent"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {t("saraActivityTeaser.title")}
              </p>
              <button
                type="button"
                onClick={() => { setDismissed(true); setDismissedState(true); }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isNb ? "Lukk teaser" : "Dismiss teaser"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {t("saraActivityTeaser.description")}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 gap-1 text-xs"
                onClick={() => setOnboardingOpen(true)}
              >
                {t("saraActivityTeaser.cta")}
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setDismissed(true); setDismissedState(true); }}
              >
                {t("saraActivityTeaser.dismiss")}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <SaraOnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </>
  );
}
