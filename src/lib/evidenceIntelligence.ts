/**
 * Dokumentasjon og bevis — "kartlagt" bilde av all dokumentasjon i plattformen.
 *
 * Slår sammen hub-dokumentene (Trust Center, leverandør, regelverk, arbeidsområde)
 * med kravdekningen fra aktiverte regelverk, slik at siden kan svare på:
 *   – hva har vi?
 *   – hva er kartlagt mot et krav?
 *   – hva mangler?
 *
 * Rene funksjoner — ingen UI, ingen persistens.
 */

import type { HubDocument } from "@/lib/documentHub";
import {
  buildComplianceCoverage,
  type CoverageDoc,
  type CoverageSummary,
  type FrameworkRef,
  type RequirementCoverage,
} from "@/lib/complianceDocumentCoverage";

export type EvidenceSourceKind = "upload" | "agent";

export interface MappedRequirement {
  name: string;
  frameworkId: string;
  frameworkName: string;
  state: RequirementCoverage["state"];
}

export interface EvidenceLibraryRow {
  doc: HubDocument;
  sourceKind: EvidenceSourceKind;
  requirements: MappedRequirement[];
}

export interface EvidenceIntelligence {
  coverage: CoverageSummary;
  rows: EvidenceLibraryRow[];
  mappedCount: number;
  unmappedCount: number;
  uploadCount: number;
  agentCount: number;
}

/** Dokumentasjon levert av den lokale agenten (Sara) framfor manuell opplasting. */
export function isAgentSourced(doc: {
  name?: string | null;
  fileName?: string | null;
  uploadedBy?: string | null;
  contextLabel?: string | null;
}): boolean {
  const haystack = [doc.uploadedBy, doc.name, doc.fileName, doc.contextLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bsara\b/.test(haystack) || /lokal agent|local agent/.test(haystack);
}

function hubStatusToDocStatus(status: HubDocument["status"]): string {
  if (status === "current") return "verified";
  if (status === "pending") return "pending";
  if (status === "expired") return "expired";
  return status;
}

/** HubDocument → formatet dekningsberegningen forventer. */
export function hubToCoverageDoc(doc: HubDocument): CoverageDoc {
  return {
    id: doc.id,
    display_name: doc.name,
    file_name: doc.fileName,
    document_type: doc.documentType,
    status: hubStatusToDocStatus(doc.status),
    valid_to: doc.validTo,
    created_at: doc.createdAt,
    updated_at: doc.createdAt,
  };
}

/**
 * Bygger dekningsbildet for de valgte regelverkene og kartlegger hvert
 * dokument i plattformen mot kravene det dekker.
 */
export function buildEvidenceIntelligence(
  frameworks: FrameworkRef[],
  documents: HubDocument[],
  selectedFrameworkIds: string[] = [],
  now: Date = new Date(),
): EvidenceIntelligence {
  const scope =
    selectedFrameworkIds.length > 0
      ? frameworks.filter((f) => selectedFrameworkIds.includes(f.framework_id))
      : frameworks;

  const coverage = buildComplianceCoverage(scope, documents.map(hubToCoverageDoc), now);

  const byDoc = new Map<string, MappedRequirement[]>();
  coverage.frameworks.forEach((fw) => {
    fw.requirements.forEach((r) => {
      if (!r.doc) return;
      const list = byDoc.get(r.doc.id) ?? [];
      list.push({
        name: r.name,
        frameworkId: fw.frameworkId,
        frameworkName: fw.frameworkName,
        state: r.state,
      });
      byDoc.set(r.doc.id, list);
    });
  });

  const rows: EvidenceLibraryRow[] = documents.map((doc) => ({
    doc,
    sourceKind: isAgentSourced(doc) ? "agent" : "upload",
    requirements: byDoc.get(doc.id) ?? [],
  }));

  return {
    coverage,
    rows,
    mappedCount: rows.filter((r) => r.requirements.length > 0).length,
    unmappedCount: rows.filter((r) => r.requirements.length === 0).length,
    uploadCount: rows.filter((r) => r.sourceKind === "upload").length,
    agentCount: rows.filter((r) => r.sourceKind === "agent").length,
  };
}

/** Alle krav på tvers av regelverkene i dekningsbildet, i én liste. */
export function flattenRequirements(
  coverage: CoverageSummary,
): (RequirementCoverage & { frameworkId: string; frameworkName: string })[] {
  return coverage.frameworks.flatMap((fw) =>
    fw.requirements.map((r) => ({ ...r, frameworkId: fw.frameworkId, frameworkName: fw.frameworkName })),
  );
}
