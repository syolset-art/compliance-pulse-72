// Mock "Lara web scan" results used by the Activate Trust Profile wizard.
// In production this would be replaced by an edge function (Firecrawl + LLM)
// that scrapes the vendor homepage. The shape is what the wizard consumes.

export interface LaraScanFinding {
  key: string;
  label: string;
  detail?: string;
  source?: string; // hvor på hjemmesiden vi fant det
  status?: "found" | "missing" | "info"; // styrer ikon/farge i UI
}

export interface LaraScanResult {
  description: string;
  industry?: string;
  employees?: string;
  region?: string;
  country?: string;
  contacts: {
    primaryName?: string;
    primaryEmail?: string;
    dpoName?: string;
    dpoEmail?: string;
    cisoName?: string;
    cisoEmail?: string;
    supportEmail?: string;
    securityEmail?: string;
  };
  privacy: {
    policyUrl?: string;
    legalBasis?: string;
    dataMinimizationStatement?: string;
  };
  security: {
    encryption?: string;
    mfa?: string;
    incidentResponse?: string;
    certifications: string[];
  };
  dataStorage: {
    regions: string[];
    subProcessors: string[];
  };
  documents: { title: string; url?: string; type: string }[];
  findings: LaraScanFinding[]; // for progressive reveal i UI
}

const FRAMDRIFT: LaraScanResult = {
  description:
    "DIPS Arena AS leverer digitale helseløsninger til sykehus, kommuner og spesialister i Norge. Vi behandler pasientopplysninger og særlige kategorier av personopplysninger på vegne av helsevirksomheter.",
  industry: "Helse og omsorg",
  employees: "11-50",
  region: "Vestland",
  country: "Norge",
  contacts: {
    primaryName: "Kari Lien",
    primaryEmail: "kari.lien@dipsarena.no",
    dpoName: "Henrik Dahl",
    dpoEmail: "personvern@dipsarena.no",
    supportEmail: "hei@dipsarena.no",
    securityEmail: "sikkerhet@dipsarena.no",
  },
  privacy: {
    policyUrl: "https://dipsarena.no/personvern",
    legalBasis: "Rettslig forpliktelse (pasientjournalloven) og databehandleravtale med helsevirksomheter",
    dataMinimizationStatement:
      "Vi behandler kun helseopplysninger som er nødvendige for å levere våre tjenester til helsevirksomheter, i tråd med Normen for informasjonssikkerhet i helse- og omsorgstjenesten.",
  },
  security: {
    encryption: "TLS 1.3 i transit, AES-256 i hvile (Azure Norway East)",
    mfa: "Påkrevd for alle ansatte, administratorer og driftspartnere",
    incidentResponse: "Hendelser meldes innen 24t til berørte helsevirksomheter og Datatilsynet ved behov. Avvikslogg vedlikeholdes månedlig.",
    certifications: ["GDPR-compliant", "Normen (Helse- og omsorgssektoren)", "ISO 27001 (under sertifisering)"],
  },
  dataStorage: {
    regions: ["EU/EØS (Norge — Azure Norway East)"],
    subProcessors: [
      "Microsoft Azure (hosting, Norway East)",
      "Norsk Helsenett (driftspartner og sikker tilkobling)",
      "Microsoft 365 (e-post, dokumenter, Teams)",
      "Visma (HR og lønn)",
      "Tripletex (regnskap og timeføring)",
      "Slack (intern kommunikasjon — ingen pasientdata)",
      "Zoom for Healthcare (videomøter)",
    ],
  },
  documents: [
    { title: "Personvernerklæring", url: "https://dipsarena.no/personvern", type: "privacy_policy" },
    { title: "Databehandleravtale (mal)", type: "dpa" },
    { title: "Informasjonssikkerhetspolicy (Normen)", type: "policy" },
  ],
  findings: [
    { key: "web", label: "Sjekker hjemmesiden …", detail: "Laster og analyserer innhold", status: "found" },
    { key: "brreg", label: "Slår opp i Brønnøysundregistrene …", detail: "Henter organisasjonsnummer, ansatte og næringskode", status: "found" },
    { key: "desc", label: "Ser etter virksomhetsbeskrivelse …", detail: "«Om oss» og tjenestesider", source: "/om-oss", status: "found" },
    { key: "contact", label: "Leter etter kontaktopplysninger …", detail: "E-post og ansvarlige personer", status: "found" },
    { key: "privacy", label: "Ser etter personvernerklæring …", detail: "Footer og dedikerte sider", source: "/personvern", status: "found" },
    { key: "security", label: "Analyserer sikkerhetstiltak …", detail: "MFA, kryptering, leverandører", status: "found" },
    { key: "subproc", label: "Sjekker etter underleverandører …", detail: "Tjenestebeskrivelser og personvernerklæring", status: "found" },
    { key: "secpolicy", label: "Ser etter policy-dokumenter …", detail: "Trust Center og nedlastbare filer", status: "found" },
    { key: "dpa", label: "Leter etter databehandleravtale …", detail: "Lenker og nedlastbare maler", status: "found" },
    { key: "certs", label: "Sjekker etter sertifiseringer …", detail: "ISO 27001, SOC 2, lignende", status: "missing" },
    { key: "incident", label: "Ser etter hendelseshåndtering …", detail: "Offentlig dokumentasjon", status: "missing" },
  ],
};

const GENERIC: LaraScanResult = {
  description:
    "Vi leverer profesjonelle tjenester til norske og nordiske virksomheter, med fokus på kvalitet, sikkerhet og etterlevelse.",
  contacts: {
    primaryEmail: "post@example.no",
    supportEmail: "support@example.no",
  },
  privacy: {
    policyUrl: "https://example.no/personvern",
    legalBasis: "Avtale og berettiget interesse",
  },
  security: {
    encryption: "TLS i transit, kryptering i hvile",
    mfa: "Påkrevd for administratorer",
    certifications: ["GDPR-compliant"],
  },
  dataStorage: {
    regions: ["EU/EØS"],
    subProcessors: ["Microsoft 365", "Microsoft Azure", "Google Workspace", "HubSpot", "Slack", "Zoom"],
  },
  documents: [
    { title: "Personvernerklæring", url: "https://example.no/personvern", type: "privacy_policy" },
  ],
  findings: [
    { key: "web", label: "Sjekker hjemmesiden …", detail: "Laster og analyserer innhold", status: "found" },
    { key: "brreg", label: "Slår opp i Brønnøysundregistrene …", detail: "Henter organisasjonsnummer, ansatte og næringskode", status: "found" },
    { key: "desc", label: "Ser etter virksomhetsbeskrivelse …", detail: "«Om oss» og tjenestesider", status: "found" },
    { key: "contact", label: "Leter etter kontaktopplysninger …", detail: "E-post og ansvarlige personer", status: "found" },
    { key: "privacy", label: "Ser etter personvernerklæring …", detail: "Footer og dedikerte sider", status: "found" },
    { key: "security", label: "Analyserer sikkerhetstiltak …", detail: "MFA, kryptering, leverandører", status: "found" },
    { key: "subproc", label: "Sjekker etter underleverandører …", detail: "Tjenestebeskrivelser og personvernerklæring", status: "found" },
    { key: "dpa", label: "Leter etter databehandleravtale …", detail: "Lenker og nedlastbare maler", status: "missing" },
    { key: "certs", label: "Sjekker etter sertifiseringer …", detail: "ISO 27001, SOC 2, lignende", status: "missing" },
    { key: "secpolicy", label: "Ser etter policy-dokumenter …", detail: "Trust Center og nedlastbare filer", status: "missing" },
  ],
};

export function getLaraScanForDomain(domain: string): LaraScanResult {
  const normalized = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (normalized.includes("dips") || normalized.includes("framdrift")) return FRAMDRIFT;
  return GENERIC;
}

export const SCAN_STEPS_MS = 850; // delay per finding for progressive reveal
