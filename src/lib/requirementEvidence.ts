/**
 * Bevis knyttet til krav i regelverk.
 *
 * Når brukeren laster opp et dokument inne i Regelverk lagres det som et
 * vanlig dokument (`vendor_documents` på egen organisasjon) pluss én
 * koblingsrad per krav i `requirement_evidence` med Laras dekningsgrad.
 * Da overlever status en refresh, og dokumentet dukker opp i Dokument hub.
 */

import { supabase } from "@/integrations/supabase/client";
import type { EvidenceDocument } from "@/lib/requirementStatusModel";

export interface StoredRequirementEvidence {
  id: string;
  frameworkId: string;
  requirementId: string;
  documentId: string;
  coveredArticles: string[];
  missingArticles: string[];
  coverageRatio: number;
  document: EvidenceDocument;
}

/** Finner (eller returnerer null for) organisasjonens egen asset. */
async function getSelfAssetId(): Promise<string | null> {
  const { data } = await supabase
    .from("assets")
    .select("id")
    .eq("asset_type", "self")
    .limit(1)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

export interface PersistEvidenceInput {
  file?: File | null;
  frameworkId: string;
  requirementIds: string[];
  document: EvidenceDocument;
  coveredArticles: string[];
  missingArticles: string[];
  coverageRatio: number;
}

/**
 * Laster opp filen og lagrer krav-koblingene. Returnerer dokument-id, eller
 * null dersom lagring ikke er mulig (f.eks. ingen egen organisasjon ennå).
 */
export async function persistRequirementEvidence(
  input: PersistEvidenceInput,
): Promise<string | null> {
  const assetId = await getSelfAssetId();
  if (!assetId) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? null;
  if (!userId) return null;

  let filePath: string | null = null;
  if (input.file) {
    const safeName = input.file.name.replace(/[^\w.\-]+/g, "_");
    const path = `requirement-evidence/${input.frameworkId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from("vendor-documents")
      .upload(path, input.file);
    if (!error) filePath = path;
  }

  const { data: doc, error: docError } = await supabase
    .from("vendor_documents")
    .insert({
      asset_id: assetId,
      display_name: input.document.name,
      file_name: input.document.name,
      file_path: filePath,
      document_type: input.document.classification?.docType || "evidence",
      status: input.document.verificationStatus === "verified" ? "verified" : "current",
      uploaded_by: userId,
    } as any)
    .select("id")
    .single();

  if (docError || !doc) {
    console.error("Kunne ikke lagre dokument", docError);
    return null;
  }

  const rows = input.requirementIds.map((requirementId) => ({
    framework_id: input.frameworkId,
    requirement_id: requirementId,
    document_id: (doc as any).id,
    covered_articles: input.coveredArticles,
    missing_articles: input.missingArticles,
    coverage_ratio: input.coverageRatio,
    created_by: userId,
  }));

  const { error: linkError } = await supabase
    .from("requirement_evidence")
    .insert(rows as any);
  if (linkError) console.error("Kunne ikke lagre kravkobling", linkError);

  return (doc as any).id as string;
}

/** Henter lagrede bevis for ett regelverk. */
export async function fetchRequirementEvidence(
  frameworkId: string,
): Promise<StoredRequirementEvidence[]> {
  const { data, error } = await supabase
    .from("requirement_evidence")
    .select(
      "id, framework_id, requirement_id, document_id, covered_articles, missing_articles, coverage_ratio, vendor_documents(display_name, file_name, document_type, status)",
    )
    .eq("framework_id", frameworkId);

  if (error || !data) return [];

  return (data as any[]).map((row) => {
    const vd = row.vendor_documents ?? {};
    const name: string = vd.display_name || vd.file_name || "Dokument";
    const covered: string[] = Array.isArray(row.covered_articles) ? row.covered_articles : [];
    const document: EvidenceDocument = {
      name,
      kind: (name.split(".").pop() || "FILE").toUpperCase(),
      classification: {
        docType: vd.document_type || "document",
        articles: covered,
        confidence: 0.8,
      },
      verificationStatus: vd.status === "verified" ? "verified" : "self_reported",
    };
    return {
      id: row.id,
      frameworkId: row.framework_id,
      requirementId: row.requirement_id,
      documentId: row.document_id,
      coveredArticles: covered,
      missingArticles: Array.isArray(row.missing_articles) ? row.missing_articles : [],
      coverageRatio: Number(row.coverage_ratio) || 0,
      document,
    };
  });
}
