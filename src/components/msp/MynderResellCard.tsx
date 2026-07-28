import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMynderResellSettings } from "@/hooks/useMynderResellSettings";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";

export interface MynderResellCardProps {
  productId: string;
  name: string;
  description: string;
  monthlyLicenseKr: number; // base license price (Mynder's list price)
  priceNote?: string; // e.g. "fra" for tier-based pricing
  /** Fast provisjon satt av Mynder (partneren kan ikke endre). */
  commissionPct: number;
}

function formatMoney(amount: number, symbol: string, symbolAfter: boolean): string {
  const n = new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));
  return symbolAfter ? `${n} ${symbol}` : `${symbol} ${n}`;
}

export function MynderResellCard({
  productId,
  name,
  description,
  monthlyLicenseKr,
  priceNote,
  commissionPct,
}: MynderResellCardProps) {
  const { get, update } = useMynderResellSettings();
  const setting = get(productId);
  const { currencyOption } = useServiceDefaults();
  const sym = currencyOption.symbol;
  // NOK / SEK / DKK use trailing symbol convention here
  const trailing = ["kr"].includes(sym);

  const commissionAmount = (monthlyLicenseKr * commissionPct) / 100;
  const monthlyIncome =
    commissionAmount + (setting.setupFeeEnabled ? setting.setupFee / 12 : 0);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">{name}</h4>
          <p className="text-sm text-foreground/70 mt-0.5 leading-snug">{description}</p>
        </div>
        <div className="text-right shrink-0 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Kundens pris pr mnd</div>
            <div className="text-base font-semibold tabular-nums text-foreground">
              {formatMoney(monthlyLicenseKr, sym, trailing)}
              <span className="text-sm font-normal text-foreground/60">/mnd</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Din inntekt pr mnd</div>
            <div className="text-base font-semibold tabular-nums text-success">
              {formatMoney(monthlyIncome, sym, trailing)}
              <span className="text-sm font-normal text-foreground/60">/mnd</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground italic">
          Du kan legge til etableringsgebyr når du lager tilbud. Dette er valgfritt.
        </div>

        <div className="text-right text-[11px] text-muted-foreground">
          Provisjon satt av Mynder: <span className="font-medium text-foreground">{commissionPct}%</span>
        </div>
      </div>
    </Card>
  );
}
