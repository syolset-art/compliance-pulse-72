import { Shield, HardDrive, Mail, Globe, Users, Eye, FileCheck, LucideIcon } from "lucide-react";

export interface SecurityServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string; // tailwind bg class token
  textColor: string;
  icon: LucideIcon;
  linkedControls: string[]; // ISO 27001 requirement_ids
  linkedAssessmentKeys: string[]; // MSP assessment question keys
}

export const SECURITY_SERVICE_CATALOG: SecurityServiceCategory[] = [
  {
    id: "backup",
    name: "Backup & Restore",
    nameEn: "Backup & Restore",
    description: "Sikkerhetskopiering og gjenoppretting av data og systemer",
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: HardDrive,
    linkedControls: ["A.8.13", "A.12.3"],
    linkedAssessmentKeys: ["backup_testing_documented"],
  },
  {
    id: "endpoint",
    name: "Endepunktsikkerhet",
    nameEn: "Endpoint Security",
    description: "Beskyttelse av PCer, mobiler og andre enheter",
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: Shield,
    linkedControls: ["A.8.1", "A.8.7"],
    linkedAssessmentKeys: [],
  },
  {
    id: "email",
    name: "E-postsikkerhet",
    nameEn: "Email Security",
    description: "Beskyttelse mot phishing, spam og e-postbaserte angrep",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    icon: Mail,
    linkedControls: ["A.8.21", "A.8.23"],
    linkedAssessmentKeys: [],
  },
  {
    id: "network",
    name: "Nettverk & Sky",
    nameEn: "Network & Cloud Security",
    description: "Sikring av nettverk, brannmurer og skyinfrastruktur",
    color: "bg-violet-500",
    textColor: "text-violet-700 dark:text-violet-300",
    icon: Globe,
    linkedControls: ["A.8.20", "A.8.22", "A.8.26"],
    linkedAssessmentKeys: [],
  },
  {
    id: "awareness",
    name: "Sikkerhetskultur",
    nameEn: "Security Awareness",
    description: "Opplæring, bevisstgjøring og phishing-simulering",
    color: "bg-orange-500",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: Users,
    linkedControls: ["A.6.3", "A.7.2.2"],
    linkedAssessmentKeys: ["security_training"],
  },
  {
    id: "soc",
    name: "SOC-tjeneste",
    nameEn: "SOC Service",
    description: "Overvåking, deteksjon og respons på sikkerhetshendelser",
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-300",
    icon: Eye,
    linkedControls: ["A.8.15", "A.8.16", "A.16.1"],
    linkedAssessmentKeys: ["incident_handling"],
  },
  {
    id: "compliance",
    name: "Compliance",
    nameEn: "Compliance",
    description: "Etterlevelse av regelverk, policyer og internkontroll",
    color: "bg-teal-500",
    textColor: "text-teal-700 dark:text-teal-300",
    icon: FileCheck,
    linkedControls: ["A.5.1", "A.5.2", "A.5.31"],
    linkedAssessmentKeys: ["risk_assessment_approved", "processing_records", "dpa_with_vendors"],
  },
];

export type ServiceCoverageStatus = "covered" | "missing" | "unknown";

export interface ServiceCoverageResult {
  service: SecurityServiceCategory;
  status: ServiceCoverageStatus;
  reason?: string;
}

/**
 * Evaluate coverage for each service category based on assessment responses.
 */
export function evaluateServiceCoverage(
  assessmentResponses: Record<string, string> | null
): ServiceCoverageResult[] {
  return SECURITY_SERVICE_CATALOG.map((service) => {
    if (!assessmentResponses || service.linkedAssessmentKeys.length === 0) {
      return { service, status: "unknown" as const, reason: "Ingen kartlegging tilgjengelig" };
    }

    const linkedAnswers = service.linkedAssessmentKeys.map(
      (key) => assessmentResponses[key]
    );

    const allYes = linkedAnswers.every((a) => a === "yes");
    const anyNo = linkedAnswers.some((a) => a === "no");

    if (allYes) {
      return { service, status: "covered" as const };
    }
    if (anyNo) {
      return { service, status: "missing" as const, reason: "Mangler tiltak basert på kartlegging" };
    }
    return { service, status: "unknown" as const, reason: "Ikke fullstendig kartlagt" };
  });
}
