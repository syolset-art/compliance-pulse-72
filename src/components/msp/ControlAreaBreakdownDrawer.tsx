import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
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
              <SheetTitle className="text-lg text-foreground text-left">
                {def.labelNb}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground text-left">
                {AREA_QUESTION_NB[area]}
              </SheetDescription>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Områdescore
              </p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${tone.text}`}>
                {areaScore}%
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Vekt i Trust Score
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                {weightPct}%
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-5">
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
                          {frameworkName(req.framework_id)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground/80">
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

          {/* Slik beregnes scoren */}
          <section className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-foreground">
                Slik beregnes scoren
              </h4>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Områdescore = <span className="font-mono">Σ(modenhet × vekt) / Σ(vekt) × 25</span>
              {" "}— der hvert kontrollpunkt får modenhet 0–4 og vekt 1.0 (MVP).
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Områdets vekt i den samlede Trust Score er <strong>{weightPct}%</strong>.
              Når nye regelverk aktiveres, øker antall kontrollpunkter — men områdevekten holdes konstant.
            </p>
            <Link
              to="/resources/maturity"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              Les hele metoden
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
