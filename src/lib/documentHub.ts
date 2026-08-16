/**
 * Dokument hub — normalisering av alle dokumentkilder til én felles modell.
 *
 * Hub-en er lesende: den samler dokumenter fra de fire eksisterende tabellene
 * og gir hver rad en modul (hvor det ble lastet opp), en type, en opplaster,
 * en status og en tilbakelenke til konteksten.
 *
 * Ingen scoring beregnes her — «påvirker score» avgjøres av
 * `buildComplianceCoverage` (bevis mot krav i aktiverte regelverk).
 */

import { effectiveStatus } from "@/lib/documentStatus";
import { computeDocumentCompliance } from "@/lib/documentCompliance";

export type HubModule = "trust" | "vendor" | "framework" | "workarea" | "asset" | "other";

export type HubStatus = "current" | "pending" | "expiring" | "expired" | "superseded" | "other";

export interface HubDocument {
  id: string;
  /** Kilde-tabellen raden kom fra. */
  source: "vendor_documents" | "framework_documents" | "work_area_documents" | "uploaded_documents";
  name: string;
  fileName: string | null;
  documentType: string;
  module: HubModule;
  /** Navn på konteksten: leverandør, arbeidsområde, regelverk … */
  contextLabel: string | null;
  /** Rute tilbake til der dokumentet ble lastet opp. */
  sourceRoute: string | null;
  uploadedBy: string | null;
  createdAt: string | null;
  validTo: string | null;
  status: HubStatus;
  fileSize: number | null;
}

export const MODULE_LABELS: Record<HubModule, { nb: string; en: string }> = {
  trust: { nb: "Trust Center", en: "Trust Center" },
  vendor: { nb: "Leverandør", en: "Vendor" },
  framework: { nb: "Regelverk", en: "Regulations" },
  workarea: { nb: "Arbeidsområde", en: "Work area" },
  asset: { nb: "Eiendeler", en: "Assets" },
  other: { nb: "Annet", en: "Other" },
};

export const STATUS_LABELS: Record<HubStatus, { nb: string; en: string }> = {
  current: { nb: "Gjeldende", en: "Current" },
  pending: { nb: "Venter", en: "Pending" },
  expiring: { nb: "Utløper snart", en: "Expiring" },
  expired: { nb: "Utløpt", en: "Expired" },
  superseded: { nb: "Erstattet", en: "Superseded" },
  other: { nb: "Øvrig", en: "Other" },
};

/** Grovgruppering av dokumenttyper til de kategoriene brukeren filtrerer på. */
export type HubTypeGroup = "policy" | "agreement" | "report" | "certification" | "evidence" | "other";

export const TYPE_GROUP_LABELS: Record<HubTypeGroup, { nb: string; en: string }> = {
  policy: { nb: "Policy", en: "Policy" },
  agreement: { nb: "DPA / avtale", en: "DPA / agreement" },
  report: { nb: "Revisjonsrapport", en: "Audit report" },
  certification: { nb: "Sertifisering", en: "Certification" },
  evidence: { nb: "Bevis", en: "Evidence" },
  other: { nb: "Øvrig", en: "Other" },
};

const TYPE_GROUP_MAP: Record<string, HubTypeGroup> = {
  policy: "policy",
  privacy_policy: "policy",
  security_policy: "policy",
  acceptable_use: "policy",
  incident_response: "policy",
  data_protection_policy: "policy",
  dpa: "agreement",
  agreement: "agreement",
  contract: "agreement",
  sla: "agreement",
  audit_report: "report",
  soc2_report: "report",
  report: "report",
  pentest: "report",
  certification: "certification",
  iso27001: "certification",
  evidence: "evidence",
};

export function typeGroup(documentType: string | null | undefined): HubTypeGroup {
  if (!documentType) return "other";
  return TYPE_GROUP_MAP[documentType] ?? "other";
}

export function documentTypeLabel(documentType: string | null | undefined, isNb: boolean): string {
  if (!documentType) return isNb ? "Uten type" : "Untyped";
  const group = TYPE_GROUP_MAP[documentType];
  if (group) return TYPE_GROUP_LABELS[group][isNb ? "nb" : "en"];
  return documentType.replace(/_/g, " ");
}

function fileBaseName(fileName: string | null | undefined): string {
  if (!fileName) return "";
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
}

function hubStatusFromVendorDoc(row: any, now: Date): HubStatus {
  const eff = effectiveStatus(row);
  if (eff === "expired") return "expired";
  if (eff === "superseded") return "superseded";
  if (eff === "pending_review") return "pending";
  if (eff === "rejected") return "other";
  if (eff === "current") {
    const c = computeDocumentCompliance(row, now);
    if (c.show && (c.state === "out_of_date" || c.state === "review_soon")) return "expiring";
    return "current";
  }
  if (row.status === "verified") return "current";
  if (row.status === "draft" || row.status === "pending") return "pending";
  return "other";
}

export interface RawSources {
  vendorDocs: any[];
  frameworkDocs: any[];
  workAreaDocs: any[];
  uploadedDocs: any[];
  /** id → { name, type } for assets, brukes til å skille self-asset fra leverandør. */
  assetsById: Record<string, { name: string; asset_type: string }>;
  workAreasById: Record<string, string>;
  frameworkNames: Record<string, string>;
  /** Koblinger dokument → krav i regelverk (fra `requirement_evidence`). */
  requirementEvidence?: { document_id: string; framework_id: string }[];
}

export function buildHubDocuments(sources: RawSources, now: Date = new Date()): HubDocument[] {
  const docs: HubDocument[] = [];

  /** Dokumenter som er lastet opp som bevis inne i Regelverk. */
  const evidenceFramework = new Map<string, string>();
  (sources.requirementEvidence ?? []).forEach((r) => {
    if (!evidenceFramework.has(r.document_id)) evidenceFramework.set(r.document_id, r.framework_id);
  });

  for (const row of sources.vendorDocs) {
    const asset = sources.assetsById[row.asset_id];
    const isSelf = asset?.asset_type === "self";
    const evidenceFrameworkId = evidenceFramework.get(row.id);
    docs.push({
      id: row.id,
      source: "vendor_documents",
      name: row.display_name || fileBaseName(row.file_name) || row.file_name || "Dokument",
      fileName: row.file_name ?? null,
      documentType: row.document_type || "other",
      module: evidenceFrameworkId ? "framework" : isSelf ? "trust" : "vendor",
      contextLabel: evidenceFrameworkId
        ? sources.frameworkNames[evidenceFrameworkId] || evidenceFrameworkId
        : asset?.name ?? null,
      sourceRoute: evidenceFrameworkId
        ? `/regulations/${evidenceFrameworkId}`
        : isSelf
          ? "/trust-center/evidence"
          : row.asset_id
            ? `/assets/${row.asset_id}`
            : null,
      uploadedBy: row.uploaded_by || row.approved_by || null,
      createdAt: row.created_at ?? null,
      validTo: row.valid_to ?? null,
      status: hubStatusFromVendorDoc(row, now),
      fileSize: null,
    });
  }

  for (const row of sources.frameworkDocs) {
    docs.push({
      id: row.id,
      source: "framework_documents",
      name: fileBaseName(row.file_name) || row.file_name,
      fileName: row.file_name ?? null,
      documentType: row.document_type || "evidence",
      module: "framework",
      contextLabel: sources.frameworkNames[row.framework_id] || row.framework_id,
      sourceRoute: row.framework_id ? `/regulations/${row.framework_id}` : "/regulations",
      uploadedBy: row.uploaded_by ?? null,
      createdAt: row.created_at ?? null,
      validTo: null,
      status: "current",
      fileSize: row.file_size ?? null,
    });
  }

  for (const row of sources.workAreaDocs) {
    docs.push({
      id: row.id,
      source: "work_area_documents",
      name: fileBaseName(row.file_name) || row.file_name,
      fileName: row.file_name ?? null,
      documentType: row.document_type || "other",
      module: row.linked_asset_id ? "asset" : "workarea",
      contextLabel: sources.workAreasById[row.work_area_id] ?? null,
      sourceRoute: row.linked_asset_id
        ? `/assets/${row.linked_asset_id}`
        : row.work_area_id
          ? `/work-areas/${row.work_area_id}`
          : "/work-areas",
      uploadedBy: null,
      createdAt: row.created_at ?? null,
      validTo: null,
      status: "current",
      fileSize: row.file_size ?? null,
    });
  }

  for (const row of sources.uploadedDocs) {
    docs.push({
      id: row.id,
      source: "uploaded_documents",
      name: fileBaseName(row.file_name) || row.file_name,
      fileName: row.file_name ?? null,
      documentType: "other",
      module: "other",
      contextLabel: null,
      sourceRoute: null,
      uploadedBy: row.user_id ?? null,
      createdAt: row.created_at ?? null,
      validTo: null,
      status: row.analysis_status === "pending" ? "pending" : "current",
      fileSize: row.file_size ?? null,
    });
  }

  return docs.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
