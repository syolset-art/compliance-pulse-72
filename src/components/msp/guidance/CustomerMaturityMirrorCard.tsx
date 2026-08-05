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
import { ShieldCheck, Info, Globe, ArrowRight, Lock, ChevronRight, FileCheck, TrendingUp } from "lucide-react";
import { MATURITY_AREAS } from "@/lib/trustMaturityQuestions";
import { getMaturityBand, MATURITY_BANDS } from "@/lib/scoringEngine";
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
  /** True så snart partneren har svart på minst ett baseline-spørsmål. */
  hasBaselineAnswers?: boolean;
  /** Funn fra Laras kartlegging da kunden ble lagt til. */
  privacyPolicyUrl?: string | null;
  /** Åpne fanen «Tjenester og produkter» når kunden mangler aktivt produkt. */
  onOpenProducts?: () => void;
  /** Snarvei til anbefalte tjenester og produkter. */
  onSeeServices?: () => void;
  /** Snarvei til kundens Regelverk-fane. */
  onActivateFrameworks?: () => void;
}

/**
 * Startpunkt fra kartleggingen: en publisert personvernerklæring dekker ett
 * kontrollpunkt i Styring og ansvar (gov.privacy_policy) og ett i Personvern
 * (pri.legal_basis — grunnlaget er beskrevet i erklæringen).
 */
const STARTING_POINT_AREAS: Record<string, number> = { governance: 1, privacy: 1 };

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
  hasBaselineAnswers = false,
  privacyPolicyUrl,
  onOpenProducts,
  onSeeServices,
  onActivateFrameworks,
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

  /** Vis startpunkt fra kartleggingen inntil partneren har svart selv. */
  const usingStartingPoint = !hasBaselineAnswers && !!privacyPolicyUrl;

  const effectiveProgress = useMemo<BaselineAreaProgress[]>(() => {
    if (!usingStartingPoint) return areaProgress;
    return areaProgress.map((a) => ({
      ...a,
      answered: Math.min(a.total, STARTING_POINT_AREAS[a.id] ?? 0),
    }));
  }, [areaProgress, usingStartingPoint]);

  const byId = new Map(effectiveProgress.map((a) => [a.id, a]));
  const effectiveAnswered = usingStartingPoint
    ? effectiveProgress.reduce((s, a) => s + a.answered, 0)
    : totalAnswered;
  const score = totalQuestions > 0 ? Math.round((effectiveAnswered / totalQuestions) * 100) : 0;
  const totalBand = getMaturityBand(score);


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
              {usingStartingPoint ? "Startpunkt fra Laras kartlegging" : "Estimert fra baseline-svar"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">Modenhet</span>
            <span className={cn("text-sm font-semibold tabular-nums", totalBand.textClass)}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className="text-[11px] text-muted-foreground">· {totalBand.label}</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-xs leading-relaxed">
                  Modenhet måles per kontrollområde etter Mynders scoringsmodell (v1). De fem
                  områdene vektes fast: Personvern 30 %, Styring 25 %, Drift og sikkerhet 25 %,
                  Identitet og tilgang 10 %, Tredjepart og verdikjede 10 %. Score øker når kunden
                  svarer ut, dokumenterer eller verifiserer kontroller — ikke av at data registreres.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Modenhet øker for hvert krav som fylles opp innenfor regelverkene kunden har aktivert.
        </p>

        {usingStartingPoint && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Personvernerklæring funnet på kundens nettsted → teller på Styring og ansvar og
              Personvern. Startpunktet er et estimat og erstattes så snart baseline besvares.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

          {MATURITY_AREAS.map((area) => {
            const p = byId.get(area.id);
            const answered = p?.answered ?? 0;
            const total = p?.total ?? area.questions.length;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            const band = getMaturityBand(pct);
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
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{band.label}</span>
                    <span className={cn("text-xs tabular-nums", band.textClass)}>{pct}%</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={cn("h-1 mt-2 [&>div]:transition-all", band.barClass)}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {MATURITY_BANDS.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("h-1.5 w-3 rounded-full", b.id === "none" ? "bg-muted" : b.dotClass)} />
              {b.label}
            </span>
          ))}
          <span className="text-[11px] text-muted-foreground/80">
            Basert på Mynders scoringsmodell (v1)
          </span>
        </div>

        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed min-w-0 flex-1">
            <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Du hever kundens modenhet ved å levere egne tjenester som dekker kravene i aktiverte
            regelverk — og ved å aktivere Mynder-produkter.
          </span>
          {onSeeServices && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={onSeeServices}>
              Se anbefalte tjenester
            </Button>
          )}
          {onActivateFrameworks && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={onActivateFrameworks}>
              Aktiver regelverk
            </Button>
          )}
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
