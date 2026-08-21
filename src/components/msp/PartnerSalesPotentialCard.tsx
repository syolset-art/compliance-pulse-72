import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Package, Clock, Info } from "lucide-react";
import { MYNDER_PRODUCTS } from "@/lib/mynderProducts";
import { EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";

const fmt = (n: number) => n.toLocaleString("nb-NO");

/**
 * Samlet salgspotensial for partneren — øverst på «Produkter og tjenester».
 * Fordelt på lisenser (aktiverte produkter) og rådgivningstimer (lagrede pakker).
 */
export function PartnerSalesPotentialCard({ currency }: { currency: string }) {
  const { packages } = useFrameworkPackages();

  const activePackages = Object.values(packages).filter((p) => p.is_active);

  // Lisenspotensial: produkter til fra-pris + aktiverte regelverk à fast mnd-pris.
  const productLicense = MYNDER_PRODUCTS.filter((p) => p.id !== "frameworks").reduce(
    (sum, p) => sum + p.fromPrice,
    0,
  );
  const frameworkLicense = activePackages.length * EXTRA_FRAMEWORK_PRICE_KR;
  const licensePotential = productLicense + frameworkLicense;

  // Timepotensial: sum av lagrede, aktiverte rådgivningspakker.
  const advisoryPotential = activePackages.reduce((sum, p) => sum + (p.total_price ?? 0), 0);
  const advisoryHours = activePackages.reduce((sum, p) => sum + (p.total_hours ?? 0), 0);

  return (
    <Card className="p-5 border-primary/20 bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Salgspotensial per kunde</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              Hva du kan selge til én kunde — fordelt på lisenser fra Mynder og dine egne
              rådgivningstimer.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Totalt potensial</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {fmt(licensePotential)} {currency}/mnd
            {advisoryPotential > 0 && (
              <span className="text-base font-semibold text-muted-foreground">
                {" "}
                + {fmt(advisoryPotential)} {currency}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <div className="rounded-md border border-border bg-background p-3 flex items-start gap-3">
          <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">Aktiverte produkter</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    Månedlig lisensinntekt når du selger alle Mynder-produktene til én kunde.
                    Regelverk legges til med fast månedspris per aktivert regelverk (
                    {fmt(EXTRA_FRAMEWORK_PRICE_KR)} {currency}/mnd).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Lisenser per måned · {activePackages.length} regelverk aktivert
            </p>
          </div>
          <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
            {fmt(licensePotential)} {currency}/mnd
          </p>
        </div>

        <div className="rounded-md border border-border bg-background p-3 flex items-start gap-3">
          <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">Rådgivningstimer</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    Engangspotensial fra rådgivningspakkene du har satt opp per regelverk under.
                    Timer og pris justerer du selv per pakke.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              {advisoryHours > 0
                ? `${fmt(advisoryHours)} timer i aktiverte pakker`
                : "Sett opp pakker per regelverk under"}
            </p>
          </div>
          <p className="text-lg font-semibold text-foreground tabular-nums shrink-0">
            {fmt(advisoryPotential)} {currency}
          </p>
        </div>
      </div>
    </Card>
  );
}
