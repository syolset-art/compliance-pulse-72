export type LaraTaskSeverity = "critical" | "high" | "medium";

export interface LaraPlanTask {
  id: string;
  severity: LaraTaskSeverity;
  /** Hovedtittel — typisk leverandørnavn eller aktivitetstittel */
  title: string;
  /** Sekundær linje under tittel — f.eks. "Lønn og HR · databehandler" eller tema */
  category?: string;
  /** "Lara ser"-blokk — kort innsikt eller begrunnelse */
  insight: string;
  /** CTA-tekst på primærknappen (overstyrer "Be Lara håndtere det" om satt) */
  primaryCtaLabelNb?: string;
  primaryCtaLabelEn?: string;
  /** CTA-tekst på sekundærknappen (overstyrer "Åpne leverandøren" om satt) */
  secondaryCtaLabelNb?: string;
  secondaryCtaLabelEn?: string;
  /** CTA-tekst på "Les mer"-knappen */
  readMoreCtaLabelNb?: string;
  readMoreCtaLabelEn?: string;
  /** Hvis satt, kan Lara starte oppgaven selv (vises som primær handling). */
  canAutoRun?: boolean;
  /** Etikett for Lara-auto-knappen (default: "La Lara gjøre det") */
  autoRunLabelNb?: string;
  autoRunLabelEn?: string;
  /** Kort forklaring av hva Lara faktisk gjør hvis hun får lov */
  autoRunExplainerNb?: string;
  autoRunExplainerEn?: string;
  /**
   * Hvis Lara mangler data — vis en gul forvarsel om at hun trenger
   * mer informasjon eller at partneren bør gjøre en annen oppgave først.
   */
  infoGapNb?: string;
  infoGapEn?: string;
  /** Anbefalt opp-strøms oppgave som bør gjøres først (vises i info-gap) */
  prerequisiteHintNb?: string;
  prerequisiteHintEn?: string;
}

