import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, ClipboardCheck, CheckCircle2, Send, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveFrameworkSuggestions,
  deriveActivatedFrameworks,
  deriveActivatedFrameworkTargets,
  type OfferSuggestion,
} from "@/lib/offerSuggestions";
import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";

export type MaturityAssessmentStatus =
  | "not_started"
  | "partner_in_progress"
  | "sent_to_customer"
  | "confirmed";

interface Props {
  customer: any;
  /** Hvor langt modenhetsvurderingen har kommet. */
  status: MaturityAssessmentStatus;
  answered: number;
  totalQuestions: number;
  onOffer: (items: OfferSuggestion[]) => void;
  onActivate: (items: OfferSuggestion[]) => void;
  onStartAssessment: () => void;
  /** Gå inn i kundens organisasjon og jobbe med et aktivert regelverk. */
  onEnterCustomer?: (items: CustomerEntryTarget[]) => void;
}

const STATUS_TEXT: Record<MaturityAssessmentStatus, string> = {
  not_started: "Ikke startet",
  partner_in_progress: "Delvis besvart av partner",
  sent_to_customer: "Sendt til kunde – venter på svar",
  confirmed: "Bekreftet av kunden",
};

export function CustomerFrameworkRecommendationsCard({
  customer,
  status,
  answered,
  totalQuestions,
  onOffer,
  onActivate,
  onStartAssessment,
  onEnterCustomer,
}: Props) {
  const suggestions = deriveFrameworkSuggestions(customer);
  const activated = deriveActivatedFrameworks(customer);
  const activatedTargets = deriveActivatedFrameworkTargets(customer);
  const confirmed = status === "confirmed";

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Lovpålagte regelverk basert på data om kunden
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {confirmed
              ? "Forslaget er basert på kundens egne svar i modenhetsvurderingen."
              : "Foreløpig forslag ut fra bransje, land, størrelse og funn på kundens nettsted."}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0",
            confirmed
              ? "border-success/30 bg-success/10 text-success"
              : "border-recommend/30 bg-recommend/10 text-recommend",
          )}
        >
          {confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {confirmed ? "Bekreftet" : "Initiell KI-vurdering"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {suggestions.length === 0 && activated.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen regelverk foreslått ennå.</p>
        )}
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onActivate([s])}
            title="Aktiver direkte"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recommend focus-visible:ring-offset-1",
              "border-recommend/60 bg-recommend/15 text-recommend hover:bg-recommend/25 hover:border-recommend",
            )}
          >
            <Zap className="h-2.5 w-2.5 shrink-0" />
            {s.label}
          </button>
        ))}
        {activatedTargets.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => onEnterCustomer?.([target])}
            disabled={!onEnterCustomer}
            title={`Jobb med ${target.label} hos kunden`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-normal transition-colors",
              "bg-success/10 text-foreground border-success/30",
              onEnterCustomer
                ? "hover:bg-success/20 hover:border-success/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
                : "cursor-default",
            )}
          >
            {target.label}
            {onEnterCustomer && <ArrowRight className="h-2.5 w-2.5 opacity-70" />}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onActivate(suggestions)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Aktiver alle anbefalte
          </button>
          <button
            type="button"
            onClick={() => onOffer(suggestions)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Lag tilbud i stedet
          </button>
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Modenhetsvurdering
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              {status === "sent_to_customer" && <Send className="h-3 w-3" />}
              {STATUS_TEXT[status]}
              {status !== "not_started" && ` (${answered}/${totalQuestions})`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Bekreft hvilke regelverk som faktisk gjelder ved å kartlegge kundens modenhet. Du svarer
            på det du kan, og sender resten til kunden.
          </p>
          <Button size="sm" className="mt-2 h-7 text-xs gap-1.5" onClick={onStartAssessment}>
            <ClipboardCheck className="h-3.5 w-3.5" />
            {status === "not_started" ? "Start modenhetsvurdering" : "Åpne modenhetsvurdering"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
