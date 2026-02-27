import { Rocket, TrendingUp, Building2, ShieldCheck } from "lucide-react";
import type { CertificationPhase } from "./certificationPhases";

export type GovernanceLevel = "foundation" | "structured" | "certification_ready";

export type CompanyCategory = "startup" | "scaleup" | "established" | "regulated";

export interface CompanyCategoryDefinition {
  id: CompanyCategory;
  name_no: string;
  name_en: string;
  description_no: string;
  description_en: string;
  icon: typeof Rocket;
}

export const COMPANY_CATEGORIES: CompanyCategoryDefinition[] = [
  {
    id: "startup",
    name_no: "Oppstart",
    name_en: "Startup",
    description_no: "Tidlig fase, bygger struktur. Typisk under 20 ansatte.",
    description_en: "Early stage, building structure. Typically under 20 employees.",
    icon: Rocket,
  },
  {
    id: "scaleup",
    name_no: "Scaleup / Vekstfase",
    name_en: "Scaleup / Growth phase",
    description_no: "Voksende virksomhet som trenger skalerbar compliance.",
    description_en: "Growing business that needs scalable compliance.",
    icon: TrendingUp,
  },
  {
    id: "established",
    name_no: "Etablert virksomhet",
    name_en: "Established business",
    description_no: "Stabil drift, modne prosesser. SMB eller større.",
    description_en: "Stable operations, mature processes. SMB or larger.",
    icon: Building2,
  },
  {
    id: "regulated",
    name_no: "Regulert / Kritisk aktør",
    name_en: "Regulated / Critical actor",
    description_no: "Høye krav uavhengig av størrelse. Helse, finans, kritisk infrastruktur.",
    description_en: "High requirements regardless of size. Health, finance, critical infrastructure.",
    icon: ShieldCheck,
  },
];

export interface GovernanceLevelDefinition {
  id: GovernanceLevel;
  name_no: string;
  name_en: string;
  description_no: string;
  description_en: string;
  visiblePhases: CertificationPhase[];
}

export const GOVERNANCE_LEVELS: GovernanceLevelDefinition[] = [
  {
    id: "foundation",
    name_no: "Nivå 1 – Grunnleggende",
    name_en: "Level 1 – Foundation",
    description_no: "Fokus på å få orden på det grunnleggende: GDPR, systemoversikt og leverandører.",
    description_en: "Focus on getting the basics right: GDPR, system overview and vendors.",
    visiblePhases: ["foundation", "implementation"],
  },
  {
    id: "structured",
    name_no: "Nivå 2 – Strukturert",
    name_en: "Level 2 – Structured",
    description_no: "Drift med avvikshåndtering, rapporter og leverandørvurdering.",
    description_en: "Operations with deviation handling, reports and vendor assessment.",
    visiblePhases: ["foundation", "implementation", "operation"],
  },
  {
    id: "certification_ready",
    name_no: "Nivå 3 – Sertifiseringsklar",
    name_en: "Level 3 – Certification ready",
    description_no: "Full ISO-readiness med intern audit og sertifiseringsforberedelse.",
    description_en: "Full ISO readiness with internal audit and certification preparation.",
    visiblePhases: ["foundation", "implementation", "operation", "audit", "certification"],
  },
];

export function calculateGovernanceLevel(category: string): GovernanceLevel {
  if (category === "regulated") return "certification_ready";
  if (category === "established" || category === "scaleup") return "structured";
  return "foundation";
}

export function categoryToMaturity(category: string): string {
  if (category === "regulated") return "advanced";
  if (category === "established" || category === "scaleup") return "intermediate";
  return "beginner";
}

export function getVisiblePhases(level: GovernanceLevel | null | undefined): CertificationPhase[] {
  const def = GOVERNANCE_LEVELS.find((g) => g.id === level);
  if (!def) return ["foundation", "implementation", "operation", "audit", "certification"];
  return def.visiblePhases;
}

export function getGovernanceLevelDef(level: GovernanceLevel | null | undefined): GovernanceLevelDefinition | undefined {
  return GOVERNANCE_LEVELS.find((g) => g.id === level);
}

/** Map Brreg employee count to a company category */
export function mapEmployeeCountToCategory(count: number): CompanyCategory {
  if (count >= 50) return "established";
  return "startup";
}

/** Parse old employee ranges or new category IDs to a numeric weight for key personnel rules */
export function categoryToEmployeeWeight(value: string): number {
  switch (value) {
    case "startup": return 25;
    case "scaleup": return 75;
    case "established": return 100;
    case "regulated": return 200;
    // Legacy fallbacks
    case "1-10": return 5;
    case "11-50": return 30;
    case "51-200": return 100;
    case "201-500": return 350;
    case "500-1000":
    case "501-1000": return 750;
    case "1000+": return 1000;
    default: return 0;
  }
}
