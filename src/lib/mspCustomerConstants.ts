export const INDUSTRIES = [
  "Teknologi", "Helse", "Finans", "Offentlig", "Utdanning",
  "Energi", "Bygg og anlegg", "Transport", "Handel", "Annet",
];

export const EMPLOYEE_RANGES = [
  "1-10", "11-50", "51-200", "201-500", "500+",
];

export const COMPANY_CATEGORY_LABELS: Record<string, string> = {
  startup: "Oppstart / Vekstfase",
  established: "Etablert virksomhet",
  regulated: "Regulert / Kritisk aktør",
};

export interface MspSubscriptionTier {
  id: string;
  name: string;
  monthlyPriceKr: number;
  description: string;
  features: string[];
}

export const MSP_SUBSCRIPTION_TIERS: MspSubscriptionTier[] = [
  {
    id: "gratis",
    name: "Gratis",
    monthlyPriceKr: 0,
    description: "Grunnleggende compliance-oversikt",
    features: ["Trust Profile", "Compliance-score", "Grunnleggende rapporter"],
  },
  {
    id: "basis",
    name: "Basis",
    monthlyPriceKr: 4900,
    description: "For SMB-kunder som trenger mer",
    features: ["Alt i Gratis", "Utvidede moduler", "50 credits/mnd inkludert"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPriceKr: 8900,
    description: "Full tilgang med alle komponenter",
    features: ["Alt i Basis", "Alle moduler", "300 credits/mnd inkludert", "Prioritert support"],
  },
];

/** @deprecated Use MSP_SUBSCRIPTION_TIERS */
export const SUBSCRIPTION_PLANS = MSP_SUBSCRIPTION_TIERS.map((t) => t.name);

export const COMPANY_ROLES = [
  "Daglig leder",
  "IT-sjef / CTO",
  "Administrasjonsleder",
  "Avdelingsleder",
  "Annet",
];

export const COMPLIANCE_ROLES = [
  "Compliance-ansvarlig",
  "Personvernombud (DPO)",
  "Sikkerhetsansvarlig (CISO)",
  "AI Governance-ansvarlig",
  "Operativ bruker",
  "Ingen spesifikk rolle",
];
