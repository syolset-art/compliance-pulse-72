import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { SaraActivityLogDialog } from "@/components/agents/SaraActivityLogDialog";
import { useSaraAgent } from "@/lib/saraAgent";

const LS_DISMISSED = "mynder.sara.evidencePromo.dismissed";

const readDismissed = () => {
  try { return localStorage.getItem(LS_DISMISSED) === "1"; } catch { return false; }
};

interface Props {
  /** Controlled from the page header button */
  onboardingOpen?: boolean;
  onOnboardingOpenChange?: (open: boolean) => void;
}

export function SaraEvidencePromo({ onboardingOpen, onOnboardingOpenChange }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;
  const { installed, newFindings } = useSaraAgent();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [localOpen, setLocalOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const open = onboardingOpen ?? localOpen;
  const setOpen = onOnboardingOpenChange ?? setLocalOpen;

  if (installed) {
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[13px]">
          <SaraIcon size={18} />
          <span className="text-foreground">
            {isNb ? "Sara henter dokumentasjon automatisk" : "Sara collects documentation automatically"}
          </span>
          {newFindings > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {isNb
                  ? `${newFindings} nye underlag fra Sara`
                  : `${newFindings} new records from Sara`}
              </span>
              <button
                type="button"
                onClick={() => setLogOpen(true)}
                className="ml-auto font-medium text-primary hover:underline"
              >
                {isNb ? "Se aktivitet" : "View activity"}
              </button>
            </>
          )}
        </div>
        <SaraActivityLogDialog open={logOpen} onOpenChange={setLogOpen} isNb={isNb} />
      </>
    );
  }

  return (
    <>
      {!dismissed && (
        <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-foreground">
                {isNb ? "Slipp å laste opp dokumentasjon manuelt" : "Stop uploading documentation manually"}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                {isNb
                  ? "Sara kjører lokalt hos dere, finner dokumentasjonen i deres egne kilder og sender kun bekreftelse på at den finnes — selve dokumentet forlater aldri huset."
                  : "Sara runs locally in your environment, finds the documentation in your own sources and only sends confirmation that it exists — the document itself never leaves your premises."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                <Download className="h-3.5 w-3.5" />
                {isNb ? "Installer Sara" : "Install Sara"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setDismissed(true);
                  try { localStorage.setItem(LS_DISMISSED, "1"); } catch { /* ignore */ }
                }}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                {isNb ? "Ikke nå" : "Not now"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
      <SaraOnboardingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
