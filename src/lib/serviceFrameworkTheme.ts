// Visuelle tokens per regelverk – brukt i tjenestekatalog og Lara-forslag.
// Bruker semantiske Tailwind/HSL-tokens fra index.css.

export interface FrameworkTheme {
  /** Klasse for liten "pille" som viser regelverknavnet */
  chip: string;
  /** Klasse for venstre kant på kort */
  border: string;
  /** Klasse for ikonbakgrunn */
  iconBg: string;
  /** Klasse for ikonfarge */
  iconColor: string;
}

const THEMES: Record<string, FrameworkTheme> = {
  gdpr: {
    chip: "bg-primary/10 text-primary border-primary/25",
    border: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  iso27001: {
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    border: "border-l-sky-500",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  nis2: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  aiact: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-700 dark:text-amber-400",
  },
  dora: {
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    border: "border-l-indigo-500",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  transparency: {
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    border: "border-l-rose-500",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
};

const DEFAULT: FrameworkTheme = {
  chip: "bg-muted text-foreground/70 border-border",
  border: "border-l-muted-foreground/40",
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
};

export function getFrameworkTheme(frameworkId: string): FrameworkTheme {
  return THEMES[frameworkId?.toLowerCase()] ?? DEFAULT;
}
