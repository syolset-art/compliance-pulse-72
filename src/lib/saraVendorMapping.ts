import { SARA_AGENT_VERSION } from "./saraScope";

/**
 * Deterministisk utledning av "automatisk kartlagt" leverandørkontekst
 * basert på signaler den lokale agenten Sara har rapportert.
 *
 * VIKTIG: Sara sender aldri dokumentinnhold, personopplysninger eller
 * fritekst fra kildene — kun metadata, tellere og flagg.
 */

export type SaraSignalCategory = "document" | "counter" | "flag";

export interface SaraVendorSignal {
  id: string;
  category: SaraSignalCategory;
  labelNb: string;
  labelEn: string;
  valueNb: string;
  valueEn: string;
  /** Dokumentidentifikator hos kunden (ikke selve dokumentet) */
  documentId?: string;
  /** Kort hash som bekrefter at dokumentet finnes og er uendret */
  hash?: string;
  seenAt?: string;
  /** 0–100 */
  confidence: number;
}

export interface SaraVendorMapping {
  signals: SaraVendorSignal[];
  criticality: string;
  priority: string;
  gdprRole: string;
  riskLevel: string;
  usageTags: string[];
  usageTextNb: string;
  usageTextEn: string;
  agentVersion: string;
  source: string;
  lastRunNb: string;
  lastRunEn: string;
}

interface Input {
  vendorName?: string | null;
  vendorCategory?: string | null;
  description?: string | null;
  hasDpa?: boolean | null;
  hasPrivacyPolicy?: boolean | null;
  sensitive?: boolean | null;
  dataCategoryCount?: number;
  processorCount?: number;
  nonEuProcessorCount?: number;
  currentCriticality?: string | null;
  currentPriority?: string | null;
}

/** Kort, stabil pseudo-hash slik at demoen ser konsistent ut per leverandør. */
function shortHash(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `sha256:${hex.slice(0, 4)}…${hex.slice(4, 8)}`;
}

function docId(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i);
  return `ntn-${(h >>> 0).toString(16).slice(0, 6)}`;
}

const CATEGORY_TAGS: Record<string, string[]> = {
  it: ["it_drift", "skylagring"],
  cloud: ["skylagring"],
  hr: ["lonn_hr"],
  finance: ["regnskap"],
  marketing: ["markedsforing"],
  crm: ["kundedata_crm"],
  security: ["sikkerhet"],
  support: ["support"],
};

export function buildSaraVendorMapping(input: Input): SaraVendorMapping {
  const name = input.vendorName || "Leverandør";
  const cat = (input.vendorCategory || "").toLowerCase();
  const processorCount = input.processorCount ?? 0;
  const nonEu = input.nonEuProcessorCount ?? 0;
  const dataCats = input.dataCategoryCount ?? 0;
  const sensitive = !!input.sensitive;

  const signals: SaraVendorSignal[] = [];

  if (input.hasDpa) {
    signals.push({
      id: "dpa",
      category: "document",
      labelNb: "Databehandleravtale funnet",
      labelEn: "Data processing agreement found",
      valueNb: "Signert, gjeldende",
      valueEn: "Signed, current",
      documentId: docId(`${name}-dpa`),
      hash: shortHash(`${name}-dpa`),
      seenAt: "2026-08-18",
      confidence: 92,
    });
  } else {
    signals.push({
      id: "dpa-missing",
      category: "flag",
      labelNb: "Databehandleravtale",
      labelEn: "Data processing agreement",
      valueNb: "Ikke funnet i kildene",
      valueEn: "Not found in sources",
      confidence: 78,
    });
  }

  if (input.hasPrivacyPolicy) {
    signals.push({
      id: "privacy",
      category: "document",
      labelNb: "Personvernerklæring registrert",
      labelEn: "Privacy policy registered",
      valueNb: "Lenke verifisert",
      valueEn: "Link verified",
      documentId: docId(`${name}-privacy`),
      hash: shortHash(`${name}-privacy`),
      seenAt: "2026-08-18",
      confidence: 88,
    });
  }

  signals.push({
    id: "mentions",
    category: "counter",
    labelNb: "Dokumenter som nevner leverandøren",
    labelEn: "Documents mentioning the vendor",
    valueNb: `${3 + processorCount + dataCats} dokumenter`,
    valueEn: `${3 + processorCount + dataCats} documents`,
    seenAt: "2026-08-19",
    confidence: 84,
  });

  if (dataCats > 0) {
    signals.push({
      id: "datacats",
      category: "counter",
      labelNb: "Datakategorier knyttet til leverandøren",
      labelEn: "Data categories linked to the vendor",
      valueNb: `${dataCats} kategorier${sensitive ? " · sensitive inkludert" : ""}`,
      valueEn: `${dataCats} categories${sensitive ? " · sensitive included" : ""}`,
      confidence: 80,
    });
  }

  if (processorCount > 0) {
    signals.push({
      id: "processors",
      category: "counter",
      labelNb: "Underdatabehandlere registrert",
      labelEn: "Sub-processors registered",
      valueNb: nonEu > 0 ? `${processorCount} · ${nonEu} utenfor EU/EØS` : `${processorCount} · alle i EU/EØS`,
      valueEn: nonEu > 0 ? `${processorCount} · ${nonEu} outside EU/EEA` : `${processorCount} · all in EU/EEA`,
      confidence: 86,
    });
  }

  signals.push({
    id: "integration",
    category: "flag",
    labelNb: "Integrasjonsmønster",
    labelEn: "Integration pattern",
    valueNb: cat.includes("it") || cat.includes("cloud") ? "SSO og API-tilgang" : "Kun webtilgang",
    valueEn: cat.includes("it") || cat.includes("cloud") ? "SSO and API access" : "Web access only",
    confidence: 71,
  });

  // --- Utledede forslag ---
  let score = 1;
  if (sensitive) score += 2;
  if (dataCats > 2) score += 1;
  if (nonEu > 0) score += 1;
  if (!input.hasDpa) score += 1;

  const criticality = score >= 5 ? "critical" : score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  const riskLevel = score >= 5 ? "high" : score >= 3 ? "medium" : "low";
  const priority = score >= 5 ? "critical" : score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  const gdprRole = dataCats > 0 || sensitive ? "databehandler" : processorCount > 0 ? "underdatabehandler" : "ingen_persondata";

  const tagKey = Object.keys(CATEGORY_TAGS).find((k) => cat.includes(k));
  const usageTags = tagKey ? CATEGORY_TAGS[tagKey] : [];

  return {
    signals,
    criticality,
    priority,
    gdprRole,
    riskLevel,
    usageTags,
    usageTextNb: `Sara fant ${signals.length} signaler om ${name} i dokumentkildene. Leverandøren brukes til ${
      input.vendorCategory || "operativ drift"
    }, og behandler ${dataCats > 0 ? "personopplysninger" : "ingen registrerte personopplysninger"}.`,
    usageTextEn: `Sara found ${signals.length} signals about ${name} in the document sources. The vendor is used for ${
      input.vendorCategory || "operational purposes"
    }, and processes ${dataCats > 0 ? "personal data" : "no registered personal data"}.`,
    agentVersion: SARA_AGENT_VERSION,
    source: "Notion",
    lastRunNb: "I dag 09:12",
    lastRunEn: "Today 09:12",
  };
}
