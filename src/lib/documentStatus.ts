/**
 * Dokumentlivssyklus – delt logikk
 *
 * Et leverandørdokument er aktivt (teller mot trust score) dersom:
 *  - status === "current", og
 *  - valid_to ikke er passert
 *
 * Ellers er det enten erstattet (superseded), utgått (expired), eller avvist (rejected).
 */

export type VendorDoc = {
  id: string;
  status?: string | null;
  valid_to?: string | null;
  superseded_by?: string | null;
  superseded_at?: string | null;
  document_type?: string | null;
  file_name?: string | null;
  display_name?: string | null;
};

export function isExpired(doc: Pick<VendorDoc, "valid_to">): boolean {
  if (!doc.valid_to) return false;
  return new Date(doc.valid_to) < new Date();
}

export function isActiveDocument(doc: Pick<VendorDoc, "status" | "valid_to">): boolean {
  return doc.status === "current" && !isExpired(doc);
}

export function effectiveStatus(doc: Pick<VendorDoc, "status" | "valid_to">): "current" | "expired" | "superseded" | "rejected" | "pending_review" | "other" {
  if (doc.status === "current" && isExpired(doc)) return "expired";
  if (doc.status === "current") return "current";
  if (doc.status === "superseded") return "superseded";
  if (doc.status === "rejected") return "rejected";
  if (doc.status === "pending_review") return "pending_review";
  return "other";
}

/**
 * Marker tidligere "current"-dokumenter av samme type som superseded
 * når et nyere dokument godkjennes/lastes opp.
 *
 * Returnerer ID-ene som ble erstattet (for evt. notifikasjoner / kobling).
 */
export async function supersedePreviousDocuments(
  supabase: any,
  args: {
    assetId: string;
    documentType: string;
    newDocumentId?: string | null;
  },
): Promise<string[]> {
  const { assetId, documentType, newDocumentId } = args;
  if (!documentType || documentType === "other") return [];

  const { data: previous } = await supabase
    .from("vendor_documents")
    .select("id")
    .eq("asset_id", assetId)
    .eq("document_type", documentType)
    .eq("status", "current");

  const ids = (previous || []).map((d: any) => d.id).filter((id: string) => id !== newDocumentId);
  if (!ids.length) return [];

  await supabase
    .from("vendor_documents")
    .update({
      status: "superseded",
      superseded_at: new Date().toISOString(),
      superseded_by: newDocumentId ?? null,
    })
    .in("id", ids);

  return ids;
}
