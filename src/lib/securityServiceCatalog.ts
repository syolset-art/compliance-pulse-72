import { Shield, HardDrive, Mail, Globe, Users, Eye, FileCheck, LucideIcon } from "lucide-react";

export interface MSPProduct {
  name: string;
  vendor: string;
  description: string;
}

export interface SecurityServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  textColor: string;
  icon: LucideIcon;
  linkedControls: string[];
  linkedAssessmentKeys: string[];
  mspRecommendation: string;
  mspProducts: MSPProduct[];
  implementationSteps: string[];
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
    mspRecommendation: "Implementer automatisert backup med jevnlig testing av gjenoppretting. MSP bør tilby overvåket backup med varsling ved feil.",
    mspProducts: [
      { name: "Acronis Cyber Protect Cloud", vendor: "Acronis", description: "Backup, disaster recovery og cybersikkerhet i én løsning" },
      { name: "Veeam Backup & Replication", vendor: "Veeam", description: "Enterprise-grade backup for sky og on-premise" },
    ],
    implementationSteps: [
      "Kartlegg kritiske data og systemer",
      "Sett opp daglig automatisert backup",
      "Konfigurer offsite/sky-kopi (3-2-1 regelen)",
      "Planlegg kvartalsvis gjenopprettingstest",
      "Dokumenter backup-policy i henhold til ISO 27001",
    ],
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
    mspRecommendation: "Alle endepunkter bør ha EDR (Endpoint Detection & Response) med sentralisert administrasjon. MSP overvåker og responderer på trusler.",
    mspProducts: [
      { name: "SentinelOne Singularity", vendor: "SentinelOne", description: "AI-drevet EDR med automatisert respons" },
      { name: "Microsoft Defender for Endpoint", vendor: "Microsoft", description: "Integrert sikkerhet for Windows-miljøer" },
    ],
    implementationSteps: [
      "Installer EDR-agent på alle enheter",
      "Konfigurer sentralisert dashboard for overvåking",
      "Sett opp automatisk respons-policy",
      "Aktiver disk-kryptering (BitLocker/FileVault)",
      "Implementer patch management-rutiner",
    ],
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
    mspRecommendation: "E-post er den vanligste angrepsvektoren. Implementer avansert e-postfiltrering med anti-phishing og sandboxing.",
    mspProducts: [
      { name: "Proofpoint Email Protection", vendor: "Proofpoint", description: "Avansert beskyttelse mot phishing og BEC" },
      { name: "Microsoft Defender for Office 365", vendor: "Microsoft", description: "E-postsikkerhet integrert i M365" },
    ],
    implementationSteps: [
      "Aktiver SPF, DKIM og DMARC for domenet",
      "Implementer avansert e-postfiltrering",
      "Sett opp anti-phishing policy",
      "Konfigurer varsling ved mistenkelige vedlegg",
      "Gjennomfør phishing-simulering kvartalsvis",
    ],
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
    mspRecommendation: "Sikre nettverket med next-gen brannmur, segmentering og VPN. Skyressurser bør ha Zero Trust-tilgang.",
    mspProducts: [
      { name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen brannmur med SD-WAN" },
      { name: "Cloudflare Zero Trust", vendor: "Cloudflare", description: "Zero Trust nettverkstilgang uten VPN" },
    ],
    implementationSteps: [
      "Kartlegg nettverksarkitektur og segmenter",
      "Implementer next-gen brannmur med IPS/IDS",
      "Sett opp VPN eller Zero Trust for fjerntilgang",
      "Aktiver nettverksovervåking og logging",
      "Gjennomfør årlig penetrasjonstest",
    ],
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
    mspRecommendation: "Menneskelige feil er den største risikoen. Regelmessig opplæring og simulert phishing reduserer risikoen dramatisk.",
    mspProducts: [
      { name: "KnowBe4 Security Awareness", vendor: "KnowBe4", description: "Verdens største plattform for sikkerhetsopplæring" },
      { name: "Mynder Me – Mikrokurs", vendor: "Mynder", description: "Korte, målrettede sikkerhetskurs for ansatte" },
    ],
    implementationSteps: [
      "Gjennomfør baseline phishing-test",
      "Registrer alle ansatte i opplæringsplattform",
      "Start med obligatorisk grunnkurs i informasjonssikkerhet",
      "Planlegg månedlige phishing-simuleringer",
      "Mål fremgang og rapporter til ledelsen",
    ],
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
    mspRecommendation: "24/7 overvåking via SOC sikrer rask deteksjon og respons. MSP tilbyr dette som en managed service.",
    mspProducts: [
      { name: "Arctic Wolf MDR", vendor: "Arctic Wolf", description: "Managed Detection & Response med 24/7 SOC" },
      { name: "Heimdal Threat Hunting", vendor: "Heimdal", description: "Proaktiv trusseljakt og hendelsesrespons" },
    ],
    implementationSteps: [
      "Koble loggkilder til SIEM/SOC-plattform",
      "Definer hendelseskategorier og eskaleringsrutiner",
      "Sett opp 24/7 varsling for kritiske hendelser",
      "Etabler incident response-plan",
      "Gjennomfør årlig tabletop-øvelse",
    ],
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
    mspRecommendation: "Compliance er fundamentet for alle sikkerhetstjenester. Mynder-plattformen automatiserer compliance-arbeidet.",
    mspProducts: [
      { name: "Mynder Compliance Platform", vendor: "Mynder", description: "Helhetlig compliance-plattform med AI-støtte" },
      { name: "Mynder Trust Profile", vendor: "Mynder", description: "Automatisert tillitsprofil for kunder og leverandører" },
    ],
    implementationSteps: [
      "Gjennomfør innledende kartlegging via Mynder",
      "Aktiver relevante rammeverk (ISO 27001, GDPR, NIS2)",
      "Opprett behandlingsprotokoll og risikovurdering",
      "Signer databehandleravtaler med alle leverandører",
      "Sett opp årshjul for løpende compliance-arbeid",
    ],
  },
];

export type ServiceCoverageStatus = "covered" | "missing" | "unknown";

export interface ServiceCoverageResult {
  service: SecurityServiceCategory;
  status: ServiceCoverageStatus;
  reason?: string;
}

// Demo: simulate that some services are already implemented for self-profiles
const DEMO_IMPLEMENTED_SERVICES = ["backup", "compliance", "awareness"];

export function evaluateServiceCoverage(
  assessmentResponses: Record<string, string> | null,
  useDemoData?: boolean
): ServiceCoverageResult[] {
  return SECURITY_SERVICE_CATALOG.map((service) => {
    // In demo mode, mark some services as covered
    if (useDemoData && DEMO_IMPLEMENTED_SERVICES.includes(service.id)) {
      return { service, status: "covered" as const, reason: "Implementert via MSP-partner" };
    }

    if (!assessmentResponses || service.linkedAssessmentKeys.length === 0) {
      if (useDemoData) {
        // For demo: mark services without assessment keys as unknown
        return { service, status: "unknown" as const, reason: "Ikke kartlagt ennå" };
      }
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
