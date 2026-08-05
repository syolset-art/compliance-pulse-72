import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Info, Globe, ArrowRight, Lock, ChevronRight } from "lucide-react";
import { MATURITY_AREAS } from "@/lib/trustMaturityQuestions";
import { getModuleState } from "@/lib/moduleActivationState";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { cn } from "@/lib/utils";
import type { BaselineAreaProgress } from "@/hooks/useCustomerBaseline";

/** Produkter som gir partneren tilgang til kundens Trust Profile. */
const GATE_MODULES: { key: string; label: string }[] = [
  { key: "core", label: "Mynder Core" },
  { key: "vendors", label: "Leverandørmodul" },
  { key: "systems", label: "Systemer" },
  { key: "assets", label: "Eiendeler (Assets)" },
  { key: "trust", label: "Trust Center" },
];

interface Props {
  customerId: string;
  customerName: string;
  customerOrgNumber?: string | null;
  areaProgress: BaselineAreaProgress[];
  totalAnswered: number;
  totalQuestions: number;
  /** Åpne fanen «Tjenester og produkter» når kunden mangler aktivt produkt. */
  onOpenProducts?: () => void;
}

/**
 * Speiler kundens modenhet per kontrollområde i sanntid, og gir partneren en
 * vei inn i kundens egen Trust Profile — forutsatt at kunden har aktivert
 * Trust Center eller et annet Mynder-produkt.
 */
export function CustomerMaturityMirrorCard({
  customerId,
  customerName,
  customerOrgNumber,
  areaProgress,
  totalAnswered,
  totalQuestions,
  onOpenProducts,
}: Props) {
  const navigate = useNavigate();
  const { enterCustomerOrg } = useActiveOrganization();
  const { setMode } = useWorkspaceMode();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("modules:changed", refresh);
    return () => window.removeEventListener("modules:changed", refresh);
  }, []);

  const activeProducts = useMemo(
    () => GATE_MODULES.filter((m) => getModuleState(m.key).status === "active"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );
  const hasAccess = activeProducts.length > 0;

  const byId = new Map(areaProgress.map((a) => [a.id, a]));
  const score = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const pctClass = (pct: number) =>
    pct >= 75 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";

  const handleEnter = () => {
    enterCustomerOrg({ id: customerId, name: customerName, orgNumber: customerOrgNumber });
    setMode("compliance");
    setDialogOpen(false);
    navigate("/trust-center/profile");
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">Modenhet per kontrollområde</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-recommend/30 bg-recommend/10 px-2 py-0.5 text-[11px] font-medium text-recommend">
              <Globe className="h-3 w-3" />
              Estimert fra baseline-svar
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">Modenhet</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs">
                  Oppdateres i sanntid fra kundens baseline-svar på tvers av de fem
                  kontrollområdene.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MATURITY_AREAS.map((area) => {
            const p = byId.get(area.id);
            const answered = p?.answered ?? 0;
            const total = p?.total ?? area.questions.length;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            const Icon = area.icon;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setDialogOpen(true)}
                className="text-left rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {area.title}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className={cn("text-xs tabular-nums", pctClass(pct))}>{pct}%</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </div>
                <Progress value={pct} className="h-1 mt-2" />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Speiler kundens Trust Profile i sanntid.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary hover:text-primary"
            onClick={() => setDialogOpen(true)}
          >
            {hasAccess ? "Åpne kundens Trust Profile" : "Om tilgang til Trust Profile"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {hasAccess
                ? `Gå til ${customerName} sin Trust Profile?`
                : "Krever et aktivt Mynder-produkt"}
            </DialogTitle>
          </DialogHeader>

          {hasAccess ? (
            <>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Du bytter til {customerName} sin organisasjon og åpner deres Trust Center og Trust
                Profile. Du kommer tilbake til partnervisningen via merkelappen i toppfeltet.
              </DialogDescription>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Tilgang er gitt gjennom:{" "}
                <span className="text-foreground font-medium">
                  {activeProducts.map((p) => p.label).join(", ")}
                </span>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleEnter} className="gap-1.5">
                  Gå til Trust Profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                For å åpne kundens Trust Center og Trust Profile må kunden ha aktivert Trust Center
                (490 kr/mnd) eller et annet Mynder-produkt, for eksempel
                Leverandørmodul eller Mynder Core.
              </DialogDescription>
              <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-2">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Modenhetstallene over er fortsatt tilgjengelige — de speiles fra kundens
                  baseline-svar.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Lukk
                </Button>
                <Button
                  onClick={() => {
                    setDialogOpen(false);
                    onOpenProducts?.();
                  }}
                  className="gap-1.5"
                >
                  Se produkter og tjenester
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
