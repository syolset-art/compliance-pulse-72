import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { cn } from "@/lib/utils";

interface Props {
  /** Antall krav som venter på at noen tar stilling */
  waiting: number;
  /** Antall krav satt til «godkjennes senere» */
  deferred: number;
  /** Hvor mange av funnene som kommer fra den lokale agenten Sara */
  fromSara: number;
  saraInstalled: boolean;
  onOpen: () => void;
  className?: string;
}

/**
 * Én rolig komponent øverst på regelverkssiden: hvor mange krav venter på
 * godkjenning, hvem funnene kommer fra, og én vei videre til godkjenningslisten.
 */
export function PendingApprovalCard({ waiting, deferred, fromSara, saraInstalled, onOpen, className }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  if (waiting === 0 && deferred === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4 text-success" />
        {isNb
          ? "Ingenting venter på godkjenning nå. Du får beskjed når noe trenger deg."
          : "Nothing is waiting for approval. You will be notified when something needs you."}
      </div>
    );
  }

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ClipboardCheck className="h-4 w-4 text-primary" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            {isNb ? "Venter på godkjenning" : "Waiting for approval"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isNb
              ? `${waiting} krav har dokumentasjon som venter på at du tar stilling.`
              : `${waiting} requirements have documentation waiting for your decision.`}
            {deferred > 0 &&
              (isNb
                ? ` ${deferred} er satt til godkjenning senere.`
                : ` ${deferred} are set for later approval.`)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {saraInstalled && fromSara > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <SaraIcon className="h-4 w-4" />
                {isNb ? `${fromSara} hentet av Sara` : `${fromSara} collected by Sara`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <LaraIcon className="h-4 w-4" />
              {isNb
                ? `${Math.max(waiting - (saraInstalled ? fromSara : 0), 0)} foreslått av Lara`
                : `${Math.max(waiting - (saraInstalled ? fromSara : 0), 0)} suggested by Lara`}
            </span>
          </div>
        </div>

        <Button size="sm" className="h-8 shrink-0 gap-1.5 text-xs" onClick={onOpen}>
          {isNb ? "Åpne liste" : "Open list"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}
