import { cn } from "@/lib/utils";
import {
  FRESHNESS_LABEL,
  SOURCE_CLASS_LABEL,
  UNKNOWN_TEXT,
  formatPinDate,
  type Pin,
} from "@/lib/pin";
import { PinBadge } from "./PinBadge";

/**
 * Metalinje under en tittel: Pin + kilde + kontrolldato.
 * Fast høyde-slot slik at kort ikke hopper når Pin mangler.
 */
export function PinMetaLine({ pin, className }: { pin?: Pin; className?: string }) {
  const sourceText = pin
    ? pin.source.sourceRef || SOURCE_CLASS_LABEL[pin.source.sourceClass]
    : UNKNOWN_TEXT;
  const checkedText = pin
    ? pin.freshness.checkedAt
      ? formatPinDate(pin.freshness.checkedAt)
      : FRESHNESS_LABEL[pin.freshness.flag]
    : UNKNOWN_TEXT;

  return (
    <div className={cn("mt-1.5 flex min-h-[26px] flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <PinBadge pin={pin} />
      <span className="truncate text-[11px] text-muted-foreground" title={sourceText}>
        {sourceText}
      </span>
      <span aria-hidden="true" className="text-[11px] text-muted-foreground">·</span>
      <span className="text-[11px] text-muted-foreground">Sist kontrollert {checkedText}</span>
    </div>
  );
}
