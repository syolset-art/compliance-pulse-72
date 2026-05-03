import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, ChevronDown } from "lucide-react";
import { ALL_VENDOR_STATUSES } from "@/lib/vendorStatus";

/**
 * Synlig fargeforklaring for leverandørstripen.
 * Hjelper brukeren å forstå hva fargene på leverandørkortet betyr.
 */
export function VendorStatusLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-lg border border-border bg-muted/30", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[13px] font-medium text-foreground">Hva betyr fargene på leverandørkortene?</span>
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            {ALL_VENDOR_STATUSES.map((s) => (
              <span
                key={s.key}
                className={cn("relative h-3 w-3 rounded-sm", s.stripeBg)}
                title={`${s.label} · ${s.hex}`}
              >
                {s.hasActiveDot && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-success ring-1 ring-background" />
                )}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 px-3 pb-3">
          {ALL_VENDOR_STATUSES.map((s) => (
            <div
              key={s.key}
              className="flex items-stretch rounded-md border border-border bg-background overflow-hidden"
            >
              <div className={cn("relative w-2 shrink-0", s.stripeBg)}>
                {s.hasActiveDot && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-success ring-1 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0 px-2.5 py-1.5">
                <span className="text-[13px] font-semibold text-foreground">{s.label}</span>
                <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">
                  {s.description}
                  {s.hasActiveDot && " · grønn prikk = aktiv"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
