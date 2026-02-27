import { Shield, HardDrive, Mail, Globe, Users, Eye, FileCheck, ShieldAlert, LucideIcon } from "lucide-react";

export interface AcronisModule {
  id: string;
  name: string;
  acronisPackage: string;
  priceIndicator: "included" | "addon";
  description: string;
  isActive: boolean;
}

export interface MSPProduct {
  id: string;
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
  acronisModules: AcronisModule[];
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
      { id: "msp-acronis-backup", name: "Acronis Cyber Protect Cloud", vendor: "Acronis", description: "Backup, disaster recovery og cybersikkerhet i én løsning" },
      { id: "msp-veeam-backup", name: "Veeam Backup & Replication", vendor: "Veeam", description: "Enterprise-grade backup for sky og on-premise" },
    ],
    implementationSteps: [
      "Kartlegg kritiske data og systemer",
      "Sett opp daglig automatisert backup",
      "Konfigurer offsite/sky-kopi (3-2-1 regelen)",
      "Planlegg kvartalsvis gjenopprettingstest",
      "Dokumenter backup-policy i henhold til ISO 27001",
    ],
    acronisModules: [
      { id: "adv-backup", name: "Advanced Backup", acronisPackage: "Cyber Protect Cloud", priceIndicator: "included", description: "Automatisert backup med cloud-lagring, inkrementell backup og rask gjenoppretting", isActive: true },
      { id: "disaster-recovery", name: "Disaster Recovery", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Failover til sky-infrastruktur med minimal nedetid ved katastrofer", isActive: false },
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
      { id: "msp-sentinelone", name: "SentinelOne Singularity", vendor: "SentinelOne", description: "AI-drevet EDR med automatisert respons" },
      { id: "msp-defender-endpoint", name: "Microsoft Defender for Endpoint", vendor: "Microsoft", description: "Integrert sikkerhet for Windows-miljøer" },
    ],
    implementationSteps: [
      "Installer EDR-agent på alle enheter",
      "Konfigurer sentralisert dashboard for overvåking",
      "Sett opp automatisk respons-policy",
      "Aktiver disk-kryptering (BitLocker/FileVault)",
      "Implementer patch management-rutiner",
    ],
    acronisModules: [
      { id: "adv-security-edr", name: "Advanced Security + EDR", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Endepunktbeskyttelse med AI-drevet deteksjon, automatisk respons og trusselanalyse", isActive: false },
      { id: "adv-management", name: "Advanced Management", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Sentralisert patching, software-inventar og remote management av alle enheter", isActive: false },
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
      { id: "msp-proofpoint", name: "Proofpoint Email Protection", vendor: "Proofpoint", description: "Avansert beskyttelse mot phishing og BEC" },
      { id: "msp-defender-o365", name: "Microsoft Defender for Office 365", vendor: "Microsoft", description: "E-postsikkerhet integrert i M365" },
    ],
    implementationSteps: [
      "Aktiver SPF, DKIM og DMARC for domenet",
      "Implementer avansert e-postfiltrering",
      "Sett opp anti-phishing policy",
      "Konfigurer varsling ved mistenkelige vedlegg",
      "Gjennomfør phishing-simulering kvartalsvis",
    ],
    acronisModules: [
      { id: "adv-email-security", name: "Advanced Email Security", acronisPackage: "Perception Point", priceIndicator: "addon", description: "E-postbeskyttelse med anti-phishing, anti-malware og BEC-deteksjon via Perception Point", isActive: false },
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
      { id: "msp-fortigate", name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen brannmur med SD-WAN" },
      { id: "msp-cloudflare-zt", name: "Cloudflare Zero Trust", vendor: "Cloudflare", description: "Zero Trust nettverkstilgang uten VPN" },
    ],
    implementationSteps: [
      "Kartlegg nettverksarkitektur og segmenter",
      "Implementer next-gen brannmur med IPS/IDS",
      "Sett opp VPN eller Zero Trust for fjerntilgang",
      "Aktiver nettverksovervåking og logging",
      "Gjennomfør årlig penetrasjonstest",
    ],
    acronisModules: [
      { id: "adv-monitoring", name: "Advanced Monitoring", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Overvåking av nettverksenheter, servere og tjenester med varsling og dashboards", isActive: false },
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
      { id: "msp-knowbe4", name: "KnowBe4 Security Awareness", vendor: "KnowBe4", description: "Verdens største plattform for sikkerhetsopplæring" },
      { id: "msp-mynder-mikrokurs", name: "Mynder Me – Mikrokurs", vendor: "Mynder", description: "Korte, målrettede sikkerhetskurs for ansatte" },
    ],
    implementationSteps: [
      "Gjennomfør baseline phishing-test",
      "Registrer alle ansatte i opplæringsplattform",
      "Start med obligatorisk grunnkurs i informasjonssikkerhet",
      "Planlegg månedlige phishing-simuleringer",
      "Mål fremgang og rapporter til ledelsen",
    ],
    acronisModules: [
      { id: "security-awareness", name: "Security Awareness Training", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Automatiserte phishing-simuleringer og sikkerhetskurs for alle ansatte", isActive: true },
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
      { id: "msp-arctic-wolf", name: "Arctic Wolf MDR", vendor: "Arctic Wolf", description: "Managed Detection & Response med 24/7 SOC" },
      { id: "msp-heimdal", name: "Heimdal Threat Hunting", vendor: "Heimdal", description: "Proaktiv trusseljakt og hendelsesrespons" },
    ],
    implementationSteps: [
      "Koble loggkilder til SIEM/SOC-plattform",
      "Definer hendelseskategorier og eskaleringsrutiner",
      "Sett opp 24/7 varsling for kritiske hendelser",
      "Etabler incident response-plan",
      "Gjennomfør årlig tabletop-øvelse",
    ],
    acronisModules: [],
  },
  {
    id: "mdr",
    name: "MDR – Managed Detection & Response",
    nameEn: "MDR – Managed Detection & Response",
    description: "Døgnkontinuerlig overvåking, analyse og håndtering av sikkerhetstrusler — teknologi møter ansvar",
    color: "bg-rose-600",
    textColor: "text-rose-700 dark:text-rose-300",
    icon: ShieldAlert,
    linkedControls: ["A.5.24", "A.5.25", "A.5.26", "A.8.15", "A.8.16"],
    linkedAssessmentKeys: ["incident_handling"],
    mspRecommendation: "MDR gir proaktiv trusselhåndtering 24/7 — det handler ikke om å samle varsler, men om å handle når noe skjer. Raskt, strukturert og med fokus på din virksomhet.",
    mspProducts: [
      { id: "msp-7security-mdr", name: "7 Security MDR", vendor: "7 Security", description: "Managed Detection & Response med døgnkontinuerlig overvåking og håndtering" },
      { id: "msp-arctic-wolf", name: "Arctic Wolf MDR", vendor: "Arctic Wolf", description: "Managed Detection & Response med 24/7 SOC" },
    ],
    implementationSteps: [
      "Kartlegg kritiske systemer og datakilder for overvåking",
      "Koble loggkilder og endepunkter til MDR-plattformen",
      "Definer eskaleringsrutiner og kontaktpersoner",
      "Gjennomfør onboarding og baselining av normaltilstand",
      "Aktiver døgnkontinuerlig overvåking og responsavtale",
    ],
    acronisModules: [
      { id: "mdr-service", name: "MDR Service", acronisPackage: "Acronis Partner", priceIndicator: "addon", description: "Managed Detection & Response – 24/7 overvåking og hendelseshåndtering levert av MSP via Acronis", isActive: false },
      { id: "xdr", name: "XDR", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Extended Detection & Response – korrelerer trusler på tvers av endepunkter, e-post og sky", isActive: false },
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
      { id: "msp-mynder-compliance", name: "Mynder Compliance Platform", vendor: "Mynder", description: "Helhetlig compliance-plattform med AI-støtte" },
      { id: "msp-mynder-trust", name: "Mynder Trust Profile", vendor: "Mynder", description: "Automatisert tillitsprofil for kunder og leverandører" },
    ],
    implementationSteps: [
      "Gjennomfør innledende kartlegging via Mynder",
      "Aktiver relevante rammeverk (ISO 27001, GDPR, NIS2)",
      "Opprett behandlingsprotokoll og risikovurdering",
      "Signer databehandleravtaler med alle leverandører",
      "Sett opp årshjul for løpende compliance-arbeid",
    ],
    acronisModules: [
      { id: "dlp", name: "Data Loss Prevention", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Forhindrer uautorisert deling av sensitiv data via e-post, USB og skylagring", isActive: true },
      { id: "adv-file-sync", name: "Advanced File Sync & Share", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Sikker fildeling og synkronisering med kryptering og tilgangskontroll", isActive: false },
    ],
  },
];

export type ServiceCoverageStatus = "covered" | "missing" | "unknown";

export interface ServiceCoverageResult {
  service: SecurityServiceCategory;
  status: ServiceCoverageStatus;
  reason?: string;
}

const DEMO_IMPLEMENTED_SERVICES = ["backup", "compliance", "awareness", "mdr"];

export function evaluateServiceCoverage(
  assessmentResponses: Record<string, string> | null,
  useDemoData?: boolean,
  activatedModuleIds?: string[]
): ServiceCoverageResult[] {
  return SECURITY_SERVICE_CATALOG.map((service) => {
    // Check if any Acronis modules for this service are active (either demo default or user-activated)
    const hasActiveAcronis = service.acronisModules.some(
      (m) => m.isActive || activatedModuleIds?.includes(m.id)
    );

    if (hasActiveAcronis) {
      return { service, status: "covered" as const, reason: "Dekket via Acronis-tjeneste" };
    }

    if (useDemoData && DEMO_IMPLEMENTED_SERVICES.includes(service.id)) {
      return { service, status: "covered" as const, reason: "Implementert via MSP-partner" };
    }

    if (!assessmentResponses || service.linkedAssessmentKeys.length === 0) {
      if (useDemoData) {
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
