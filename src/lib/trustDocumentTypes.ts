// Shared definitions for vendor_documents categorization across
// Trust Center pages (Evidence, Policies, Trust Profile).

export const POLICY_TYPES = [
  "policy",
  "privacy_policy",
  "acceptable_use",
  "incident_response",
  "security_policy",
  "data_protection_policy",
];

export const CERT_TYPES = ["certification"];

// Avtaler & bevis — DPA, pentest, SOC 2-rapport, revisjon m.m.
export const EVIDENCE_TYPES = [
  "agreement",
  "dpa",
  "evidence",
  "pentest",
  "report",
  "soc2_report",
  "audit_report",
];

export const isPolicyType = (type: string) => POLICY_TYPES.includes(type);
export const isCertType = (type: string) => CERT_TYPES.includes(type);
export const isEvidenceType = (type: string) => EVIDENCE_TYPES.includes(type);
export const isOtherDocType = (type: string) =>
  !isPolicyType(type) && !isCertType(type) && !isEvidenceType(type);

export const docTypeLabel = (type: string, isNb: boolean): string => {
  const map: Record<string, [string, string]> = {
    policy: ["Retningslinje", "Policy"],
    privacy_policy: ["Personvernerklæring", "Privacy Policy"],
    acceptable_use: ["Akseptabel bruk", "Acceptable Use"],
    incident_response: ["Hendelseshåndtering", "Incident Response"],
    security_policy: ["Sikkerhetspolicy", "Security Policy"],
    data_protection_policy: ["Databeskyttelsespolicy", "Data Protection Policy"],
    certification: ["Sertifisering", "Certification"],
    agreement: ["Avtale", "Agreement"],
    dpa: ["Databehandleravtale (DPA)", "Data Processing Agreement (DPA)"],
    report: ["Rapport", "Report"],
    evidence: ["Bevis", "Evidence"],
    pentest: ["Penetrasjonstest", "Penetration Test"],
    soc2_report: ["SOC 2-rapport", "SOC 2 Report"],
    audit_report: ["Revisjonsrapport", "Audit Report"],
    other: ["Annet", "Other"],
  };
  const pair = map[type];
  if (pair) return isNb ? pair[0] : pair[1];
  return type;
};
