/**
 * Laras dekningsanalyse for et opplastet dokument.
 *
 * Prototype: analysen er deterministisk og kjører lokalt ved å matche
 * dokumentets navn og type mot den veiledende dokumentasjonen per krav
 * (`frameworkDocumentationCatalog`). Den gir samme skala som bevisflyten i
 * Regelverk: 1 = dekker kravet, 0,5 = delvis dekning, 0 = ingen match.
 *
 * Rene funksjoner — ingen UI, ingen persistens.
 */

import {
  frameworkDocumentationCatalog,
  type FrameworkDocCatalogEntry,
} from "@/lib/requirementDocumentationHints";

export interface CoverageMatch {
  requirementId: string;
  label: string;
  coveredArticles: string[];
  missingArticles: string[];
  coverageRatio: number;
}

const STOPWORDS = new Set([
  "og",
  "for",
  "over",
  "av",
  "til",
  "the",
  "and",
  "of",
  "med",
  "i",
  "en",
  "et",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[^a-zà-ÿ0-9]+/i)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function docMatches(docName: string, haystack: string[]): boolean {
  const docTokens = tokens(docName);
  if (!docTokens.length) return false;
  const hit = docTokens.filter((t) => haystack.some((h) => h.includes(t) || t.includes(h)));
  // Minst halvparten av de meningsbærende ordene må gjenfinnes.
  return hit.length / docTokens.length >= 0.5;
}

function analyseEntry(entry: FrameworkDocCatalogEntry, haystack: string[]): CoverageMatch | null {
  const covered = entry.docs.filter((d) => docMatches(d, haystack));
  if (!covered.length) return null;
  const missing = entry.docs.filter((d) => !covered.includes(d));
  const ratio = missing.length === 0 ? 1 : 0.5;
  return {
    requirementId: entry.requirementId,
    label: entry.label,
    coveredArticles: covered,
    missingArticles: missing,
    coverageRatio: ratio,
  };
}

/** Analyserer ett dokument mot ett regelverk. */
export function analyseDocumentCoverage(input: {
  frameworkId: string;
  displayName: string;
  fileName?: string;
  documentType?: string;
}): CoverageMatch[] {
  const catalog = frameworkDocumentationCatalog(input.frameworkId);
  if (!catalog.length) return [];
  const haystack = tokens(
    [input.displayName, input.fileName ?? "", (input.documentType ?? "").replace(/_/g, " ")].join(" "),
  );
  if (!haystack.length) return [];
  return catalog
    .map((entry) => analyseEntry(entry, haystack))
    .filter((m): m is CoverageMatch => !!m)
    .sort((a, b) => b.coverageRatio - a.coverageRatio)
    .slice(0, 5);
}

export function coverageLabel(ratio: number, isNb: boolean): string {
  if (ratio >= 1) return isNb ? "Full dekning" : "Full coverage";
  if (ratio > 0) return isNb ? "Delvis dekning" : "Partial coverage";
  return isNb ? "Ingen dekning" : "No coverage";
}
