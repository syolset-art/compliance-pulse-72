import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { entryRouteFor } from "@/lib/customerEntryRoutes";
import {
  TRUST_CENTER_EVENT,
  TRUST_CENTER_STATUS_LABEL,
  formatTrustDate,
  getTrustCenterState,
  markClaimSent,
  markClaimed,
  markPublished,
  trustCenterStatusFor,
} from "@/lib/trustCenterStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerOrgNumber?: string | null;
  customerEmail?: string;
}

/** Anbefalt modenhet før kunden bør claime Trust Profilen. */
const CLAIM_THRESHOLD = 55;

type StepState = "done" | "current" | "waiting";

export function TrustCenterGuideSheet({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerOrgNumber,
  customerEmail,
}: Props) {
  const navigate = useNavigate();
  const { enterCustomerOrg } = useActiveOrganization();
  const { setMode } = useWorkspaceMode();
  const { totalAnswered, totalQuestions } = useCustomerBaseline(customerId);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener(TRUST_CENTER_EVENT, refresh);
    return () => window.removeEventListener(TRUST_CENTER_EVENT, refresh);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const state = getTrustCenterState(customerId);
  const status = trustCenterStatusFor(customerId, true);
  void tick;

  const maturity = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const claimRecommended = maturity >= CLAIM_THRESHOLD;

  const handleEnterCustomer = () => {
    enterCustomerOrg({ id: customerId, name: customerName, orgNumber: customerOrgNumber });
    setMode("compliance");
    onOpenChange(false);
    navigate(
      entryRouteFor({ id: "trust", label: "Trust Center", kind: "module", moduleKey: "trust" }),
    );
  };

  const steps: {
    title: string;
    body: React.ReactNode;
    state: StepState;
    action?: { label: string; onClick: () => void };
  }[] = [
    {
      title: "Trust Center aktivert",
      body: "Produktet er aktivt hos kunden og faktureres på neste faktura.",
      state: "done",
    },
    {
      title: "Send claim til kunden",
      body: (
        <>
          Claim-e-post sendes til{" "}
          <span className="text-foreground">{customerEmail ?? "kundens kontaktperson"}</span>.
          {state.claimSentAt && (
            <> Sist sendt {formatTrustDate(state.claimSentAt)}.</>
          )}
          <span className="block mt-1">
            Modenhet i dag: <span className="text-foreground font-medium">{maturity} %</span>.{" "}
            {claimRecommended
              ? "Over anbefalt nivå (55 %) — claim kan sendes nå."
              : "Under anbefalt nivå (55 %). Dere vurderer selv om claim skal sendes nå."}
          </span>
        </>
      ),
      state: state.claimSentAt ? "done" : status === "activated" ? "current" : "waiting",
      action: {
        label: state.claimSentAt ? "Send på nytt" : "Send claim-e-post",
        onClick: () => {
          markClaimSent(customerId);
          toast.success(`Claim-e-post sendt til ${customerEmail ?? customerName}`);
        },
      },
    },
    {
      title: "Kunden claimer profilen",
      body: "Kunden godkjenner og tar eierskap til Trust Profilen. Dere kan jobbe videre i mellomtiden.",
      state: state.claimedAt ? "done" : state.claimSentAt ? "current" : "waiting",
      action: state.claimedAt
        ? undefined
        : {
            label: "Marker som claimet",
            onClick: () => {
              markClaimed(customerId);
              toast.success("Registrert som claimet av kunden");
            },
          },
    },
    {
      title: "Fyll ut Trust Profilen",
      body: "Som driftspartner kan dere arbeide med Trust Profilen i kundens egen organisasjonsprofil.",
      state: state.publishedAt ? "done" : state.claimedAt ? "current" : "waiting",
      action: { label: "Jobb med Trust Profilen", onClick: handleEnterCustomer },
    },
    {
      title: "Publiser Trust Center",
      body: "Når profilen er klar kan den deles med kundens kunder og leverandører.",
      state: state.publishedAt ? "done" : state.claimedAt ? "current" : "waiting",
      action: state.publishedAt
        ? undefined
        : {
            label: "Marker som publisert",
            onClick: () => {
              markPublished(customerId);
              toast.success("Trust Center markert som publisert");
            },
          },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Trust Center hos {customerName}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {TRUST_CENTER_STATUS_LABEL[status]}
          </SheetDescription>
        </SheetHeader>

        <ol className="mt-6 space-y-5">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                {s.state === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : s.state === "current" ? (
                  <Loader2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    s.state === "waiting" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {i + 1}. {s.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.body}</p>
                {s.action && (
                  <Button
                    size="sm"
                    variant={s.state === "current" ? "default" : "outline"}
                    className="h-7 text-xs mt-2"
                    onClick={s.action.onClick}
                  >
                    {s.action.label}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
