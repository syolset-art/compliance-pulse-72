/**
 * Compliance-dokumentasjon: hvilke dokumenter krever de aktiverte regelverkene,
 * hva har vi — og hva mangler.
 *
 * Kravlisten kommer fra `getDocumentStatus()` (som igjen bygger på
 * `requirementDocumentationHints.ts`). Matching mot opplastede dokumenter gjøres
 * her slik at vi vet HVILKET dokument som dekker kravet, ikke bare at det finnes.
 *
 * Rene funksjoner — ingen UI, ingen persistens.
 */

import { getDocumentStatus } from "@/lib/maturityNextActions";
import { computeDocumentCompliance } from "@/lib/documentCompliance";

export type CoverageState = "covered" | "renew" | "missing";

export interface CoverageDoc {
  id: string;
  display_name?: string | null;
  file_name?: string | null;
  document_type: string;
  status?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reviewed_at?: string | null;
  external_url?: string | null;
  available_on_request?: boolean | null;
}

export interface RequirementCoverage {
  /** Normalisert nøkkel — unik per dokumentkrav. */
  key: string;
  name: string;
  areaId: string;
  areaTitle: string;
  articleLabel: string;
  state: CoverageState;
  doc?: CoverageDoc;
  /** Årsak når state === "renew". */
  renewReasonNb?: string;
  renewReasonEn?: string;
  /** Andre regelverk som krever samme dokument. */
  alsoRequiredBy: string[];
}

export interface FrameworkCoverage {
  frameworkId: string;
  frameworkName: string;
  requirements: RequirementCoverage[];
  total: number;
  covered: number;
  renew: number;
  missing: number;
}

export interface CoverageSummary {
  frameworks: FrameworkCoverage[];
  total: number;
  covered: number;
  renew: number;
  missing: number;
  /** Id-er på dokumenter som dekker minst ett krav. */
  linkedDocIds: string[];
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function docLabel(doc: CoverageDoc): string {
  return doc.display_name || doc.file_name || "";
}

/** Samme heuristikk som i maturityNextActions, men returnerer dokumentet. */
function findMatchingDoc(docName: string, docs: CoverageDoc[]): CoverageDoc | undefined {
  const target = normalizeName(docName);
  if (!target) return undefined;
  const words = target.split(" ").filter((w) => w.length > 4);
  return docs.find((d) => {
    const candidates = [docLabel(d), d.document_type || ""].filter(Boolean).map(normalizeName);
    return candidates.some((file) => {
      if (!file) return false;
      if (file.includes(target) || target.includes(file)) return true;
      const hits = words.filter((w) => file.includes(w)).length;
      return words.length > 1 ? hits >= 2 : hits >= 1;
    });
  });
}

export interface FrameworkRef {
  framework_id: string;
  framework_name: string;
}

/**
 * Bygger dekningsoversikt for alle aktiverte regelverk.
 */
export function buildComplianceCoverage(
  frameworks: FrameworkRef[],
  docs: CoverageDoc[],
  now: Date = new Date(),
): CoverageSummary {
  const linked = new Set<string>();

  // Første pass: krav per regelverk
  const raw = frameworks.map((fw) => {
    const rows = getDocumentStatus(fw.framework_id, []);
    const requirements: RequirementCoverage[] = rows.map((row) => {
      const match = findMatchingDoc(row.name, docs);
      let state: CoverageState = match ? "covered" : "missing";
      let renewReasonNb: string | undefined;
      let renewReasonEn: string | undefined;

      if (match) {
        linked.add(match.id);
        const c = computeDocumentCompliance(match as any, now);
        if (c.show && c.state === "out_of_date") {
          state = "renew";
          renewReasonNb = c.reasonNb;
          renewReasonEn = c.reasonEn;
        }
      }

      return {
        key: normalizeName(row.name),
        name: row.name,
        areaId: row.areaId,
        areaTitle: row.areaTitle,
        articleLabel: row.articleLabel,
        state,
        doc: match,
        renewReasonNb,
        renewReasonEn,
        alsoRequiredBy: [],
      };
    });
    return { fw, requirements };
  });

  // Andre pass: hvilke regelverk deler samme dokumentkrav
  const byKey = new Map<string, string[]>();
  raw.forEach(({ fw, requirements }) => {
    requirements.forEach((r) => {
      const list = byKey.get(r.key) ?? [];
      if (!list.includes(fw.framework_name)) list.push(fw.framework_name);
      byKey.set(r.key, list);
    });
  });

  const frameworksOut: FrameworkCoverage[] = raw.map(({ fw, requirements }) => {
    const reqs = requirements
      .map((r) => ({
        ...r,
        alsoRequiredBy: (byKey.get(r.key) ?? []).filter((n) => n !== fw.framework_name),
      }))
      .sort((a, b) => {
        const rank = { missing: 0, renew: 1, covered: 2 } as const;
        if (rank[a.state] !== rank[b.state]) return rank[a.state] - rank[b.state];
        return a.name.localeCompare(b.name);
      });

    return {
      frameworkId: fw.framework_id,
      frameworkName: fw.framework_name,
      requirements: reqs,
      total: reqs.length,
      covered: reqs.filter((r) => r.state === "covered").length,
      renew: reqs.filter((r) => r.state === "renew").length,
      missing: reqs.filter((r) => r.state === "missing").length,
    };
  });

  return {
    frameworks: frameworksOut,
    total: frameworksOut.reduce((s, f) => s + f.total, 0),
    covered: frameworksOut.reduce((s, f) => s + f.covered, 0),
    renew: frameworksOut.reduce((s, f) => s + f.renew, 0),
    missing: frameworksOut.reduce((s, f) => s + f.missing, 0),
    linkedDocIds: Array.from(linked),
  };
}
