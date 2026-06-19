import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CONTROL_AREA_BY_KEY,
  AREA_WEIGHTS,
  AREA_QUESTION_NB,
  type ControlAreaKey,
} from "@/lib/controlAreas";
import {
  getActiveControlPointsByArea,
  getRequirementWeight,
} from "@/lib/controlAreaRequirements";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { useMemo } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: ControlAreaKey | null;
  /** 0–100 score for området (gjeldende kunde). */
  areaScore: number;
  /** Aktiverte regelverk-ID-er for kunden. */
  activeFrameworkIds: string[];
}

function toneFor(score: number) {
  if (score >= 75) return { text: "text-success", bar: "bg-success" };
  if (score >= 50) return { text: "text-warning", bar: "bg-warning" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

function frameworkName(id: string): string {
  return ALL_FRAMEWORKS.find((f) => f.id === id)?.name ?? id;
}

export function ControlAreaBreakdownDrawer({
  open,
  onOpenChange,
  area,
  areaScore,
  activeFrameworkIds,
}: Props) {
  const breakdown = useMemo(() => {
    if (!area) return null;
    const all = getActiveControlPointsByArea(activeFrameworkIds);
    return all[area];
  }, [area, activeFrameworkIds]);

  if (!area) return null;

  const def = CONTROL_AREA_BY_KEY[area];
  const Icon = def.icon;
  const weightPct = Math.round(AREA_WEIGHTS[area] * 100);
  const tone = toneFor(areaScore);
  const total = breakdown?.total ?? 0;
  const fwIds = breakdown ? Object.keys(breakdown.byFramework) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 justify-between">
                <SheetTitle className="text-lg text-foreground text-left">
                  {def.labelNb}
                </SheetTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
                      title="Slik beregnes scoren"
                    >
                      <HelpCircle className="h-4.5 w-4.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-80 p-4 space-y-3 bg-popover text-popover-foreground border-border/60 shadow-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h4 className="text-sm font-semibold text-foreground">
                        Slik beregnes scoren
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                      <p>
                        Hvert område scores 0–100 ut fra hvor godt kontrollpunktene er på plass.
                        De fire områdene teller likt — 25 % hver — og andelen er den samme selv om du legger til flere regelverk.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <SheetDescription className="text-sm text-muted-foreground text-left">
                {AREA_QUESTION_NB[area]}
              </SheetDescription>
            </div>
          </div>

          {/*
            TODO (dynamisk – Mynders scoringsmodell):
            Både `areaScore`, `weightPct` og den enkelte kontrollpunktsvektingen
            skal beregnes dynamisk basert på Mynders scoringsmodell, ikke hardkodes / 
            leveres som statiske props eller faste verdier.

            - Områdescore = Σ(modenhet × vekt) / Σ(vekt) × 25
              (per kontrollpunkt i området, hentet fra aktive regelverk).
            - Vekt i Trust Score = områdets relative vekt i Mynders modell
              (holdes konstant når nye regelverk aktiveres).
            - Kontrollpunktsvekt (Vektingen per punkt i tabellen under) skal også hentes
              dynamisk basert på prioritering eller egenskap i Mynders modell.

            Når Mynder-scoring-API/-hooken er på plass, bytt ut props og lokale beregninger med
            en selektor/hook som leser live-verdier (f.eks. useMynderAreaScore(area)).
          */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Områdescore Sirkel */}
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-3">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    className="stroke-muted-foreground/10" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    className={`stroke-current ${tone.text} transition-all duration-500`} 
                    strokeWidth="3.5" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 20} 
                    strokeDashoffset={2 * Math.PI * 20 - (areaScore / 100) * (2 * Math.PI * 20)} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className={`absolute text-xs font-bold tabular-nums ${tone.text}`}>
                  {areaScore}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
                  Områdescore
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Gjeldende status
                </p>
              </div>
            </div>

            {/* Vekt i Trust Score Sirkel */}
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-3">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    className="stroke-muted-foreground/10" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    className="stroke-primary transition-all duration-500" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 20} 
                    strokeDashoffset={2 * Math.PI * 20 - (weightPct / 100) * (2 * Math.PI * 20)} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute text-xs font-bold tabular-nums text-foreground">
                  {weightPct}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
                  Vekt i Trust Score
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Total innvirkning
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-5">
          {/* 
            NOTAT: Regelverkene som vises under er de regelverkene som kunden 
            faktisk har aktivert (`activeFrameworkIds`).
          */}
          {/* Aktive regelverk */}
          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Drevet av aktive regelverk
            </h4>
            {fwIds.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Ingen aktive regelverk dekker dette området ennå. Aktiver et regelverk under «Regelverk» for å se kontrollpunkter her.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {fwIds.map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      {frameworkName(id)} · {breakdown!.byFramework[id]} pkt
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-foreground/80">
                  {total} kontrollpunkter totalt i dette området.
                </p>
              </>
            )}
          </section>

          {/* Kontrollpunkt-tabell */}
          {breakdown && breakdown.requirements.length > 0 && (
            <section className="space-y-2">
              {/* 
                NOTAT: Dette er dynamiske felter som skal vises basert på 
                kontrollpunkter knyttet til de valgte regelverkene kunden har aktivert.
              */}
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Kontrollpunkter ({total})
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left font-semibold px-3 py-2">Navn</th>
                      <th className="text-left font-semibold px-3 py-2">Regelverk</th>
                      <th className="text-right font-semibold px-3 py-2">Vekt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.requirements.slice(0, 50).map((req) => (
                      <tr
                        key={`${req.framework_id}-${req.requirement_id}`}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2 text-foreground">
                          <span className="font-mono text-xs text-muted-foreground mr-1.5">
                            {req.requirement_id}
                          </span>
                          {req.name_no || req.name}
                        </td>
                         <td className="px-3 py-2 text-muted-foreground">
                           {/* Viser kun regelverk som kunden har aktivert */}
                           {frameworkName(req.framework_id)}
                         </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground/80">
                          {/* TODO: Hent denne vektingen dynamisk fra Mynders scoringsmodell */}
                          {getRequirementWeight(req).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {breakdown.requirements.length > 50 && (
                  <p className="text-xs text-muted-foreground italic px-3 py-2 border-t border-border bg-muted/20">
                    Viser 50 av {breakdown.requirements.length} kontrollpunkter.
                  </p>
                )}
              </div>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
