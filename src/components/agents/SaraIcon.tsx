import { cn } from "@/lib/utils";

interface SaraIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/** Circular "S" icon representing the local Sara agent.
 *  If `size` is provided, it sets fixed width/height via inline style.
 *  Otherwise, use Tailwind sizing classes via `className`.
 */
export function SaraIcon({ size, className, ariaLabel }: SaraIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-white shrink-0",
        !size && "h-4 w-4",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
      aria-label={ariaLabel ?? "Sara"}
    >
      <span className="font-semibold leading-none" style={{ fontSize: Math.round((size ?? 16) * 0.5) }}>
        S
      </span>
    </span>
  );
}
