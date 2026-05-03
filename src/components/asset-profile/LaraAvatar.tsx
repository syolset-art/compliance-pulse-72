import { cn } from "@/lib/utils";

interface LaraAvatarProps {
  size?: number;
  variant?: "primary" | "light";
  className?: string;
  pulse?: boolean;
}

/** Lara — Mynder AI agent visual signature.
 *  primary: mynder-blue circle with white butterfly (default, on light bg)
 *  light:   white circle with mynder-blue butterfly (use on dark bg)
 */
export function LaraAvatar({ size = 28, variant = "primary", className, pulse }: LaraAvatarProps) {
  const isPrimary = variant === "primary";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0",
        isPrimary ? "bg-[hsl(var(--primary))]" : "bg-white border border-[hsl(var(--primary))]/20",
        pulse && "animate-pulse",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Lara"
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        fill="none"
        aria-hidden
      >
        {/* Stylized butterfly */}
        <path
          d="M12 12c-1.6-3.2-4.2-5-6.4-5-1.6 0-2.6 1.1-2.6 2.7 0 2.4 2.4 5.3 5.4 6.5C6.8 17.5 6 18.7 6 20c0 .9.7 1.5 1.6 1.5 1.5 0 3.3-1.4 4.4-3.5 1.1 2.1 2.9 3.5 4.4 3.5.9 0 1.6-.6 1.6-1.5 0-1.3-.8-2.5-2.4-3.8 3-1.2 5.4-4.1 5.4-6.5 0-1.6-1-2.7-2.6-2.7-2.2 0-4.8 1.8-6.4 5z"
          fill={isPrimary ? "white" : "hsl(var(--primary))"}
        />
        <circle cx="12" cy="6" r="1.4" fill={isPrimary ? "white" : "hsl(var(--primary))"} />
      </svg>
    </span>
  );
}
