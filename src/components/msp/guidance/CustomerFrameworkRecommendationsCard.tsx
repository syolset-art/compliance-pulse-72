import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, ClipboardCheck, CheckCircle2, Send, ArrowRight, Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  deriveFrameworkSuggestions,
  deriveActivatedFrameworks,
  deriveActivatedFrameworkTargets,
  type OfferSuggestion,
} from "@/lib/offerSuggestions";
import { AddFrameworkDialog } from "./AddFrameworkDialog";
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
  const aiSuggestions = deriveFrameworkSuggestions(customer);
  const activated = deriveActivatedFrameworks(customer);
  const activatedTargets = deriveActivatedFrameworkTargets(customer);
  const confirmed = status === "confirmed";
  const { t } = useTranslation();

  const [addOpen, setAddOpen] = useState(false);
  const [manual, setManual] = useState<OfferSuggestion[]>([]);
  const manualIds = new Set(manual.map((m) => m.id));
  const suggestions = [
    ...aiSuggestions,
    ...manual.filter((m) => !aiSuggestions.some((s) => s.id === m.id)),
  ];
  const removeManual = (id: string) => setManual((prev) => prev.filter((m) => m.id !== id));
  const mandatory = suggestions.filter((s) => s.confidence === "high");
  const recommended = suggestions.filter((s) => s.confidence !== "high");

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t("customerFrameworkRecommendations.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("customerFrameworkRecommendations.subtitle")}
          </p>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  confirmed
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-recommend/30 bg-recommend/10 text-recommend",
                )}
              >
                {confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {confirmed ? t("customerFrameworkRecommendations.badge.confirmed") : t("customerFrameworkRecommendations.badge.ai")}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px] text-xs leading-relaxed">
              <p className="font-medium text-foreground">
                {confirmed
                  ? "Bekreftet av kunden – bygger på den initielle KI-vurderingen"
                  : "Basert på informasjon kartlagt da kunden ble lagt til"}
              </p>
              <p className="mt-1.5">Vi hentet automatisk:</p>
              <ul className="mt-1 space-y-0.5 list-disc pl-4">
                <li>Organisasjonsnummer og selskapsdata fra offentlige registre</li>
                <li>Bransje og NACE-kode der den finnes</li>
                <li>Kundens nettsted og personvernerklæring</li>
              </ul>
              <p className="mt-1.5">
                Ut fra dette har KI-agenten anbefalt hvilke regelverk som med stor sannsynlighet er
                lovpålagte for virksomheten.
                {confirmed
                  ? " Kunden har i tillegg bekreftet vurderingen i modenhetsvurderingen."
                  : " Vurderingen bekreftes når kunden svarer på modenhetsvurderingen."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {suggestions.length === 0 && activated.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen regelverk foreslått ennå.</p>
        )}
        {suggestions.map((s) => {
          const isManual = manualIds.has(s.id);
          return (
            <span
              key={s.id}
              className={cn(
                "inline-flex items-center rounded-full border text-[11px] font-medium transition-colors",
                isManual
                  ? "border-border bg-muted/40 text-foreground hover:bg-muted"
                  : "border-recommend/60 bg-recommend/15 text-recommend hover:bg-recommend/25 hover:border-recommend",
              )}
            >
              <button
                type="button"
                onClick={() => onActivate([s])}
                title={
                  isManual
                    ? "Lagt til av deg — ikke foreslått av KI-agenten. Klikk for å aktivere."
                    : "Aktiver direkte"
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recommend focus-visible:ring-offset-1"
              >
                {s.activatable && <Zap className="h-2.5 w-2.5 shrink-0" />}
                {s.label}
                {isManual && (
                  <span className="text-[9px] uppercase tracking-wide opacity-70">
                    Manuelt valgt
                  </span>
                )}
              </button>
              {isManual && (
                <button
                  type="button"
                  onClick={() => removeManual(s.id)}
                  aria-label={`Fjern ${s.label}`}
                  className="pr-2 pl-0.5 py-1 opacity-60 hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          );
        })}
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {suggestions.some((s) => s.activatable) && (
          <button
            type="button"
            onClick={() => onActivate(suggestions.filter((s) => s.activatable))}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Aktiver alle anbefalte
          </button>
        )}
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => onOffer(suggestions)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Lag tilbud i stedet
          </button>
        )}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Legg til regelverk, standard eller retningslinje
        </button>
      </div>

      <AddFrameworkDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        activatedLabels={activated}
        existingIds={suggestions.map((s) => s.id)}
        onAdd={(item) =>
          setManual((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]))
        }
      />


      <div className="mt-auto pt-4">
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Modenhetsvurdering
              <span className="inline-flex items-center rounded border border-muted-foreground/20 bg-muted/40 px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                V2
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              {status === "sent_to_customer" && <Send className="h-3 w-3" />}
              {STATUS_TEXT[status]}
              {status !== "not_started" && ` (${answered}/${totalQuestions})`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {/* V2 — IKKE IMPLEMENTER NÅ: Modenhetsvurdering som produktisert tjeneste er planlagt i v2. */}
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
