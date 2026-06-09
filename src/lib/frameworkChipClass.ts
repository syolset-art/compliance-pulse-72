/**
 * Neutral, professional framework chip styling.
 * One restrained palette across all frameworks — credibility over color-coding.
 * Standards (ISO/SOC) get a slightly emphasized neutral to distinguish them.
 */
export function frameworkChipClass(name: string): string {
  const n = (name || "").toLowerCase();
  const isStandard = n.includes("iso") || n.includes("soc");
  if (isStandard) {
    return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/15 dark:text-slate-100 dark:border-slate-400/30";
  }
  return "bg-muted/60 text-foreground/80 border-border dark:bg-muted/40 dark:text-foreground/85 dark:border-border";
}
