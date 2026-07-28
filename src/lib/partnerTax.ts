/**
 * Partnerens standard mva/tax-innstillinger for tilbud og priskataloger.
 * Persistert i localStorage sammen med resten av partnerbrandingen, men
 * eksponert som en egen slice for tydelig separasjon.
 */

export type TaxMode = "exclusive" | "inclusive";

export interface PartnerTaxSettings {
  /** Vis mva/tax i tilbud og priskataloger. */
  enabled: boolean;
  /** Sats i prosent, f.eks. 25 for norsk mva. */
  rate: number;
  /** Etikett som brukes i UI, f.eks. "mva", "VAT", "GST". */
  label: string;
  /**
   * "exclusive" = priser vises uten mva, mva legges til i totalen.
   * "inclusive" = priser inkluderer mva, én total vises.
   */
  mode: TaxMode;
}

export function defaultTaxForLanguage(lang: string | undefined): PartnerTaxSettings {
  const l = (lang ?? "nb").toLowerCase();
  if (l.startsWith("nb") || l.startsWith("no")) {
    return { enabled: true, rate: 25, label: "mva", mode: "exclusive" };
  }
  if (l.startsWith("sv")) {
    return { enabled: true, rate: 25, label: "moms", mode: "exclusive" };
  }
  if (l.startsWith("da")) {
    return { enabled: true, rate: 25, label: "moms", mode: "exclusive" };
  }
  return { enabled: true, rate: 0, label: "VAT", mode: "exclusive" };
}

/** Kort merknad brukt i katalog og under totalsummer. */
export function formatTaxNote(tax: PartnerTaxSettings): string {
  if (!tax.enabled) return "Priser uten mva/tax-beregning.";
  const pct = `${tax.rate}%`;
  if (tax.mode === "exclusive") {
    return tax.rate > 0
      ? `Alle priser er eks. ${tax.label} (${pct}).`
      : `Alle priser er eks. ${tax.label}.`;
  }
  return tax.rate > 0
    ? `Alle priser inkluderer ${tax.label} (${pct}).`
    : `Alle priser inkluderer ${tax.label}.`;
}

export function computeTaxBreakdown(subtotal: number, tax: PartnerTaxSettings) {
  if (!tax.enabled || tax.rate <= 0) {
    return { net: subtotal, taxAmount: 0, gross: subtotal };
  }
  const rate = tax.rate / 100;
  if (tax.mode === "exclusive") {
    const taxAmount = Math.round(subtotal * rate);
    return { net: subtotal, taxAmount, gross: subtotal + taxAmount };
  }
  // inclusive: subtotal is gross
  const net = Math.round(subtotal / (1 + rate));
  return { net, taxAmount: subtotal - net, gross: subtotal };
}
