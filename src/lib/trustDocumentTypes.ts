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

export const isPolicyType = (type: string) => POLICY_TYPES.includes(type);
export const isCertType = (type: string) => CERT_TYPES.includes(type);
export const isOtherDocType = (type: string) =>
  !isPolicyType(type) && !isCertType(type);

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
    report: ["Rapport", "Report"],
    evidence: ["Bevis", "Evidence"],
    other: ["Annet", "Other"],
  };
  const pair = map[type];
  if (pair) return isNb ? pair[0] : pair[1];
  return type;
};
