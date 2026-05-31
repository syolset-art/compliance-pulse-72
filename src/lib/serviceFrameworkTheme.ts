// Visuelle tokens per regelverk – bruker Mynders semantiske framework-tokens
// definert i src/index.css (--fw-*). Holder hele palletten i tråd med
// designmanualen (purple/blue/teal/amber) i stedet for Tailwinds stock-farger.

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

const make = (token: string): FrameworkTheme => ({
  chip: `bg-[hsl(var(--fw-${token}-soft))] text-[hsl(var(--fw-${token}-fg))] border-[hsl(var(--fw-${token})/0.35)]`,
  border: `border-l-[hsl(var(--fw-${token}))]`,
  iconBg: `bg-[hsl(var(--fw-${token}-soft))]`,
  iconColor: `text-[hsl(var(--fw-${token}-fg))]`,
});

const THEMES: Record<string, FrameworkTheme> = {
  gdpr: make("gdpr"),
  iso27001: make("iso"),
  nis2: make("nis2"),
  aiact: make("aiact"),
  dora: make("dora"),
  transparency: make("transparency"),
};

const DEFAULT: FrameworkTheme = {
  chip: "bg-muted text-foreground border-border",
  border: "border-l-muted-foreground/40",
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
};

export function getFrameworkTheme(frameworkId: string): FrameworkTheme {
  return THEMES[frameworkId?.toLowerCase()] ?? DEFAULT;
}
