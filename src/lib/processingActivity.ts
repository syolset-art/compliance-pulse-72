/**
 * Konstanter og typer for behandlingsaktiviteter (RoPA, GDPR art. 30).
 * Én kilde til sannhet for datatype-klassifisering, art. 9/10-kategorier
 * og behandlingsgrunnlag.
 */

export type DataClass = "none" | "ordinary" | "sensitive";

export interface DataClassOption {
  value: DataClass;
  labelNb: string;
  labelEn: string;
  descNb: string;
  descEn: string;
}

export const DATA_CLASS_OPTIONS: DataClassOption[] = [
  {
    value: "none",
    labelNb: "Ingen personopplysninger",
    labelEn: "No personal data",
    descNb: "Systemet brukes ikke til å behandle personopplysninger.",
    descEn: "The system is not used to process personal data.",
  },
  {
    value: "ordinary",
    labelNb: "Ordinære personopplysninger",
    labelEn: "Ordinary personal data",
    descNb: "F.eks. navn, e-post, kontaktinfo, arbeidsrelaterte data.",
    descEn: "E.g. name, email, contact info, work-related data.",
  },
  {
    value: "sensitive",
    labelNb: "Sensitive personopplysninger",
    labelEn: "Special categories of personal data",
    descNb: "Særlige kategorier (art. 9) eller straffedommer (art. 10).",
    descEn: "Special categories (Art. 9) or criminal convictions (Art. 10).",
  },
];

export interface SpecialCategory {
  key: string;
  article: "9" | "10";
  labelNb: string;
  labelEn: string;
}

/** GDPR art. 9 (særlige kategorier) og art. 10 (straffedommer og lovovertredelser). */
export const SPECIAL_CATEGORIES: SpecialCategory[] = [
  { key: "racial_ethnic", article: "9", labelNb: "Rase eller etnisk opprinnelse", labelEn: "Racial or ethnic origin" },
  { key: "political", article: "9", labelNb: "Politisk oppfatning", labelEn: "Political opinions" },
  { key: "religion", article: "9", labelNb: "Religiøs eller filosofisk overbevisning", labelEn: "Religious or philosophical beliefs" },
  { key: "union", article: "9", labelNb: "Fagforeningsmedlemskap", labelEn: "Trade union membership" },
  { key: "genetic", article: "9", labelNb: "Genetiske data", labelEn: "Genetic data" },
  { key: "biometric", article: "9", labelNb: "Biometriske data", labelEn: "Biometric data" },
  { key: "health", article: "9", labelNb: "Helseopplysninger", labelEn: "Health data" },
  { key: "sex_life", article: "9", labelNb: "Seksuell orientering eller sexliv", labelEn: "Sex life or sexual orientation" },
  { key: "criminal", article: "10", labelNb: "Straffedommer og lovovertredelser", labelEn: "Criminal convictions and offences" },
];

export interface LegalBasisOption {
  value: string;
  labelNb: string;
  labelEn: string;
}

/** GDPR art. 6(1) behandlingsgrunnlag. */
export const LEGAL_BASIS_OPTIONS: LegalBasisOption[] = [
  { value: "consent", labelNb: "Samtykke (art. 6(1)(a))", labelEn: "Consent (Art. 6(1)(a))" },
  { value: "contract", labelNb: "Avtale (art. 6(1)(b))", labelEn: "Contract (Art. 6(1)(b))" },
  { value: "legal_obligation", labelNb: "Rettslig forpliktelse (art. 6(1)(c))", labelEn: "Legal obligation (Art. 6(1)(c))" },
  { value: "vital_interests", labelNb: "Vitale interesser (art. 6(1)(d))", labelEn: "Vital interests (Art. 6(1)(d))" },
  { value: "public_task", labelNb: "Offentlig oppgave (art. 6(1)(e))", labelEn: "Public task (Art. 6(1)(e))" },
  { value: "legitimate_interest", labelNb: "Berettiget interesse (art. 6(1)(f))", labelEn: "Legitimate interest (Art. 6(1)(f))" },
];

export const dataClassLabel = (value: string | null | undefined, isNb: boolean): string => {
  const opt = DATA_CLASS_OPTIONS.find((o) => o.value === value);
  if (!opt) return isNb ? "Ikke vurdert" : "Not assessed";
  return isNb ? opt.labelNb : opt.labelEn;
};

export const specialCategoryLabel = (key: string, isNb: boolean): string => {
  const cat = SPECIAL_CATEGORIES.find((c) => c.key === key);
  return cat ? (isNb ? cat.labelNb : cat.labelEn) : key;
};
