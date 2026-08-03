import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModuleStatus = "active" | "inactive" | "included" | "pending_cancellation";

export interface ModuleCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  status: ModuleStatus;
  price: number;
  priceLabel?: string;
  usage?: string;
  usageSuffix?: string;
  usageLimit?: string;
  action: "open" | "activate" | "change" | "manage" | "none";
  onClick?: () => void;
  onDeactivate?: () => void;
  deactivateLabel?: string;
  /** Vises når status er pending_cancellation, f.eks. "3. september". */
  cancelAtLabel?: string;
  onResume?: () => void;
  accentColor?: "purple" | "blue" | "emerald" | "amber" | "rose" | "slate";
  breakdown?: Array<{ label: string; priceKr: number }>;
  footer?: React.ReactNode;
  ctaOverride?: { label: string; variant?: "default" | "outline" };
  onReadMore?: () => void;
}






const actionLabel: Record<Exclude<ModuleCardProps["action"], "none">, string> = {
  open: "Åpne modulen",
  activate: "Aktiver",
  change: "Endre nivå",
  manage: "Legg til regelverk",
};

export function ModuleCard({
  title,
  description,
  status,
  price,
  priceLabel,
  usage,
  usageSuffix,
  usageLimit,
  action,
  onClick,
  onDeactivate,
  deactivateLabel,
  cancelAtLabel,
  onResume,
  breakdown,
  footer,
  ctaOverride,
  onReadMore,

}: ModuleCardProps) {
  const isPendingCancel = status === "pending_cancellation";
  const canDeactivate = !!onDeactivate && status === "active";
  const isIncluded = status === "included";

  const formattedPrice = new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
  }).format(price);


  // Build the subtle usage/info line under the description
  let usageLine: React.ReactNode = null;
  const usageNum = usage ? Number(usage) : NaN;
  const limitNum = usageLimit ? Number(usageLimit) : NaN;
  const hasBar = !Number.isNaN(usageNum) && !Number.isNaN(limitNum) && limitNum > 0;

  if (breakdown && breakdown.length > 0) {
    const names = breakdown.slice(0, 4).map((b) => b.label).join(", ");
    const extra = breakdown.length > 4 ? ` +${breakdown.length - 4}` : "";
    usageLine = (
      <p className="text-xs text-muted-foreground mt-2 truncate">
        {breakdown.length} aktive: {names}{extra}
      </p>
    );
  } else if (hasBar) {
    const pct = Math.min(100, Math.round((usageNum / limitNum) * 100));
    const atCap = usageNum >= limitNum;
    usageLine = (
      <div className="mt-3 space-y-1.5 max-w-xs">
        <p className={cn("text-xs", atCap ? "text-amber-700" : "text-muted-foreground")}>
          {usageNum} av {limitNum} {usageSuffix ?? ""} i bruk
        </p>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", atCap ? "bg-amber-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>

      </div>
    );
  } else if (usage) {
    usageLine = (
      <p className="text-xs text-muted-foreground mt-2">
        {usage} {usageSuffix ?? ""}
      </p>
    );
  } else if (priceLabel && isIncluded) {
    usageLine = <p className="text-xs text-muted-foreground mt-2">{priceLabel}</p>;
  }

  const showFreePrice = isIncluded || (status === "active" && price === 0);

  return (
    <Card className="border-border bg-card transition-shadow hover:shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-6">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-base">{title}</h3>
              {priceLabel && !isIncluded && (status === "active" || isPendingCancel) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-primary/20 bg-primary/5 text-primary">
                  {priceLabel}
                </span>
              )}
              {isPendingCancel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted text-muted-foreground">
                  Sagt opp{cancelAtLabel ? ` — aktiv til ${cancelAtLabel}` : ""}
                </span>
              )}

            </div>
            {description && (
              <p className="text-sm text-muted-foreground leading-snug mt-1">{description}</p>
            )}
            {usageLine}
            {onReadMore && (
              <button
                type="button"
                onClick={onReadMore}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 mt-2 transition-colors"
              >
                Les mer
              </button>
            )}
          </div>

          {/* Right: price + actions */}
          <div className="shrink-0 text-right flex flex-col items-end gap-2 min-w-[180px]">
            {showFreePrice ? (
              <div>
                <div className="text-xl font-bold text-primary">Gratis</div>
                <div className="text-xs text-muted-foreground">
                  {isIncluded ? "inkludert i Core" : priceLabel ?? ""}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xl font-bold text-foreground">{formattedPrice} kr</div>
                <div className="text-xs text-muted-foreground">per måned</div>
              </div>
            )}

            {isPendingCancel ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onResume}>
                  Angre oppsigelse
                </Button>
              </div>
            ) : action !== "none" && (
              <div className="flex items-center gap-2">
                {canDeactivate && (
                  <button
                    type="button"
                    onClick={onDeactivate}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deactivateLabel || "Avslutt"}
                  </button>
                )}
                <Button
                  variant={ctaOverride?.variant ?? (status === "inactive" ? "default" : "outline")}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClick}
                >
                  {ctaOverride?.label ?? actionLabel[action]}
                </Button>
              </div>
            )}

          </div>
        </div>

        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </Card>
  );

}
