import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, FileText, Undo2, Archive } from "lucide-react";
import { formatKr } from "@/lib/planConstants";
import { formatDateLong } from "@/lib/moduleActivationState";

export interface ModuleChangeReceipt {
  /** "core" | "vendors" | ... */
  moduleId: string;
  moduleTitle: string;
  kind: "activation" | "upgrade" | "downgrade" | "retire";
  fromLabel?: string;
  toLabel: string;
  monthlyPriceKr: number;
  /** ISO-dato for når endringen trer i kraft (utelates ved umiddelbar effekt). */
  effectiveAt?: string;
  /** Kun ved avvikling: når dataene slettes hvis de ikke er hentet ut. */
  retentionUntil?: string;
  /** Kun ved avvikling: kort beskrivelse av hva som skjer med dataene. */
  dataNote?: string;
  termsVersion?: string;
  acceptedAt?: string;
  nextSteps: Array<{ label: string; description?: string; onClick: () => void }>;
  onUndo?: () => void;
}


interface Props {
  receipt: ModuleChangeReceipt | null;
  onOpenChange: (open: boolean) => void;
}

export function ModuleChangeReceiptSheet({ receipt, onOpenChange }: Props) {
  if (!receipt) return null;

  const {
    moduleTitle, kind, fromLabel, toLabel, monthlyPriceKr,
    effectiveAt, termsVersion, acceptedAt, nextSteps, onUndo,
  } = receipt;

  const isDowngrade = kind === "downgrade";

  const title =
    kind === "activation"
      ? `${moduleTitle} er aktivert`
      : isDowngrade
        ? `Nedgradering av ${moduleTitle} er planlagt`
        : `${moduleTitle} er oppgradert`;

  return (
    <Sheet open={!!receipt} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <SheetTitle className="text-base">{title}</SheetTitle>
          </div>
          <SheetDescription className="text-sm">
            {isDowngrade
              ? `Dere beholder dagens nivå fram til ${formatDateLong(effectiveAt)}. Da settes abonnementet ned automatisk.`
              : "Tjenesten aktiveres umiddelbart, og faktureres på neste faktura."}
          </SheetDescription>
        </SheetHeader>

        {/* Kvittering */}
        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Produkt</span>
            <span className="text-sm font-medium text-foreground">{moduleTitle}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Nivå</span>
            <span className="text-sm font-medium text-foreground text-right">
              {fromLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-muted-foreground line-through">{fromLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{toLabel}</span>
                </span>
              ) : (
                toLabel
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Månedspris</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {monthlyPriceKr === 0 ? "Gratis" : `${formatKr(monthlyPriceKr)} /mnd`}
              {monthlyPriceKr > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">eks. mva</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Trer i kraft</span>
            <span className="text-sm font-medium text-foreground">
              {isDowngrade ? formatDateLong(effectiveAt) : "Med én gang"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 pt-2 border-t border-border/60">
            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Vilkår
            </span>
            <span className="text-sm text-foreground text-right">
              Godkjent{termsVersion ? ` (versjon ${termsVersion})` : ""}
              <span className="block text-xs text-muted-foreground">{formatDateLong(acceptedAt)}</span>
            </span>
          </div>
        </div>

        {/* Neste steg */}
        {nextSteps.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Neste steg</h4>
            {nextSteps.map((step, i) => (
              <button
                key={step.label}
                type="button"
                onClick={step.onClick}
                className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          {onUndo ? (
            <Button variant="ghost" size="sm" onClick={onUndo} className="text-muted-foreground">
              <Undo2 className="h-4 w-4 mr-1.5" /> Angre endringen
            </Button>
          ) : <span />}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
