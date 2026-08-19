import { cn } from "@/lib/utils";

interface SaraIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/** Circular "S" icon representing the local Sara agent. */
export function SaraIcon({ size = 20, className, ariaLabel }: SaraIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-white shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={ariaLabel ?? "Sara"}
    >
      <span className="font-semibold leading-none" style={{ fontSize: Math.round(size * 0.5) }}>
        S
      </span>
    </span>
  );
}
