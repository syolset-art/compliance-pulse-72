// Særlige kategorier av personopplysninger (GDPR art. 9 og art. 10).
export interface SensitiveDataCategory {
  value: string;
  labelNb: string;
  labelEn: string;
}

export const SENSITIVE_DATA_CATEGORIES: SensitiveDataCategory[] = [
  { value: "health", labelNb: "Helseopplysninger", labelEn: "Health data" },
  { value: "biometric", labelNb: "Biometri", labelEn: "Biometric data" },
  { value: "genetic", labelNb: "Genetiske data", labelEn: "Genetic data" },
  { value: "ethnicity", labelNb: "Etnisitet", labelEn: "Racial or ethnic origin" },
  { value: "religion", labelNb: "Religion eller livssyn", labelEn: "Religion or beliefs" },
  { value: "union", labelNb: "Fagforeningsmedlemskap", labelEn: "Trade union membership" },
  { value: "sexlife", labelNb: "Seksuelle forhold", labelEn: "Sex life or orientation" },
  { value: "politics", labelNb: "Politisk oppfatning", labelEn: "Political opinions" },
  { value: "criminal", labelNb: "Straffedommer og lovovertredelser", labelEn: "Criminal convictions" },
];

export function sensitiveCategoryLabel(value: string, isNb: boolean): string {
  const c = SENSITIVE_DATA_CATEGORIES.find((x) => x.value === value);
  if (!c) return value;
  return isNb ? c.labelNb : c.labelEn;
}

/** GDPR-roller der spørsmålet om særlige kategorier er relevant. */
export function gdprRoleHandlesPersonalData(role: string | null | undefined): boolean {
  return !!role && role !== "not_set" && role !== "ingen_persondata";
}
