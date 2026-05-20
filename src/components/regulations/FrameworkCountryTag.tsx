import { cn } from "@/lib/utils";
import { getFrameworkJurisdiction, type FrameworkJurisdiction } from "@/lib/frameworkCountry";

interface Props {
  frameworkId?: string | null;
  jurisdiction?: FrameworkJurisdiction;
  className?: string;
}

const STYLES: Record<FrameworkJurisdiction, string> = {
  NO: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
  EU: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25",
  US: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25",
  INT: "bg-muted text-muted-foreground border-border",
};

const TITLES: Record<FrameworkJurisdiction, string> = {
  NO: "Norge",
  EU: "EU",
  US: "USA",
  INT: "Internasjonal standard",
};

/** Tiny country/jurisdiction tag — meant to sit next to a framework name. */
export function FrameworkCountryTag({ frameworkId, jurisdiction, className }: Props) {
  const code = jurisdiction ?? getFrameworkJurisdiction(frameworkId);
  return (
    <span
      title={TITLES[code]}
      className={cn(
        "inline-flex items-center justify-center align-middle rounded-sm border px-1 py-0 text-[9px] font-semibold leading-[14px] tracking-wider tabular-nums",
        STYLES[code],
        className
      )}
    >
      {code}
    </span>
  );
}
