/**
 * Dekningsgrad for dokumentasjon mot et krav.
 *
 * Plattformen bruker ÉN skala: 0 (ikke dekket), 0,5 (delvis dekket) og
 * 1 (fullt dekket). Ingen prosent, ingen 0–4, ingen stjerner.
 *
 * MERK: kolonnen `requirement_evidence.coverage_ratio` er foreløpig og skal
 * kvalitetssikres. All skriving til den går gjennom `coverageRatioColumn()`
 * her, slik at datamodellen kan endres ett sted senere.
 */

export type CoverageValue = 0 | 0.5 | 1;

/** Klemmer et vilkårlig tall inn på den kanoniske skalaen. */
export function toCoverageValue(value: number | null | undefined): CoverageValue {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return 0.5;
}

/** Tallet slik det vises for brukeren: «0», «0,5» eller «1». */
export function coverageNumberText(value: number | null | undefined, isNb: boolean): string {
  const v = toCoverageValue(value);
  if (v === 0.5) return isNb ? "0,5" : "0.5";
  return String(v);
}

/** Forståelig tekst uten tallet. */
export function coverageWordLabel(value: number | null | undefined, isNb: boolean): string {
  const v = toCoverageValue(value);
  if (v === 1) return isNb ? "Fullt dekket" : "Fully covered";
  if (v === 0.5) return isNb ? "Delvis dekket" : "Partially covered";
  return isNb ? "Ikke dekket" : "Not covered";
}

/** Brukervendt merkelapp med både tekst og tall, f.eks. «Delvis dekket (0,5)». */
export function coverageScaleLabel(value: number | null | undefined, isNb: boolean): string {
  return `${coverageWordLabel(value, isNb)} (${coverageNumberText(value, isNb)})`;
}

/**
 * Eneste stedet som produserer verdien som skrives til
 * `requirement_evidence.coverage_ratio`.
 */
export function coverageRatioColumn(value: number | null | undefined): number {
  return toCoverageValue(value);
}
