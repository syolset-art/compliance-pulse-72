import { cn } from "@/lib/utils";

interface LaraIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/** Circular "L" icon representing the Lara cloud agent. */
export function LaraIcon({ size, className, ariaLabel }: LaraIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/25 shrink-0",
        !size && "h-4 w-4",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
      aria-label={ariaLabel ?? "Lara"}
    >
      <span className="font-semibold leading-none" style={{ fontSize: Math.round((size ?? 16) * 0.5) }}>
        L
      </span>
    </span>
  );
}
