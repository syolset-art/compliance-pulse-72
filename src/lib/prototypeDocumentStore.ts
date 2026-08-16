// Prototype-lagring for dokumenter lastet opp uten innlogging.
// Dokumentene lagres kun i nettleseren (localStorage) slik at demoen kan vise
// hele flyten uten backend. Erstattes av vendor_documents/requirement_evidence
// når brukeren er innlogget.

import type { HubDocument } from "@/lib/documentHub";

const DOC_KEY = "mynder.prototype.hubDocuments";
const EVIDENCE_KEY = "mynder.prototype.requirementEvidence";

export interface PrototypeEvidence {
  document_id: string;
  framework_id: string;
  requirement_id: string;
  /** Foreløpig felt: skalaen 0 / 0,5 / 1. Skal kvalitetssikres. */
  coverage_ratio: number;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* ignorer full localStorage i demo */
  }
}

export function isPrototypeDocumentId(id: string): boolean {
  return id.startsWith("proto-");
}

export function savePrototypeDocument(input: {
  displayName: string;
  fileName: string;
  documentType: string;
  fileSize: number | null;
}): string {
  const id = `proto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const doc: HubDocument = {
    id,
    source: "vendor_documents",
    name: input.displayName || input.fileName,
    fileName: input.fileName,
    documentType: input.documentType || "other",
    module: "other",
    contextLabel: null,
    sourceRoute: "/documents",
    uploadedBy: null,
    createdAt: new Date().toISOString(),
    validTo: null,
    status: "current",
    fileSize: input.fileSize,
  };
  write(DOC_KEY, [...read<HubDocument>(DOC_KEY), doc]);
  return id;
}

export function prototypeDocuments(): HubDocument[] {
  return read<HubDocument>(DOC_KEY);
}

export function savePrototypeEvidence(rows: PrototypeEvidence[]) {
  const existing = read<PrototypeEvidence>(EVIDENCE_KEY).filter(
    (r) => !rows.some((n) => n.document_id === r.document_id && n.requirement_id === r.requirement_id),
  );
  write(EVIDENCE_KEY, [...existing, ...rows]);
}

export function prototypeEvidence(): PrototypeEvidence[] {
  return read<PrototypeEvidence>(EVIDENCE_KEY);
}
