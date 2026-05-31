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
    "Framdrift Innovasjon AS er et bergensbasert rådgivningshus som hjelper SMB-er med strategi, bærekraft og digital transformasjon. Vi kombinerer forretningsforståelse med praktisk gjennomføring.",
  industry: "Rådgivning",
  employees: "1-10",
  region: "Vestland",
  country: "Norge",
  contacts: {
    primaryName: "Marte Solberg",
    primaryEmail: "marte@framdrift.no",
    dpoName: "Marte Solberg",
    dpoEmail: "personvern@framdrift.no",
    supportEmail: "hei@framdrift.no",
    securityEmail: "sikkerhet@framdrift.no",
  },
  privacy: {
    policyUrl: "https://framdrift.no/personvern",
    legalBasis: "Berettiget interesse og samtykke",
    dataMinimizationStatement:
      "Vi samler kun inn personopplysninger som er nødvendige for å levere våre rådgivningstjenester.",
  },
  security: {
    encryption: "TLS 1.3 i transit, AES-256 i hvile (Microsoft 365 / Azure)",
    mfa: "Påkrevd for alle ansatte og administratorer",
    incidentResponse: "Hendelser meldes innen 24t til kunder. Avvikslogg vedlikeholdes kvartalsvis.",
    certifications: ["GDPR-compliant", "Microsoft 365 Business Premium"],
  },
  dataStorage: {
    regions: ["EU/EØS (Norge, Irland)"],
    subProcessors: [
      "Microsoft 365 (e-post, dokumenter, Teams)",
      "Microsoft Azure (hosting, EU-region)",
      "HubSpot (CRM og markedsføring)",
      "Fiken (regnskap)",
      "Tripletex (timeføring)",
      "Slack (intern kommunikasjon)",
      "Zoom (videomøter med kunder)",
      "Google Workspace (analyse og samarbeid)",
      "Mailchimp (nyhetsbrev)",
      "Stripe (betaling)",
    ],
  },
  documents: [
    { title: "Personvernerklæring", url: "https://framdrift.no/personvern", type: "privacy_policy" },
    { title: "Databehandleravtale (mal)", type: "dpa" },
    { title: "Informasjonssikkerhetspolicy", type: "policy" },
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
  if (normalized.includes("framdrift")) return FRAMDRIFT;
  return GENERIC;
}

export const SCAN_STEPS_MS = 850; // delay per finding for progressive reveal
