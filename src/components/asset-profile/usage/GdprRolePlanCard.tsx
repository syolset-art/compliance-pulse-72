import { Sparkles, CheckCircle2, UserRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GdprRolePlan } from "@/lib/vendorGdprRolePlan";
import { gdprRoleLabel } from "@/lib/vendorGdprRolePlan";

interface Props {
  isNb: boolean;
  plan: GdprRolePlan;
  loading?: boolean;
  /** Navn på den som godkjente forslaget, hvis godkjent */
  approvedBy?: string | null;
  approvedAt?: string | null;
  /** Planen er godkjent og utført */
  approved?: boolean;
  /** ID-er på steg som er ferdigstilt */
  completedStepIds?: string[];
  onToggleStep?: (id: string) => void;
  onApprove: () => void;
  onDismiss: () => void;
}

const confidenceLabel = (c: GdprRolePlan["confidence"], isNb: boolean) => {
  if (c === "high") return isNb ? "Høy sikkerhet" : "High confidence";
  if (c === "medium") return isNb ? "Middels sikkerhet" : "Medium confidence";
  return isNb ? "Lav sikkerhet" : "Low confidence";
};

export const GdprRolePlanCard = ({
  isNb, plan, loading, approvedBy, approvedAt, approved, completedStepIds = [],
  onToggleStep, onApprove, onDismiss,
}: Props) => {
  if (approved) {
    const openSteps = plan.steps.filter((s) => !s.byLara && !completedStepIds.includes(s.id));
    const doneSteps = plan.steps.filter((s) => s.byLara || completedStepIds.includes(s.id));
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success/15">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          </span>
          <p className="text-[13px] font-medium text-foreground">
            {openSteps.length === 0
              ? (isNb ? "Planen er godkjent og fullført" : "Plan approved and completed")
              : (isNb ? "Planen er godkjent — Lara har utført sine steg" : "Plan approved — Lara completed her steps")}
          </p>
          <Badge variant="outline" className="text-[11px] font-normal">
            {gdprRoleLabel(plan.role, isNb)}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isNb ? "Utført" : "Completed"}
          </p>
          <ul className="space-y-1">
            {doneSteps.map((s) => (
              <li key={s.id} className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                <span className="line-through decoration-muted-foreground/40">{isNb ? s.labelNb : s.labelEn}</span>
              </li>
            ))}
          </ul>
        </div>

        {openSteps.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isNb ? "Gjenstår hos deg" : "Remaining for you"}
            </p>
            <ul className="space-y-1">
              {openSteps.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-2 text-[13px] text-foreground leading-snug">
                  <span>{isNb ? s.labelNb : s.labelEn}</span>
                  {onToggleStep && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 text-[12px]"
                      onClick={() => onToggleStep(s.id)}
                    >
                      {isNb ? "Marker som gjort" : "Mark as done"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {approvedBy && (
          <p className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
            <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isNb ? "Godkjent av " : "Approved by "}{approvedBy}{approvedAt ? `, ${approvedAt}` : ""}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        </span>
        <p className="text-[13px] font-medium text-foreground">
          {isNb ? "Laras plan for GDPR-rolle" : "Lara's plan for the GDPR role"}
        </p>
        <Badge variant="outline" className="text-[11px] font-normal">
          {confidenceLabel(plan.confidence, isNb)}
        </Badge>
      </div>

      <p className="text-[13px] text-foreground leading-snug">
        {isNb ? "Lara foreslår rollen " : "Lara suggests the role "}
        <span className="font-semibold">{gdprRoleLabel(plan.role, isNb)}</span>
        {plan.matchesCurrent ? (isNb ? " — som allerede er satt." : " — which is already set.") : "."}
      </p>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isNb ? "Lara har lagt til grunn" : "What Lara based this on"}
        </p>
        <ul className="space-y-0.5">
          {(isNb ? plan.evidenceNb : plan.evidenceEn).map((e) => (
            <li key={e} className="text-[13px] text-muted-foreground leading-snug">• {e}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isNb ? "Dette skjer når du godkjenner" : "This happens when you approve"}
        </p>
        <ul className="space-y-1">
          {plan.steps.map((s) => (
            <li key={s.id} className="flex items-start gap-1.5 text-[13px] text-foreground leading-snug">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                {isNb ? s.labelNb : s.labelEn}{" "}
                <span className="text-muted-foreground">
                  {s.byLara
                    ? (isNb ? "(Lara gjør dette)" : "(Lara does this)")
                    : (isNb ? "(krever din beslutning)" : "(needs your decision)")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {approvedBy ? (
        <p className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {isNb ? "Godkjent av " : "Approved by "}{approvedBy}{approvedAt ? `, ${approvedAt}` : ""}
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-snug">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {isNb
              ? "Ingenting endres før du godkjenner planen."
              : "Nothing changes until you approve the plan."}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-0.5">
        <Button size="sm" className="h-8 gap-1.5 text-[13px]" disabled={loading} onClick={onApprove}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {isNb ? "Godkjenn planen" : "Approve the plan"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-[13px]" onClick={onDismiss}>
          {isNb ? "Avvis – jeg setter selv" : "Dismiss – I'll set it myself"}
        </Button>
      </div>
    </div>
  );
};
