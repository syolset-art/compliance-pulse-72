import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Download, CheckCircle2, Bot } from "lucide-react";
import { useSaraAgent } from "@/lib/saraAgent";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { SaraActivityLogDialog } from "@/components/agents/SaraActivityLogDialog";
import { cn } from "@/lib/utils";

interface DocumentActionButtonsProps {
  /** Åpner sidens egen opplastingsdialog */
  onUpload: () => void;
  /** Overstyr etiketten på opplastingsknappen */
  uploadLabel?: { nb: string; en: string };
  className?: string;
}

/**
 * Felles handlingsknapper for alle flater der brukeren kan laste opp dokumentasjon:
 * «Last opp dokumentasjon» (alltid aktiv) + «Installer Sara» (deaktivert når agenten
 * allerede er installert) + «Se aktivitet» når Sara har nye funn.
 */
export function DocumentActionButtons({ onUpload, uploadLabel, className }: DocumentActionButtonsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { installed, newFindings } = useSaraAgent();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const upload = uploadLabel ?? { nb: "Last opp dokumentasjon", en: "Upload documentation" };

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" className="h-8 shrink-0 gap-1.5 text-xs" onClick={onUpload}>
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isNb ? upload.nb : upload.en}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>
              {isNb
                ? "Last opp dokumentasjon. Lara analyserer dokumentet og foreslår hvilke krav det dekker. Bekreft forslaget, så oppdateres kravene og scoren automatisk."
                : "Upload documentation. Lara analyzes the document and suggests which requirements it covers. Confirm the suggestion, and the requirements and score are updated automatically."}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className={installed ? "cursor-not-allowed" : undefined}>
              <Button
                size="sm"
                variant="outline"
                disabled={installed}
                className="h-8 shrink-0 gap-1.5 text-xs"
                onClick={() => setOnboardingOpen(true)}
              >
                {installed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {installed
                    ? isNb
                      ? "Sara er installert"
                      : "Sara is installed"
                    : isNb
                      ? "Installer Sara"
                      : "Install Sara"}
                </span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>
              {installed
                ? isNb
                  ? "Sara kjører lokalt hos dere og henter dokumentasjon automatisk. Endre oppsettet under Innstillinger → Datakilder og agenter."
                  : "Sara runs locally in your environment and collects documentation automatically. Change the setup under Settings → Data sources and agents."
                : isNb
                  ? "Mynder Compliance Agent Sara er en lokal agent. Klikk for å se hvordan du installerer, konfigurerer og kobler henne til dokumentkildene dine. Dokumentene prosesseres lokalt og forlater aldri infrastrukturen din — kun dokumentasjonsunderlaget lastes opp til Mynder."
                  : "Mynder Compliance Agent Sara is a local agent. Click to see how to install, configure and connect her to your document sources. Documents are processed locally and never leave your infrastructure — only the documentation evidence is uploaded to Mynder."}
            </p>
          </TooltipContent>
        </Tooltip>

        {installed && newFindings > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 gap-1.5 text-xs"
            onClick={() => setLogOpen(true)}
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">
              {isNb ? `${newFindings} nye funn fra Sara` : `${newFindings} new findings from Sara`}
            </span>
          </Button>
        )}
      </div>

      <SaraOnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
      <SaraActivityLogDialog open={logOpen} onOpenChange={setLogOpen} isNb={isNb} />
    </TooltipProvider>
  );
}
