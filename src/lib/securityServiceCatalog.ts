import { Shield, HardDrive, Mail, Globe, Users, Eye, FileCheck, ShieldAlert, BrainCircuit, LucideIcon } from "lucide-react";

export interface AcronisModule {
  id: string;
  name: string;
  acronisPackage: string;
  priceIndicator: "included" | "addon";
  description: string;
  descriptionEn: string;
  isActive: boolean;
}

export interface MSPProduct {
  id: string;
  name: string;
  vendor: string;
  description: string;
  descriptionEn: string;
}

export interface MSPPartnerInfo {
  id: string;
  name: string;
  description: string;
  descriptionEn: string;
  contactEmail?: string;
  website?: string;
  specialties: string[];
}

export const MSP_PARTNER_DIRECTORY: MSPPartnerInfo[] = [
  {
    id: "7security",
    name: "7 Security",
    description: "Autorisert MSP-partner for Managed Detection & Response. Leverer døgnkontinuerlig overvåking, analyse og håndtering av sikkerhetstrusler.",
    descriptionEn: "Authorized MSP partner for Managed Detection & Response. Provides 24/7 monitoring, analysis, and threat management.",
    contactEmail: "mdr@7security.no",
    website: "https://7security.no",
    specialties: ["mdr", "soc", "endpoint"],
  },
  {
    id: "atea-security",
    name: "Atea Security",
    description: "Nordens ledende IT-infrastrukturpartner med dedikert sikkerhetsteam. Tilbyr helhetlige sikkerhetsløsninger fra endepunkt til sky.",
    descriptionEn: "The Nordics' leading IT infrastructure partner with a dedicated security team. Offers comprehensive security solutions from endpoint to cloud.",
    contactEmail: "security@atea.no",
    website: "https://atea.no",
    specialties: ["endpoint", "network", "backup", "email"],
  },
  {
    id: "crayon-cyber",
    name: "Crayon Cyber",
    description: "Spesialisert på skysikkerhet og compliance-rådgivning. Hjelper virksomheter med å sikre sin digitale transformasjon.",
    descriptionEn: "Specialized in cloud security and compliance consulting. Helps organizations secure their digital transformation.",
    contactEmail: "cyber@crayon.com",
    website: "https://crayon.com",
    specialties: ["network", "compliance", "awareness"],
  },
  {
    id: "hult-it",
    name: "Hult IT AS",
    description: "Norsk IT-partner med fokus på drift, sikkerhet og compliance for små og mellomstore bedrifter. Tilbyr helhetlige managed services.",
    descriptionEn: "Norwegian IT partner focused on operations, security, and compliance for SMBs. Offers comprehensive managed services.",
    contactEmail: "post@hultit.no",
    website: "https://hultit.no",
    specialties: ["endpoint", "backup", "network", "compliance"],
  },
];

export interface SecurityServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  color: string;
  textColor: string;
  icon: LucideIcon;
  linkedControls: string[];
  linkedAssessmentKeys: string[];
  mspRecommendation: string;
  mspRecommendationEn: string;
  mspProducts: MSPProduct[];
  implementationSteps: string[];
  implementationStepsEn: string[];
  acronisModules: AcronisModule[];
}

export const SECURITY_SERVICE_CATALOG: SecurityServiceCategory[] = [
  {
    id: "backup",
    name: "Backup & Restore",
    nameEn: "Backup & Restore",
    description: "Sikkerhetskopiering og gjenoppretting av data og systemer",
    descriptionEn: "Backup and recovery of data and systems",
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: HardDrive,
    linkedControls: ["A.8.13", "A.12.3"],
    linkedAssessmentKeys: ["backup_testing_documented"],
    mspRecommendation: "Implementer automatisert backup med jevnlig testing av gjenoppretting. MSP bør tilby overvåket backup med varsling ved feil.",
    mspRecommendationEn: "Implement automated backup with regular recovery testing. MSP should offer monitored backup with failure alerts.",
    mspProducts: [
      { id: "msp-acronis-backup", name: "Acronis Cyber Protect Cloud", vendor: "Acronis", description: "Backup, disaster recovery og cybersikkerhet i én løsning", descriptionEn: "Backup, disaster recovery, and cybersecurity in one solution" },
      { id: "msp-veeam-backup", name: "Veeam Backup & Replication", vendor: "Veeam", description: "Enterprise-grade backup for sky og on-premise", descriptionEn: "Enterprise-grade backup for cloud and on-premise" },
    ],
    implementationSteps: [
      "Kartlegg kritiske data og systemer",
      "Sett opp daglig automatisert backup",
      "Konfigurer offsite/sky-kopi (3-2-1 regelen)",
      "Planlegg kvartalsvis gjenopprettingstest",
      "Dokumenter backup-policy i henhold til ISO 27001",
    ],
    implementationStepsEn: [
      "Map critical data and systems",
      "Set up daily automated backup",
      "Configure offsite/cloud copy (3-2-1 rule)",
      "Schedule quarterly recovery testing",
      "Document backup policy per ISO 27001",
    ],
    acronisModules: [
      { id: "adv-backup", name: "Advanced Backup", acronisPackage: "Cyber Protect Cloud", priceIndicator: "included", description: "Automatisert backup med cloud-lagring, inkrementell backup og rask gjenoppretting", descriptionEn: "Automated backup with cloud storage, incremental backup, and fast recovery", isActive: true },
      { id: "disaster-recovery", name: "Disaster Recovery", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Failover til sky-infrastruktur med minimal nedetid ved katastrofer", descriptionEn: "Failover to cloud infrastructure with minimal downtime during disasters", isActive: false },
    ],
  },
  {
    id: "endpoint",
    name: "Endepunktsikkerhet",
    nameEn: "Endpoint Security",
    description: "Beskyttelse av PCer, mobiler og andre enheter",
    descriptionEn: "Protection of PCs, mobile devices, and other endpoints",
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: Shield,
    linkedControls: ["A.8.1", "A.8.7"],
    linkedAssessmentKeys: [],
    mspRecommendation: "Alle endepunkter bør ha EDR (Endpoint Detection & Response) med sentralisert administrasjon. MSP overvåker og responderer på trusler.",
    mspRecommendationEn: "All endpoints should have EDR (Endpoint Detection & Response) with centralized management. MSP monitors and responds to threats.",
    mspProducts: [
      { id: "msp-sentinelone", name: "SentinelOne Singularity", vendor: "SentinelOne", description: "AI-drevet EDR med automatisert respons", descriptionEn: "AI-powered EDR with automated response" },
      { id: "msp-defender-endpoint", name: "Microsoft Defender for Endpoint", vendor: "Microsoft", description: "Integrert sikkerhet for Windows-miljøer", descriptionEn: "Integrated security for Windows environments" },
    ],
    implementationSteps: [
      "Installer EDR-agent på alle enheter",
      "Konfigurer sentralisert dashboard for overvåking",
      "Sett opp automatisk respons-policy",
      "Aktiver disk-kryptering (BitLocker/FileVault)",
      "Implementer patch management-rutiner",
    ],
    implementationStepsEn: [
      "Install EDR agent on all devices",
      "Configure centralized monitoring dashboard",
      "Set up automatic response policy",
      "Enable disk encryption (BitLocker/FileVault)",
      "Implement patch management routines",
    ],
    acronisModules: [
      { id: "adv-security-edr", name: "Advanced Security + EDR", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Endepunktbeskyttelse med AI-drevet deteksjon, automatisk respons og trusselanalyse", descriptionEn: "Endpoint protection with AI-driven detection, automatic response, and threat analysis", isActive: false },
      { id: "adv-management", name: "Advanced Management", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Sentralisert patching, software-inventar og remote management av alle enheter", descriptionEn: "Centralized patching, software inventory, and remote management of all devices", isActive: false },
    ],
  },
  {
    id: "email",
    name: "E-postsikkerhet",
    nameEn: "Email Security",
    description: "Beskyttelse mot phishing, spam og e-postbaserte angrep",
    descriptionEn: "Protection against phishing, spam, and email-based attacks",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    icon: Mail,
    linkedControls: ["A.8.21", "A.8.23"],
    linkedAssessmentKeys: [],
    mspRecommendation: "E-post er den vanligste angrepsvektoren. Implementer avansert e-postfiltrering med anti-phishing og sandboxing.",
    mspRecommendationEn: "Email is the most common attack vector. Implement advanced email filtering with anti-phishing and sandboxing.",
    mspProducts: [
      { id: "msp-proofpoint", name: "Proofpoint Email Protection", vendor: "Proofpoint", description: "Avansert beskyttelse mot phishing og BEC", descriptionEn: "Advanced protection against phishing and BEC" },
      { id: "msp-defender-o365", name: "Microsoft Defender for Office 365", vendor: "Microsoft", description: "E-postsikkerhet integrert i M365", descriptionEn: "Email security integrated with M365" },
    ],
    implementationSteps: [
      "Aktiver SPF, DKIM og DMARC for domenet",
      "Implementer avansert e-postfiltrering",
      "Sett opp anti-phishing policy",
      "Konfigurer varsling ved mistenkelige vedlegg",
      "Gjennomfør phishing-simulering kvartalsvis",
    ],
    implementationStepsEn: [
      "Enable SPF, DKIM, and DMARC for the domain",
      "Implement advanced email filtering",
      "Set up anti-phishing policy",
      "Configure alerts for suspicious attachments",
      "Conduct quarterly phishing simulations",
    ],
    acronisModules: [
      { id: "adv-email-security", name: "Advanced Email Security", acronisPackage: "Perception Point", priceIndicator: "addon", description: "E-postbeskyttelse med anti-phishing, anti-malware og BEC-deteksjon via Perception Point", descriptionEn: "Email protection with anti-phishing, anti-malware, and BEC detection via Perception Point", isActive: false },
    ],
  },
  {
    id: "network",
    name: "Nettverk & Sky",
    nameEn: "Network & Cloud Security",
    description: "Sikring av nettverk, brannmurer og skyinfrastruktur",
    descriptionEn: "Securing networks, firewalls, and cloud infrastructure",
    color: "bg-violet-500",
    textColor: "text-violet-700 dark:text-violet-300",
    icon: Globe,
    linkedControls: ["A.8.20", "A.8.22", "A.8.26"],
    linkedAssessmentKeys: [],
    mspRecommendation: "Sikre nettverket med next-gen brannmur, segmentering og VPN. Skyressurser bør ha Zero Trust-tilgang.",
    mspRecommendationEn: "Secure the network with next-gen firewall, segmentation, and VPN. Cloud resources should use Zero Trust access.",
    mspProducts: [
      { id: "msp-fortigate", name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen brannmur med SD-WAN", descriptionEn: "Next-gen firewall with SD-WAN" },
      { id: "msp-cloudflare-zt", name: "Cloudflare Zero Trust", vendor: "Cloudflare", description: "Zero Trust nettverkstilgang uten VPN", descriptionEn: "Zero Trust network access without VPN" },
    ],
    implementationSteps: [
      "Kartlegg nettverksarkitektur og segmenter",
      "Implementer next-gen brannmur med IPS/IDS",
      "Sett opp VPN eller Zero Trust for fjerntilgang",
      "Aktiver nettverksovervåking og logging",
      "Gjennomfør årlig penetrasjonstest",
    ],
    implementationStepsEn: [
      "Map network architecture and segments",
      "Implement next-gen firewall with IPS/IDS",
      "Set up VPN or Zero Trust for remote access",
      "Enable network monitoring and logging",
      "Conduct annual penetration test",
    ],
    acronisModules: [
      { id: "adv-monitoring", name: "Advanced Monitoring", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Overvåking av nettverksenheter, servere og tjenester med varsling og dashboards", descriptionEn: "Monitoring of network devices, servers, and services with alerts and dashboards", isActive: false },
    ],
  },
  {
    id: "awareness",
    name: "Sikkerhetskultur",
    nameEn: "Security Awareness",
    description: "Opplæring, bevisstgjøring og phishing-simulering",
    descriptionEn: "Training, awareness, and phishing simulations",
    color: "bg-orange-500",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: Users,
    linkedControls: ["A.6.3", "A.7.2.2"],
    linkedAssessmentKeys: ["security_training"],
    mspRecommendation: "Menneskelige feil er den største risikoen. Regelmessig opplæring og simulert phishing reduserer risikoen dramatisk.",
    mspRecommendationEn: "Human error is the biggest risk. Regular training and simulated phishing dramatically reduces the risk.",
    mspProducts: [
      { id: "msp-knowbe4", name: "KnowBe4 Security Awareness", vendor: "KnowBe4", description: "Verdens største plattform for sikkerhetsopplæring", descriptionEn: "The world's largest security awareness training platform" },
      { id: "msp-mynder-mikrokurs", name: "Mynder Me – Micro Courses", vendor: "Mynder", description: "Korte, målrettede sikkerhetskurs for ansatte", descriptionEn: "Short, targeted security courses for employees" },
    ],
    implementationSteps: [
      "Gjennomfør baseline phishing-test",
      "Registrer alle ansatte i opplæringsplattform",
      "Start med obligatorisk grunnkurs i informasjonssikkerhet",
      "Planlegg månedlige phishing-simuleringer",
      "Mål fremgang og rapporter til ledelsen",
    ],
    implementationStepsEn: [
      "Conduct baseline phishing test",
      "Register all employees on the training platform",
      "Start with mandatory basic information security course",
      "Schedule monthly phishing simulations",
      "Measure progress and report to management",
    ],
    acronisModules: [
      { id: "security-awareness", name: "Security Awareness Training", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Automatiserte phishing-simuleringer og sikkerhetskurs for alle ansatte", descriptionEn: "Automated phishing simulations and security courses for all employees", isActive: true },
    ],
  },
  {
    id: "soc",
    name: "SOC-tjeneste",
    nameEn: "SOC Service",
    description: "Overvåking, deteksjon og respons på sikkerhetshendelser",
    descriptionEn: "Monitoring, detection, and response to security incidents",
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-300",
    icon: Eye,
    linkedControls: ["A.8.15", "A.8.16", "A.16.1"],
    linkedAssessmentKeys: ["incident_handling"],
    mspRecommendation: "24/7 overvåking via SOC sikrer rask deteksjon og respons. MSP tilbyr dette som en managed service.",
    mspRecommendationEn: "24/7 monitoring via SOC ensures rapid detection and response. MSP offers this as a managed service.",
    mspProducts: [
      { id: "msp-arctic-wolf", name: "Arctic Wolf MDR", vendor: "Arctic Wolf", description: "Managed Detection & Response med 24/7 SOC", descriptionEn: "Managed Detection & Response with 24/7 SOC" },
      { id: "msp-heimdal", name: "Heimdal Threat Hunting", vendor: "Heimdal", description: "Proaktiv trusseljakt og hendelsesrespons", descriptionEn: "Proactive threat hunting and incident response" },
    ],
    implementationSteps: [
      "Koble loggkilder til SIEM/SOC-plattform",
      "Definer hendelseskategorier og eskaleringsrutiner",
      "Sett opp 24/7 varsling for kritiske hendelser",
      "Etabler incident response-plan",
      "Gjennomfør årlig tabletop-øvelse",
    ],
    implementationStepsEn: [
      "Connect log sources to SIEM/SOC platform",
      "Define incident categories and escalation procedures",
      "Set up 24/7 alerting for critical incidents",
      "Establish incident response plan",
      "Conduct annual tabletop exercise",
    ],
    acronisModules: [],
  },
  {
    id: "mdr",
    name: "MDR – Managed Detection & Response",
    nameEn: "MDR – Managed Detection & Response",
    description: "Døgnkontinuerlig overvåking, analyse og håndtering av sikkerhetstrusler — teknologi møter ansvar",
    descriptionEn: "24/7 monitoring, analysis, and management of security threats — where technology meets accountability",
    color: "bg-rose-600",
    textColor: "text-rose-700 dark:text-rose-300",
    icon: ShieldAlert,
    linkedControls: ["A.5.24", "A.5.25", "A.5.26", "A.8.15", "A.8.16"],
    linkedAssessmentKeys: ["incident_handling"],
    mspRecommendation: "MDR gir proaktiv trusselhåndtering 24/7 — det handler ikke om å samle varsler, men om å handle når noe skjer. Raskt, strukturert og med fokus på din virksomhet.",
    mspRecommendationEn: "MDR provides proactive threat management 24/7 — it's not about collecting alerts, but about acting when something happens. Fast, structured, and focused on your business.",
    mspProducts: [
      { id: "msp-7security-mdr", name: "7 Security MDR", vendor: "7 Security", description: "Managed Detection & Response med døgnkontinuerlig overvåking og håndtering", descriptionEn: "Managed Detection & Response with 24/7 monitoring and management" },
      { id: "msp-arctic-wolf", name: "Arctic Wolf MDR", vendor: "Arctic Wolf", description: "Managed Detection & Response med 24/7 SOC", descriptionEn: "Managed Detection & Response with 24/7 SOC" },
    ],
    implementationSteps: [
      "Kartlegg kritiske systemer og datakilder for overvåking",
      "Koble loggkilder og endepunkter til MDR-plattformen",
      "Definer eskaleringsrutiner og kontaktpersoner",
      "Gjennomfør onboarding og baselining av normaltilstand",
      "Aktiver døgnkontinuerlig overvåking og responsavtale",
    ],
    implementationStepsEn: [
      "Map critical systems and data sources for monitoring",
      "Connect log sources and endpoints to the MDR platform",
      "Define escalation procedures and contact persons",
      "Complete onboarding and baselining of normal state",
      "Activate 24/7 monitoring and response agreement",
    ],
    acronisModules: [
      { id: "mdr-service", name: "MDR Service", acronisPackage: "Acronis Partner", priceIndicator: "addon", description: "Managed Detection & Response – 24/7 overvåking og hendelseshåndtering levert av MSP via Acronis", descriptionEn: "Managed Detection & Response – 24/7 monitoring and incident management delivered by MSP via Acronis", isActive: false },
      { id: "xdr", name: "XDR", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Extended Detection & Response – korrelerer trusler på tvers av endepunkter, e-post og sky", descriptionEn: "Extended Detection & Response – correlates threats across endpoints, email, and cloud", isActive: false },
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    nameEn: "Compliance",
    description: "Etterlevelse av regelverk, policyer og internkontroll",
    descriptionEn: "Regulatory compliance, policies, and internal controls",
    color: "bg-teal-500",
    textColor: "text-teal-700 dark:text-teal-300",
    icon: FileCheck,
    linkedControls: ["A.5.1", "A.5.2", "A.5.31"],
    linkedAssessmentKeys: ["risk_assessment_approved", "processing_records", "dpa_with_vendors"],
    mspRecommendation: "Compliance er fundamentet for alle sikkerhetstjenester. Mynder-plattformen automatiserer compliance-arbeidet.",
    mspRecommendationEn: "Compliance is the foundation for all security services. The Mynder platform automates compliance work.",
    mspProducts: [
      { id: "msp-mynder-compliance", name: "Mynder Compliance Platform", vendor: "Mynder", description: "Helhetlig compliance-plattform med AI-støtte", descriptionEn: "Comprehensive compliance platform with AI support" },
      { id: "msp-mynder-trust", name: "Mynder Trust Profile", vendor: "Mynder", description: "Automatisert tillitsprofil for kunder og leverandører", descriptionEn: "Automated trust profile for customers and vendors" },
    ],
    implementationSteps: [
      "Gjennomfør innledende kartlegging via Mynder",
      "Aktiver relevante rammeverk (ISO 27001, GDPR, NIS2)",
      "Opprett behandlingsprotokoll og risikovurdering",
      "Signer databehandleravtaler med alle leverandører",
      "Sett opp årshjul for løpende compliance-arbeid",
    ],
    implementationStepsEn: [
      "Complete initial assessment via Mynder",
      "Activate relevant frameworks (ISO 27001, GDPR, NIS2)",
      "Create processing records and risk assessment",
      "Sign data processing agreements with all vendors",
      "Set up annual calendar for ongoing compliance work",
    ],
    acronisModules: [
      { id: "dlp", name: "Data Loss Prevention", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Forhindrer uautorisert deling av sensitiv data via e-post, USB og skylagring", descriptionEn: "Prevents unauthorized sharing of sensitive data via email, USB, and cloud storage", isActive: true },
      { id: "adv-file-sync", name: "Advanced File Sync & Share", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Sikker fildeling og synkronisering med kryptering og tilgangskontroll", descriptionEn: "Secure file sharing and sync with encryption and access control", isActive: false },
    ],
  },
  {
    id: "llm-security",
    name: "AI / LLM-sikkerhet",
    nameEn: "AI / LLM Security",
    description: "Kontroll og beskyttelse mot deling av sensitiv informasjon via språkmodeller (ChatGPT, Copilot, Gemini m.fl.)",
    descriptionEn: "Control and protection against sharing sensitive information via language models (ChatGPT, Copilot, Gemini, etc.)",
    color: "bg-fuchsia-500",
    textColor: "text-fuchsia-700 dark:text-fuchsia-300",
    icon: BrainCircuit,
    linkedControls: ["A.8.11", "A.8.12", "A.5.34"],
    linkedAssessmentKeys: [],
    mspRecommendation: "Språkmodeller brukes i økende grad på arbeidsstasjoner og mobiler. Uten DLP-kontroll risikerer virksomheten at sensitiv informasjon deles med tredjeparter. Implementer DLP for AI som blokkerer, advarer eller logger sensitiv data sendt til LLM-tjenester.",
    mspRecommendationEn: "Language models are increasingly used on workstations and mobile devices. Without DLP controls, organizations risk sharing sensitive information with third parties. Implement DLP for AI that blocks, warns, or logs sensitive data sent to LLM services.",
    mspProducts: [
      { id: "msp-acronis-dlp-ai", name: "Acronis Advanced DLP for AI", vendor: "Acronis", description: "Forhindrer sensitiv data fra å sendes til LLM-tjenester som ChatGPT, Copilot og Gemini", descriptionEn: "Prevents sensitive data from being sent to LLM services like ChatGPT, Copilot, and Gemini" },
      { id: "msp-nightfall-ai", name: "Nightfall AI DLP", vendor: "Nightfall", description: "Cloud-native DLP som overvåker og blokkerer sensitiv data i AI-verktøy", descriptionEn: "Cloud-native DLP that monitors and blocks sensitive data in AI tools" },
    ],
    implementationSteps: [
      "Kartlegg hvilke LLM-tjenester som brukes på tvers av enheter",
      "Klassifiser sensitive datatyper (personnummer, helseopplysninger, forretningshemmeligheter)",
      "Konfigurer DLP-policy: blokkér, advar eller logg ved deling av sensitiv data",
      "Rull ut DLP-agent på alle endepunkter med LLM-tilgang",
      "Overvåk og rapporter brudd kvartalsvis til ledelsen",
    ],
    implementationStepsEn: [
      "Map which LLM services are used across devices",
      "Classify sensitive data types (SSN, health data, trade secrets)",
      "Configure DLP policy: block, warn, or log when sharing sensitive data",
      "Deploy DLP agent on all endpoints with LLM access",
      "Monitor and report violations quarterly to management",
    ],
    acronisModules: [
      { id: "adv-dlp-ai", name: "Advanced DLP for AI", acronisPackage: "Cyber Protect Cloud", priceIndicator: "addon", description: "Data Loss Prevention spesielt rettet mot AI/LLM-tjenester — blokkerer, advarer eller logger forsøk på å dele sensitiv informasjon med språkmodeller", descriptionEn: "Data Loss Prevention specifically targeting AI/LLM services — blocks, warns, or logs attempts to share sensitive information with language models", isActive: false },
    ],
  },
];

export type ServiceCoverageStatus = "covered" | "missing" | "unknown";

export interface ServiceCoverageResult {
  service: SecurityServiceCategory;
  status: ServiceCoverageStatus;
  reason?: string;
  reasonEn?: string;
}

const DEMO_IMPLEMENTED_SERVICES = ["backup", "compliance", "awareness", "mdr"];

export function evaluateServiceCoverage(
  assessmentResponses: Record<string, string> | null,
  useDemoData?: boolean,
  activatedModuleIds?: string[]
): ServiceCoverageResult[] {
  return SECURITY_SERVICE_CATALOG.map((service) => {
    const hasActiveAcronis = service.acronisModules.some(
      (m) => m.isActive || activatedModuleIds?.includes(m.id)
    );

    if (hasActiveAcronis) {
      return { service, status: "covered" as const, reason: "Dekket via Acronis-tjeneste", reasonEn: "Covered via Acronis service" };
    }

    if (useDemoData && DEMO_IMPLEMENTED_SERVICES.includes(service.id)) {
      return { service, status: "covered" as const, reason: "Implementert via MSP-partner", reasonEn: "Implemented via MSP partner" };
    }

    if (!assessmentResponses || service.linkedAssessmentKeys.length === 0) {
      if (useDemoData) {
        return { service, status: "unknown" as const, reason: "Ikke kartlagt ennå", reasonEn: "Not yet assessed" };
      }
      return { service, status: "unknown" as const, reason: "Ingen kartlegging tilgjengelig", reasonEn: "No assessment available" };
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
      return { service, status: "missing" as const, reason: "Mangler tiltak basert på kartlegging", reasonEn: "Missing measures based on assessment" };
    }
    return { service, status: "unknown" as const, reason: "Ikke fullstendig kartlagt", reasonEn: "Not fully assessed" };
  });
}
