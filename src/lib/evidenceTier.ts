/**
 * Evidence tier — utledet vekting for hvor sterkt et bevis er.
 *
 * Prinsipp: brukeren skal ALDRI velge tier. Da kan hvem som helst hevde 1,00.
 * Tier utledes av dokumenttype + signaler AI leser (signert avtale, akkreditert
 * sertifikat, revisorstempel, dato). Brukerens jobb er å bekrefte type og
 * plassering.
 */

export type TierLevel = "accredited" | "certified" | "signed" | "unverified";

export interface TierConfig {
  key: TierLevel;
  weight: number; // 0.30–1.00
  labelNb: string;
  labelEn: string;
  descriptionNb: string;
  descriptionEn: string;
}

export const TIER_CONFIG: Record<TierLevel, TierConfig> = {
  accredited: {
    key: "accredited",
    weight: 1.0,
    labelNb: "Akkreditert",
    labelEn: "Accredited",
    descriptionNb: "GDPR-sertifisert eller akkreditert revisjon.",
    descriptionEn: "GDPR certified or accredited audit.",
  },
  certified: {
    key: "certified",
    weight: 0.85,
    labelNb: "Sertifisert",
    labelEn: "Certified",
    descriptionNb: "ISO 27001, SOC 2 eller tilsvarende sertifikat.",
    descriptionEn: "ISO 27001, SOC 2 or equivalent certificate.",
  },
  signed: {
    key: "signed",
    weight: 0.6,
    labelNb: "Signert",
    labelEn: "Signed",
    descriptionNb: "Signert avtale eller policy med godkjenner.",
    descriptionEn: "Signed agreement or policy with an approver.",
  },
  unverified: {
    key: "unverified",
    weight: 0.3,
    labelNb: "Egenerklært",
    labelEn: "Self-declared",
    descriptionNb: "Uverifisert. Kan brukes som utkast.",
    descriptionEn: "Unverified. Usable as a draft.",
  },
};

export interface TierSignal {
  /** Kort maskinlesbar nøkkel — f.eks. "iso_27001_certificate" */
  key: string;
  labelNb: string;
  labelEn: string;
}

export interface TierResult {
  tier: TierLevel;
  weight: number;
  signals: TierSignal[];
  /** Menneskelig setning som forklarer hvorfor: "Akkreditert revisjon funnet → 1,00" */
  explanationNb: string;
  explanationEn: string;
}

/**
 * Utleder tier fra AI-signaler + dokumenttype. Aldri fra brukervalg.
 */
export function deriveTier(input: {
  documentType?: string | null;
  signals?: TierSignal[] | null;
  hasSignature?: boolean;
  hasApprover?: boolean;
}): TierResult {
  const signals = input.signals ?? [];
  const docType = (input.documentType ?? "").toLowerCase();
  const signalKeys = new Set(signals.map((s) => s.key));

  let tier: TierLevel = "unverified";

  const accreditedKeys = ["accredited_audit", "gdpr_certified", "iso_accredited"];
  const certifiedKeys = ["iso_27001_certificate", "soc2_report", "iso_27701_certificate", "iso_9001_certificate"];

  if (accreditedKeys.some((k) => signalKeys.has(k))) {
    tier = "accredited";
  } else if (
    certifiedKeys.some((k) => signalKeys.has(k)) ||
    /iso ?270\d\d|soc ?2|iso ?9001/.test(docType)
  ) {
    tier = "certified";
  } else if (input.hasSignature || input.hasApprover || signalKeys.has("signed_document") || /dpa|databehandler|kontrakt|avtale|policy/.test(docType)) {
    tier = "signed";
  }

  const cfg = TIER_CONFIG[tier];
  const signalTextNb = signals.length ? signals.map((s) => s.labelNb).join(", ") : cfg.descriptionNb;
  const signalTextEn = signals.length ? signals.map((s) => s.labelEn).join(", ") : cfg.descriptionEn;

  return {
    tier,
    weight: cfg.weight,
    signals,
    explanationNb: `${signalTextNb} → ${cfg.weight.toFixed(2).replace(".", ",")}`,
    explanationEn: `${signalTextEn} → ${cfg.weight.toFixed(2)}`,
  };
}

/** Sjekk om dokumentdato er eldre enn 6 måneder. */
export function isDocumentOutdated(documentDate?: string | null, monthsThreshold = 6): boolean {
  if (!documentDate) return false;
  const then = new Date(documentDate).getTime();
  if (Number.isNaN(then)) return false;
  const cutoff = Date.now() - monthsThreshold * 30 * 24 * 60 * 60 * 1000;
  return then < cutoff;
}
