import { cn } from "@/lib/utils";
import { getFrameworkJurisdiction, type FrameworkJurisdiction } from "@/lib/frameworkCountry";

type CodeLike = FrameworkJurisdiction | string;

interface Props {
  frameworkId?: string | null;
  /** Single jurisdiction override (legacy single-tag). */
  jurisdiction?: FrameworkJurisdiction;
  /** Multiple country/jurisdiction codes — renders one tiny pill per code. */
  codes?: CodeLike[];
  className?: string;
}

const STYLES: Record<string, string> = {
  NO: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
  SE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  DK: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25",
  NL: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/25",
  UK: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25",
  AU: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  EU: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25",
  US: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25",
  INT: "bg-muted text-muted-foreground border-border",
};

const TITLES: Record<string, string> = {
  NO: "Norge", SE: "Sverige", DK: "Danmark", NL: "Nederland",
  UK: "Storbritannia", AU: "Australia",
  EU: "EU", US: "USA", INT: "Internasjonal standard",
};

function Tag({ code, className }: { code: string; className?: string }) {
  const style = STYLES[code] ?? STYLES.INT;
  return (
    <span
      title={TITLES[code] ?? code}
      className={cn(
        "inline-flex items-center justify-center align-middle rounded-sm border px-1 py-0 text-[11px] font-semibold leading-[14px] tracking-wider tabular-nums",
        style,
        className
      )}
    >
      {code}
    </span>
  );
}

/** Tiny country/jurisdiction tag — meant to sit next to a framework name. */
export function FrameworkCountryTag({ frameworkId, jurisdiction, codes, className }: Props) {
  if (codes && codes.length > 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 align-middle", className)}>
        {codes.map((c) => <Tag key={c} code={c} />)}
      </span>
    );
  }
  const code = jurisdiction ?? getFrameworkJurisdiction(frameworkId);
  return <Tag code={code} className={className} />;
}
