export type NIS2Status = "pass" | "fail" | "partial" | "not_assessed";
export type NIS2AgentCapability = "ai_ready" | "activatable" | "assisted" | "manual";

export interface NIS2Requirement {
  id: string;
  label: string;
  articleRef: string;
  description: string;
  recommendation: string;
  documentTypes: string[];
  autoCheck: (metadata: Record<string, any>) => NIS2Status | null;
  agentCapability: NIS2AgentCapability;
  agentAction: string;
  activatableServiceId?: string;
  activatableServiceLabel?: string;
}

export interface NIS2AssessmentEntry {
  status: NIS2Status;
  notes: string;
  updatedAt: string;
  autoChecked: boolean;
}

export type NIS2AssessmentMap = Record<string, NIS2AssessmentEntry>;

const daysSince = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

export const nis2Requirements: NIS2Requirement[] = [
  {
    id: "risk_analysis",
    label: "Risikoanalyse",
    articleRef: "Art. 21(2)(a)",
    description:
      "Organisasjonen skal gjennomføre risikoanalyser for informasjonssystemer og vurdere trusler, sårbarheter og konsekvenser.",
    recommendation:
      "Gjennomfør en formell risikovurdering for denne enheten. Dokumenter identifiserte risikoer, sannsynlighet og konsekvens, og definer tiltak.",
    documentTypes: ["Risikovurdering", "Trusselvurdering", "ROS-analyse"],
    autoCheck: () => null,
    agentCapability: "assisted",
    agentAction: "Lara kan generere et risikorapport-utkast basert på virksomhetens metadata og registrerte systemer.",
  },
  {
    id: "incident_handling",
    label: "Hendelseshåndtering",
    articleRef: "Art. 21(2)(b)",
    description:
      "Det skal finnes prosedyrer for å oppdage, rapportere og håndtere sikkerhetshendelser innen fastsatte tidsfrister.",
    recommendation:
      "Etabler en hendelseshåndteringsprosedyre som dekker deteksjon, varsling (innen 24/72 timer), analyse og gjenoppretting.",
    documentTypes: ["Hendelseshåndteringsplan", "Varslingsprosedyre", "Responsplan"],
    autoCheck: () => null,
    agentCapability: "activatable",
    agentAction: "Aktiver SOC/MDR-tjeneste for døgnkontinuerlig overvåking og hendelseshåndtering.",
    activatableServiceId: "mdr-service",
    activatableServiceLabel: "MDR – Managed Detection & Response",
  },
  {
    id: "business_continuity",
    label: "Driftskontinuitet og backup",
    articleRef: "Art. 21(2)(c)",
    description:
      "Organisasjonen skal sikre driftskontinuitet gjennom backup-rutiner, katastrofegjenoppretting og krisehåndtering.",
    recommendation:
      "Sørg for at enheten har aktiv backup-løsning og at det finnes en dokumentert kontinuitetsplan.",
    documentTypes: ["Kontinuitetsplan", "Backup-prosedyre", "Katastrofegjenopprettingsplan"],
    autoCheck: (m) => {
      if (m.backup && m.backup !== "ingen") return "pass";
      if (m.backup === "ingen") return "fail";
      return null;
    },
    agentCapability: "ai_ready",
    agentAction: "Lara verifiserer automatisk backup-status og kan aktivere backup-tjeneste.",
    activatableServiceId: "adv-backup",
    activatableServiceLabel: "Advanced Backup",
  },
  {
    id: "supply_chain",
    label: "Forsyningskjedesikkerhet",
    articleRef: "Art. 21(2)(d)",
    description:
      "Sikkerhetskrav skal stilles til leverandører og tjenesteleverandører, inkludert vurdering av deres sikkerhetspraksis.",
    recommendation:
      "Dokumenter leverandørvurderinger for denne enhetens programvare og tjenesteleverandører. Vurder sikkerhetsrisiko i leverandørkjeden.",
    documentTypes: ["Leverandørvurdering", "SLA-avtale", "Sikkerhetskrav til leverandører"],
    autoCheck: () => null,
    agentCapability: "manual",
    agentAction: "Krever manuell leverandørvurdering. Lara kan gi veiledning og maler.",
  },
  {
    id: "procurement_security",
    label: "Sikkerhet ved anskaffelse og vedlikehold",
    articleRef: "Art. 21(2)(e)",
    description:
      "Sikkerhet skal ivaretas ved anskaffelse, utvikling og vedlikehold av nettverk og informasjonssystemer, inkludert håndtering av sårbarheter.",
    recommendation:
      "Sørg for at sikkerhetskrav er definert ved innkjøp av utstyr, og at sårbarhetshåndtering er en del av vedlikeholdsrutinen.",
    documentTypes: ["Anskaffelsespolicy", "Sårbarhetshåndteringsprosedyre"],
    autoCheck: () => null,
    agentCapability: "manual",
    agentAction: "Krever intern policy og prosedyrer. Lara kan foreslå maler for anskaffelsespolicy.",
  },
  {
    id: "vulnerability_management",
    label: "Sårbarhetshåndtering og patching",
    articleRef: "Art. 21(2)(f)",
    description:
      "Organisasjonen skal ha prosedyrer for å identifisere og håndtere sårbarheter, inkludert regelmessig oppdatering og patching.",
    recommendation:
      "Sørg for at enheten er oppdatert med siste sikkerhetsoppdateringer. Anbefalt: patching innen 30 dager.",
    documentTypes: ["Patchingstrategi", "Sårbarhetsskanningsrapport"],
    autoCheck: (m) => {
      const days = daysSince(m.last_patch_date);
      if (days === null) return "fail";
      if (days <= 30) return "pass";
      if (days <= 60) return "partial";
      return "fail";
    },
    agentCapability: "activatable",
    agentAction: "Aktiver Patch Management-modul for automatisert sårbarhetshåndtering.",
    activatableServiceId: "adv-management",
    activatableServiceLabel: "Advanced Management (Patch Management)",
  },
  {
    id: "cyber_hygiene",
    label: "Cyberhygiene og opplæring",
    articleRef: "Art. 21(2)(g)",
    description:
      "Ansatte skal få opplæring i grunnleggende cybersikkerhet, og det skal finnes retningslinjer for sikker bruk av IT-utstyr.",
    recommendation:
      "Gjennomfør sikkerhetsopplæring for brukere av denne enheten. Dokumenter gjennomførte kurs og bevissthetskampanjer.",
    documentTypes: ["Opplæringslogg", "Sikkerhetspolicy for ansatte", "Bevissthetsprogram"],
    autoCheck: () => null,
    agentCapability: "activatable",
    agentAction: "Aktiver Security Awareness Training for automatiserte phishing-simuleringer og kurs.",
    activatableServiceId: "security-awareness",
    activatableServiceLabel: "Security Awareness Training",
  },
  {
    id: "encryption",
    label: "Kryptografi og kryptering",
    articleRef: "Art. 21(2)(h)",
    description:
      "Organisasjonen skal ha retningslinjer for bruk av kryptografi og kryptering for å beskytte data i transit og lagring.",
    recommendation:
      "Aktiver diskkryptering (BitLocker, FileVault, LUKS) på enheten og sørg for at data i transit er kryptert.",
    documentTypes: ["Krypteringspolicy", "Konfigurasjonsbevis"],
    autoCheck: (m) => {
      if (m.encryption && m.encryption !== "ingen") return "pass";
      if (m.encryption === null || m.encryption === undefined) return "fail";
      return "fail";
    },
    agentCapability: "ai_ready",
    agentAction: "Lara verifiserer automatisk krypteringsstatus basert på enhetens metadata.",
  },
  {
    id: "access_control",
    label: "Tilgangskontroll og ressursforvaltning",
    articleRef: "Art. 21(2)(i)",
    description:
      "Det skal være implementert tilgangskontroll basert på minste privilegium-prinsippet, og alle eiendeler skal være registrert.",
    recommendation:
      "Sørg for at enheten er under MDM-administrasjon og at tilgang er begrenset etter rolle. Registrer enheten i eiendelsoversikten.",
    documentTypes: ["Tilgangskontrollpolicy", "MDM-konfigurasjon", "Eiendelsregister"],
    autoCheck: (m) => {
      if (m.mdm) return "pass";
      return "fail";
    },
    agentCapability: "activatable",
    agentAction: "Aktiver MDM-modul for sentralisert enhetsstyring og tilgangskontroll.",
    activatableServiceId: "adv-management",
    activatableServiceLabel: "Advanced Management (MDM)",
  },
  {
    id: "mfa",
    label: "Flerfaktor-autentisering (MFA)",
    articleRef: "Art. 21(2)(j)",
    description:
      "Organisasjonen skal bruke flerfaktor-autentisering eller kontinuerlig autentiseringsløsninger der det er hensiktsmessig.",
    recommendation:
      "Aktiver MFA for alle brukerkontoer som har tilgang til denne enheten. Bruk godkjente autentiseringsmetoder.",
    documentTypes: ["MFA-policy", "Autentiseringskonfigurasjon"],
    autoCheck: (m) => {
      if (m.nis2_mfa_enabled === true || m.mfa_enabled === true) return "pass";
      if (m.nis2_mfa_enabled === false || m.mfa_enabled === false) return "fail";
      return null;
    },
    agentCapability: "assisted",
    agentAction: "Lara verifiserer MFA-status automatisk, men aktivering må gjøres manuelt i AD/IdP.",
  },
];

export function computeNIS2Summary(
  requirements: NIS2Requirement[],
  assessment: NIS2AssessmentMap,
  metadata: Record<string, any>
) {
  let pass = 0;
  let partial = 0;
  let fail = 0;
  let notAssessed = 0;
  let autoCheckedCount = 0;

  for (const req of requirements) {
    const entry = assessment[req.id];
    const autoResult = req.autoCheck(metadata);

    if (autoResult !== null) autoCheckedCount++;

    const status = entry?.status ?? autoResult ?? "not_assessed";

    if (status === "pass") pass++;
    else if (status === "partial") partial++;
    else if (status === "fail") fail++;
    else notAssessed++;
  }

  const total = requirements.length;
  const percent = Math.round(((pass + partial * 0.5) / total) * 100);

  return { pass, partial, fail, notAssessed, total, percent, autoCheckedCount };
}

export function computeNIS2AgentBreakdown(requirements: NIS2Requirement[]) {
  let aiReady = 0;
  let activatable = 0;
  let assisted = 0;
  let manual = 0;

  for (const req of requirements) {
    switch (req.agentCapability) {
      case "ai_ready": aiReady++; break;
      case "activatable": activatable++; break;
      case "assisted": assisted++; break;
      case "manual": manual++; break;
    }
  }

  return { aiReady, activatable, assisted, manual };
}
