import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Settings2, Sparkles, MoreVertical, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModuleStatus = "active" | "inactive" | "included";

export interface ModuleCardProps {
  icon: React.ComponentType<{ className?: string }>;
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
  accentColor?: "purple" | "blue" | "emerald" | "amber" | "rose" | "slate";
}

const statusConfig = {
  active: {
    label: "Aktiv",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
  },
  included: {
    label: "Inkludert",
    dot: "bg-primary",
    text: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
  },
  inactive: {
    label: "Ikke aktivert",
    dot: "bg-slate-400",
    text: "text-slate-500",
    border: "border-slate-200",
    bg: "bg-slate-50/50",
  },
};

const accentConfig = {
  purple: "bg-purple-50 text-purple-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

const actionLabel: Record<Exclude<ModuleCardProps["action"], "none">, string> = {
  open: "Åpne modulen",
  activate: "Aktiver",
  change: "Endre nivå",
  manage: "Administrer",
};

export function ModuleCard({
  icon: Icon,
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
  accentColor = "purple",
}: ModuleCardProps) {
  const cfg = statusConfig[status];
  const accent = accentConfig[accentColor];
  const canDeactivate = !!onDeactivate && status === "active";

  const formattedPrice = new Intl.NumberFormat("no-NB", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        "border-border bg-card"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", accent)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground leading-snug">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                cfg.border,
                cfg.bg,
                cfg.text
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            {canDeactivate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={onDeactivate}
                    className="text-destructive focus:text-destructive gap-2"
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    {deactivateLabel || "Deaktiver modul"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>


        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{formattedPrice}</span>
              <span className="text-xs text-muted-foreground">/mnd</span>
            </div>
            {priceLabel && <p className="text-xs text-muted-foreground">{priceLabel}</p>}
          </div>

          {(usage || usageLimit) && (
            <div className="text-right shrink-0">
              {usage && (
                <div className="text-sm font-medium text-foreground">
                  {usage}
                  {usageLimit && <span className="text-muted-foreground font-normal"> / {usageLimit}</span>}
                  {usageSuffix && <span className="text-muted-foreground font-normal"> {usageSuffix}</span>}
                </div>
              )}
              {!usage && usageLimit && (
                <div className="text-sm text-muted-foreground">Inntil {usageLimit}</div>
              )}
            </div>
          )}
        </div>

        {action !== "none" && (
          <Button
            variant={status === "inactive" ? "default" : "outline"}
            size="sm"
            className="w-full mt-4 gap-1.5 text-xs"
            onClick={onClick}
          >
            {action === "activate" && <Sparkles className="h-3.5 w-3.5" />}
            {action === "open" && <ExternalLink className="h-3.5 w-3.5" />}
            {action === "change" && <Settings2 className="h-3.5 w-3.5" />}
            {action === "manage" && <Settings2 className="h-3.5 w-3.5" />}
            {actionLabel[action]}
          </Button>
        )}
      </div>
    </Card>
  );
}
