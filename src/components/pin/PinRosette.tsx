import { cn } from "@/lib/utils";
import { PIN_LEVEL_ROSETTE_CLASS, type PinAttestationLevel } from "@/lib/pin";

/** 20-punkts rosett, alltid fylt. Uthulet merke inni bærer mening uten farge. */
function rosettePath(): string {
  const cx = 12;
  const cy = 12;
  const outer = 11;
  const inner = 8.2;
  const points: string[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = (-90 + i * 18) * (Math.PI / 180);
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
}

const ROSETTE_D = rosettePath();

export function PinRosette({
  level,
  className,
}: {
  level: PinAttestationLevel;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0", PIN_LEVEL_ROSETTE_CLASS[level], className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ROSETTE_D} fill="currentColor" fillRule="evenodd" />
      {level === "human_verified" ? (
        <circle cx="12" cy="12" r="2.6" className="fill-background" />
      ) : (
        <rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1" className="fill-background" />
      )}
    </svg>
  );
}
