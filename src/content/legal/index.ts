import { SLUTTKUNDEVILKAR_V1_2 } from "./sluttkundevilkar-v1-2";
import { VILKAR_FOR_PARTNERE_V1_0 } from "./vilkar-for-partnere-v1-0";

export interface LegalDocument {
  /** Stabil slug brukt i ruten /dokumenter/:slug */
  slug: string;
  title: string;
  version: string;
  status: string;
  /** ISO-dato */
  lastUpdated: string;
  /** Ferdig formatert dato slik juridisk har oppgitt den */
  lastUpdatedLabel: string;
  /** Én linje om hvem dokumentet gjelder for */
  appliesTo: string;
  /** Hvem som skal se dokumentet */
  audience: "customer" | "partner";
  /** Kobling mot doc_type i terms_versions (akseptlogg) */
  docType: "terms" | "partner";
  markdown: string;
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  SLUTTKUNDEVILKAR_V1_2,
  VILKAR_FOR_PARTNERE_V1_0,
];

export const CUSTOMER_TERMS = SLUTTKUNDEVILKAR_V1_2;
export const PARTNER_TERMS = VILKAR_FOR_PARTNERE_V1_0;

export function getLegalDocument(slug?: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}

/** Sluttkundebrukere ser sluttkundevilkårene, partnerbrukere ser begge. */
export function documentsForAudience(isPartner: boolean): LegalDocument[] {
  return isPartner
    ? LEGAL_DOCUMENTS
    : LEGAL_DOCUMENTS.filter((d) => d.audience === "customer");
}
