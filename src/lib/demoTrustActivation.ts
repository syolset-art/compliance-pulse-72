// Mock "Lara web scan" results used by the Activate Trust Profile wizard.
// In production this would be replaced by an edge function (Firecrawl + LLM)
// that scrapes the vendor homepage. The shape is what the wizard consumes.

export interface LaraScanFinding {
  key: string;
  label: string;
  detail?: string;
  source?: string; // hvor på hjemmesiden vi fant det
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
    { key: "desc", label: "Beskrivelse av virksomheten", detail: "Hentet fra «Om oss»-siden", source: "/om-oss" },
    { key: "privacy", label: "Personvernerklæring funnet", source: "/personvern" },
    { key: "contact", label: "Kontaktpersoner identifisert", detail: "Daglig leder og personvernkontakt" },
    { key: "security", label: "Sikkerhetstiltak nevnt på nettsiden", detail: "MFA, kryptering, Microsoft 365" },
    { key: "subproc", label: "Underleverandører oppdaget", detail: "10 stk identifisert i tjenestebeskrivelser og personvernerklæring" },
    { key: "docs", label: "3 dokumenter foreslått til Trust Profile" },
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
    subProcessors: ["Microsoft 365"],
  },
  documents: [
    { title: "Personvernerklæring", url: "https://example.no/personvern", type: "privacy_policy" },
  ],
  findings: [
    { key: "desc", label: "Generell virksomhetsbeskrivelse" },
    { key: "privacy", label: "Personvernerklæring funnet" },
    { key: "contact", label: "Kontaktinformasjon hentet" },
    { key: "security", label: "Standard sikkerhetstiltak identifisert" },
    { key: "docs", label: "1 dokument foreslått" },
  ],
};

export function getLaraScanForDomain(domain: string): LaraScanResult {
  const normalized = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (normalized.includes("framdrift")) return FRAMDRIFT;
  return GENERIC;
}

export const SCAN_STEPS_MS = 850; // delay per finding for progressive reveal
