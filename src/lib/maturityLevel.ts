/**
 * Én kanonisk modenhetsskala for hele plattformen.
 *
 * Alle flater (leverandører, systemer, enheter, kontrollområder, regelverk,
 * dashbord, rapporter og MSP) skal bruke disse tersklene og fargene, slik at
 * brukeren kjenner igjen hva Lav / Middels / Høy betyr uansett hvor de er.
 *
 *   Høy      grønn    75–100
 *   Middels  oransje  50–74
 *   Lav      rød       0–49
 */

export type MaturityLevel = "low" | "medium" | "high";

export const MATURITY_THRESHOLDS = {
  /** Under denne grensen = Lav */
  medium: 50,
  /** Fra og med denne grensen = Høy */
  high: 75,
} as const;

export function getMaturityLevel(score: number | null | undefined): MaturityLevel {
  const value = typeof score === "number" && Number.isFinite(score) ? score : 0;
  if (value >= MATURITY_THRESHOLDS.high) return "high";
  if (value >= MATURITY_THRESHOLDS.medium) return "medium";
  return "low";
}

/** i18n-nøkkel for nivået (maturityScale.levels.*) */
export function maturityLevelKey(level: MaturityLevel): string {
  return `maturityScale.levels.${level}`;
}

const FALLBACK_LABELS_NB: Record<MaturityLevel, string> = {
  low: "Lav",
  medium: "Middels",
  high: "Høy",
};

/** Brukes der en oversetterfunksjon ikke er tilgjengelig (f.eks. rene datamoduler). */
export function maturityLabelNb(level: MaturityLevel): string {
  return FALLBACK_LABELS_NB[level];
}

export function maturityTextClass(score: number | null | undefined): string {
  switch (getMaturityLevel(score)) {
    case "high":
      return "text-success";
    case "medium":
      return "text-warning";
    default:
      return "text-destructive";
  }
}

export function maturityBgClass(score: number | null | undefined): string {
  switch (getMaturityLevel(score)) {
    case "high":
      return "bg-success";
    case "medium":
      return "bg-warning";
    default:
      return "bg-destructive";
  }
}

export function maturityBorderClass(score: number | null | undefined): string {
  switch (getMaturityLevel(score)) {
    case "high":
      return "border-success/40";
    case "medium":
      return "border-warning/40";
    default:
      return "border-destructive/40";
  }
}

export function maturitySoftClass(score: number | null | undefined): string {
  switch (getMaturityLevel(score)) {
    case "high":
      return "bg-success/10 text-success border-success/30";
    case "medium":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-destructive/10 text-destructive border-destructive/30";
  }
}

/** Klasse for shadcn <Progress> indikator */
export function maturityProgressClass(score: number | null | undefined): string {
  switch (getMaturityLevel(score)) {
    case "high":
      return "[&>div]:bg-success";
    case "medium":
      return "[&>div]:bg-warning";
    default:
      return "[&>div]:bg-destructive";
  }
}

export interface MaturityExplanation {
  level: MaturityLevel;
  label: string;
  summary: string;
  /** Hva som skal til for å nå neste nivå, null når nivået allerede er Høy */
  nextStep: string | null;
  scale: { level: MaturityLevel; label: string; range: string }[];
}

/**
 * Forklaring som vises bak info-ikonet ved siden av modenhetsnivået.
 * Brukeren skal alltid kunne se hvordan nivået er beregnet og hva som skal til
 * for å komme videre.
 */
export function maturityExplanation(score: number | null | undefined): MaturityExplanation {
  const value = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : 0;
  const level = getMaturityLevel(value);

  const nextStep =
    level === "high"
      ? null
      : level === "medium"
        ? `Du er ${MATURITY_THRESHOLDS.high - value} poeng fra Høy. Dokumentér og hev modenhetsnivået på de resterende kravene i kontrollområdet.`
        : `Du er ${MATURITY_THRESHOLDS.medium - value} poeng fra Middels. Start med kravene som mangler dokumentasjon.`;

  return {
    level,
    label: maturityLabelNb(level),
    summary:
      "Modenhet beregnes som snittet av modenhetsnivå (0–4) på alle krav i scope, omregnet til en skala fra 0 til 100.",
    nextStep,
    scale: [
      { level: "low", label: "Lav", range: `0–${MATURITY_THRESHOLDS.medium - 1}` },
      { level: "medium", label: "Middels", range: `${MATURITY_THRESHOLDS.medium}–${MATURITY_THRESHOLDS.high - 1}` },
      { level: "high", label: "Høy", range: `${MATURITY_THRESHOLDS.high}–100` },
    ],
  };
}
