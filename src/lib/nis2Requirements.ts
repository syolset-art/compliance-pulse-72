export type NIS2Status = "pass" | "fail" | "partial" | "not_assessed";

export interface NIS2Requirement {
  id: string;
  label: string;
  articleRef: string;
  description: string;
  recommendation: string;
  documentTypes: string[];
  autoCheck: (metadata: Record<string, any>) => NIS2Status | null;
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
    autoCheck: () => null, // Krever manuell vurdering
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
