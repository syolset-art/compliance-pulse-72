import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
}: MynderResellCardProps) {
  const { get, update } = useMynderResellSettings();
  const setting = get(productId);
  const { currencyOption } = useServiceDefaults();
  const sym = currencyOption.symbol;
  // NOK / SEK / DKK use trailing symbol convention here
  const trailing = ["kr"].includes(sym);

  const commissionAmount = (monthlyLicenseKr * setting.commissionPct) / 100;
  const monthlyIncome =
    commissionAmount + (setting.setupFeeEnabled ? setting.setupFee / 12 : 0);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">{name}</h4>
            <Badge variant="secondary" className="text-xs h-5">Alltid inkludert</Badge>
          </div>
          <p className="text-sm text-foreground/70 mt-0.5 leading-snug">{description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Lisens {priceNote ?? ""}</div>
          <div className="text-base font-semibold tabular-nums text-foreground">
            {formatMoney(monthlyLicenseKr, sym, trailing)}
            <span className="text-sm font-normal text-foreground/60">/mnd</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-3 items-end pt-2 border-t border-border">
        <div className="space-y-1">
          <Label htmlFor={`comm-${productId}`} className="text-xs text-foreground/70">
            Din provisjon (20–50 %)
          </Label>
          <div className="relative">
            <Input
              id={`comm-${productId}`}
              type="number"
              min={20}
              max={50}
              step={5}
              value={setting.commissionPct}
              onChange={(e) => update(productId, { commissionPct: Number(e.target.value) })}
              className="h-9 text-sm tabular-nums pr-7"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-foreground/60">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Switch
              id={`fee-${productId}`}
              checked={setting.setupFeeEnabled}
              onCheckedChange={(v) => update(productId, { setupFeeEnabled: v })}
            />
            <Label htmlFor={`fee-${productId}`} className="text-xs text-foreground/70">
              Etableringsgebyr (engangsbeløp)
            </Label>
          </div>
          <Input
            type="number"
            min={0}
            step={500}
            value={setting.setupFee}
            disabled={!setting.setupFeeEnabled}
            onChange={(e) => update(productId, { setupFee: Number(e.target.value) })}
            className="h-9 text-sm tabular-nums"
            placeholder="0"
          />
        </div>

        <div className="text-right md:min-w-[140px]">
          <div className="text-xs text-muted-foreground">Estimert inntekt</div>
          <div className="text-base font-semibold tabular-nums text-success">
            {formatMoney(monthlyIncome, sym, trailing)}
            <span className="text-sm font-normal text-foreground/60">/mnd</span>
          </div>
          <div className="text-xs text-muted-foreground">pr kunde</div>
        </div>
      </div>
    </Card>
  );
}
