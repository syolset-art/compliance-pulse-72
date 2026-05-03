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
}
