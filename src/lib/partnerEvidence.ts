// Partner-uploaded evidence (pentest, DPIA, risk assessments, etc.)
// Demo/presentation store backed by localStorage. Each customer can have
// multiple evidence documents that enrich maturity per control area
// and map to specific frameworks + control points.
//
// Replace with Supabase persistence later by mapping these fields onto
// `vendor_documents` rows (source = 'partner', plus metadata JSON).

export type PartnerEvidenceDocType =
  | "pentest"
  | "dpia"
  | "risk_assessment"
  | "bcp"
  | "certification"
  | "audit_report"
  | "other";

export interface MaturityDelta {
  /** Control area key — must match AssetMaturityByDomainCard keys */
  area: "governance" | "operations" | "identityAccess" | "vendor";
  /** Percentage points added on top of baseline (e.g. 8 means +8%) */
  delta: number;
}

export interface EvidenceCitation {
  /** Page or section reference, e.g. "s. 4" or "Kap. 3.2" */
  page?: string;
  /** Short verbatim excerpt from the document */
  quote: string;
}

export interface FrameworkMapping {
  /** Framework slug, e.g. "nis2", "iso27001", "gdpr", "dora" */
  framework: string;
  /** Display label */
  label: string;
  /** Control point identifiers, e.g. ["A.5.1", "A.5.2"] */
  controlIds: string[];
  /** Excerpts in the document that support this mapping */
  citations?: EvidenceCitation[];
}

/** How the final mapping was decided. */
export type LaraVerdict = "accepted" | "declined" | "manual";

export interface PartnerEvidence {
  id: string;
  customerId: string;
  fileName: string;
  docType: PartnerEvidenceDocType;
  note?: string;
  uploadedAt: string;
  uploadedByName: string;
  uploadedByPartner: string;
  frameworks: FrameworkMapping[];
  maturityDelta: MaturityDelta[];
  /** Whether Lara's proposal was accepted, declined or replaced by a manual assessment */
  laraVerdict?: LaraVerdict;
  /** Document type Lara proposed (may differ from final docType) */
  laraSuggestedType?: PartnerEvidenceDocType;
  /** Lara's confidence 0..1 */
  confidence?: number;
}


const STORAGE_KEY = "msp.partner-evidence.v1";
const EVENT_NAME = "msp:partner-evidence-changed";

function load(): PartnerEvidence[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PartnerEvidence[]) : [];
  } catch {
    return [];
  }
}

function save(items: PartnerEvidence[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getPartnerEvidence(customerId: string): PartnerEvidence[] {
  return load().filter((e) => e.customerId === customerId);
}

export function addPartnerEvidence(evidence: PartnerEvidence) {
  const all = load();
  save([evidence, ...all]);
}

export function removePartnerEvidence(id: string) {
  save(load().filter((e) => e.id !== id));
}

export function subscribePartnerEvidence(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

// ---------- Lara mock suggestions ----------
// In production this is an edge function (analyze-partner-evidence) backed by
// Lovable AI. For demo we map doc type -> proposed frameworks/controls/delta.

export const DOC_TYPE_LABEL: Record<PartnerEvidenceDocType, string> = {
  pentest: "Penetrasjonstest",
  dpia: "DPIA / Personvernkonsekvensvurdering",
  risk_assessment: "Risikovurdering",
  bcp: "Beredskapsplan (BCP)",
  certification: "Sertifisering",
  audit_report: "Revisjonsrapport",
  other: "Annet",
};

export const AREA_LABEL: Record<MaturityDelta["area"], string> = {
  governance: "Styring og ansvar",
  operations: "Sikkerhet",
  identityAccess: "Personvern og datahåndtering",
  vendor: "Tredjepart og verdikjede",
};

export interface LaraSuggestion {
  frameworks: FrameworkMapping[];
  maturityDelta: MaturityDelta[];
}

export function laraSuggestForDocType(docType: PartnerEvidenceDocType): LaraSuggestion {
  switch (docType) {
    case "pentest":
      return {
        frameworks: [
          { framework: "nis2", label: "NIS2", controlIds: ["Art. 21.2.e", "Art. 21.2.f", "Art. 21.2.h"] },
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["A.8.8", "A.8.29", "A.5.7"] },
        ],
        maturityDelta: [
          { area: "operations", delta: 8 },
          { area: "identityAccess", delta: 3 },
        ],
      };
    case "dpia":
      return {
        frameworks: [
          { framework: "gdpr", label: "GDPR", controlIds: ["Art. 35", "Art. 36"] },
          { framework: "nis2", label: "NIS2", controlIds: ["Art. 21.2.a"] },
        ],
        maturityDelta: [
          { area: "identityAccess", delta: 10 },
          { area: "governance", delta: 3 },
        ],
      };
    case "risk_assessment":
      return {
        frameworks: [
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["6.1.2", "6.1.3", "A.5.7"] },
          { framework: "nis2", label: "NIS2", controlIds: ["Art. 21.2.a", "Art. 21.2.b"] },
        ],
        maturityDelta: [
          { area: "governance", delta: 6 },
          { area: "operations", delta: 5 },
        ],
      };
    case "bcp":
      return {
        frameworks: [
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["A.5.29", "A.5.30", "A.8.13"] },
          { framework: "nis2", label: "NIS2", controlIds: ["Art. 21.2.c"] },
          { framework: "dora", label: "DORA", controlIds: ["Art. 11", "Art. 12"] },
        ],
        maturityDelta: [
          { area: "operations", delta: 6 },
          { area: "governance", delta: 2 },
        ],
      };
    case "certification":
      return {
        frameworks: [
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["A.5.1", "A.5.2"] },
        ],
        maturityDelta: [
          { area: "governance", delta: 10 },
          { area: "operations", delta: 5 },
          { area: "vendor", delta: 3 },
        ],
      };
    case "audit_report":
      return {
        frameworks: [
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["9.2", "9.3"] },
        ],
        maturityDelta: [
          { area: "governance", delta: 5 },
          { area: "vendor", delta: 4 },
        ],
      };
    default:
      return {
        frameworks: [
          { framework: "iso27001", label: "ISO 27001:2022", controlIds: ["A.5.1"] },
        ],
        maturityDelta: [{ area: "governance", delta: 2 }],
      };
  }
}

/** Sum approved enrichment per area across all customer evidence. */
export function enrichmentByArea(customerId: string): Record<MaturityDelta["area"], number> {
  const items = getPartnerEvidence(customerId);
  const out: Record<MaturityDelta["area"], number> = {
    governance: 0,
    operations: 0,
    identityAccess: 0,
    vendor: 0,
  };
  for (const e of items) {
    for (const d of e.maturityDelta) {
      out[d.area] = (out[d.area] ?? 0) + d.delta;
    }
  }
  return out;
}

// ---------- Lara document analysis (demo) ----------
// In production this calls an edge function that reads the document text and
// returns type + mapping + verbatim citations. Here we derive a plausible
// analysis from the file name so the prototype always shows the full flow.

export interface LaraAnalysis {
  docType: PartnerEvidenceDocType;
  confidence: number;
  summary: string;
  /** Excerpts supporting the proposed document type */
  typeCitations: EvidenceCitation[];
  frameworks: FrameworkMapping[];
  maturityDelta: MaturityDelta[];
}

const TYPE_HINTS: { type: PartnerEvidenceDocType; keys: string[] }[] = [
  { type: "pentest", keys: ["pentest", "penetration", "pen-test", "sårbarhet", "vulnerability"] },
  { type: "dpia", keys: ["dpia", "personvernkonsekvens", "pvk"] },
  { type: "risk_assessment", keys: ["risiko", "risk", "rov"] },
  { type: "bcp", keys: ["bcp", "beredskap", "continuity", "kontinuitet"] },
  { type: "certification", keys: ["iso", "sertifikat", "certificate", "27001"] },
  { type: "audit_report", keys: ["revisjon", "audit", "soc2", "soc-2"] },
];

const TYPE_CITATIONS: Record<PartnerEvidenceDocType, EvidenceCitation[]> = {
  pentest: [
    { page: "s. 1", quote: "Rapport fra ekstern penetrasjonstest av produksjonsmiljø" },
    { page: "s. 4", quote: "Testomfang: nettverk, webapplikasjon og autentiseringsflyt" },
  ],
  dpia: [
    { page: "s. 2", quote: "Vurdering av personvernkonsekvenser for behandlingsaktiviteten" },
    { page: "s. 6", quote: "Risikoreduserende tiltak og restrisiko er vurdert" },
  ],
  risk_assessment: [
    { page: "s. 2", quote: "Identifiserte risikoer er scoret på sannsynlighet og konsekvens" },
    { page: "s. 5", quote: "Risikoeier og behandlingsplan er dokumentert" },
  ],
  bcp: [
    { page: "s. 3", quote: "Gjenopprettingstid (RTO) og datatapstoleranse (RPO) definert" },
    { page: "s. 9", quote: "Beredskapsøvelse gjennomført og evaluert" },
  ],
  certification: [
    { page: "s. 1", quote: "Sertifikatet bekrefter samsvar med ISO/IEC 27001:2022" },
    { page: "s. 1", quote: "Utstedt av akkreditert sertifiseringsorgan" },
  ],
  audit_report: [
    { page: "s. 2", quote: "Uavhengig revisjon av styringssystemet er gjennomført" },
    { page: "s. 7", quote: "Avvik og observasjoner med frist for lukking" },
  ],
  other: [],
};

const FRAMEWORK_CITATIONS: Record<string, EvidenceCitation[]> = {
  nis2: [{ page: "s. 4", quote: "Testing av tekniske sikkerhetstiltak i drift" }],
  iso27001: [{ page: "s. 5", quote: "Funn knyttet til sårbarhetshåndtering og sikker utvikling" }],
  gdpr: [{ page: "s. 6", quote: "Behandling av personopplysninger er kartlagt" }],
  dora: [{ page: "s. 8", quote: "Krav til operasjonell motstandsdyktighet omtalt" }],
};

/** Derive a demo analysis with citations from the uploaded file name. */
export function mockLaraAnalysis(fileName: string): LaraAnalysis {
  const lower = fileName.toLowerCase();
  const hit = TYPE_HINTS.find((h) => h.keys.some((k) => lower.includes(k)));
  const docType: PartnerEvidenceDocType = hit?.type ?? "other";
  const base = laraSuggestForDocType(docType);
  const confidence = hit ? 0.87 : 0.42;

  return {
    docType,
    confidence,
    summary: hit
      ? `Dokumentet fremstår som ${DOC_TYPE_LABEL[docType].toLowerCase()} utført av ekstern part.`
      : "Lara finner ikke tydelige holdepunkter for dokumenttypen. Gjør en manuell vurdering.",
    typeCitations: TYPE_CITATIONS[docType] ?? [],
    frameworks: base.frameworks.map((f) => ({
      ...f,
      citations: FRAMEWORK_CITATIONS[f.framework] ?? [],
    })),
    maturityDelta: base.maturityDelta,
  };
}

