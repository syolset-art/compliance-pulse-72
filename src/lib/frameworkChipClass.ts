export function frameworkChipClass(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("iso") || n.includes("soc"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
  if (n.includes("nis2"))
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";
  if (n.includes("dora"))
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30";
  if (n.includes("ai") || n.includes("ki-forordning"))
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/30";
  return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:border-violet-500/30";
}
