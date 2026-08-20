import {
  Building2,
  Cloud,
  FileText,
  Fingerprint,
  Landmark,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Radio,
  Server,
  Shield,
  Ticket,
  Webhook,
  Users,
  type LucideIcon,
} from "lucide-react";

export type IntegrationCategory =
  | "identity"
  | "productivity"
  | "cloud_security"
  | "device"
  | "finance"
  | "incident_source"
  | "custom";

export type IntegrationAuthType = "oauth" | "api_key" | "upload";

export type DiscoveryType = "systems" | "vendors" | "users" | "documents" | "incidents";

/** available = kan kobles på i dag. planned = vises, men kan ikke kobles på ennå. */
export type IntegrationAvailability = "available" | "planned";

export interface IntegrationDefinition {
  id: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  description: string;
  discovers: DiscoveryType[];
  authType: IntegrationAuthType;
  scopes: string[];
  icon: LucideIcon;
  docsUrl?: string;
  readOnly: boolean;
  availability: IntegrationAvailability;
}


export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  identity: "Identitet & SSO",
  productivity: "Produktivitet",
  cloud_security: "Skysikkerhet / SaaS-oppdagelse",
  device: "Enhet & MDM",
  finance: "Fakturering & Regnskap",
  incident_source: "Avvik og hendelser",
  custom: "Egendefinert",
};

export const DISCOVERY_LABEL: Record<DiscoveryType, string> = {
  systems: "Systemer",
  vendors: "Leverandører",
  users: "Brukere",
  documents: "Dokumenter",
  incidents: "Avvik og hendelser",
};

/** Hva kilden gir Lara – brukes som filter på Datakilder og agenter. */
export const DISCOVERY_FILTER_LABEL: Record<DiscoveryType, string> = {
  systems: "Systemer",
  vendors: "Leverandører",
  documents: "Dokumenter",
  users: "Personer og tilganger",
  incidents: "Avvik",
};

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    id: "acronis",
    name: "Acronis Cyber Protect",
    vendor: "Acronis",
    category: "device",
    description:
      "Lara henter enheter, installert programvare og backup-status fra Acronis via 7 Security-agenten.",
    discovers: ["systems"],
    authType: "api_key",
    scopes: ["devices:read", "backups:read"],
    icon: Server,
    readOnly: true,
    availability: "available",
  },
  {
    id: "notion",
    name: "Notion",
    vendor: "Notion",
    category: "productivity",
    description:
      "Les policyer, rutiner og prosessbeskrivelser fra Notion slik at Lara kan bruke dem som dokumentasjonsunderlag.",
    discovers: ["documents"],
    authType: "oauth",
    scopes: ["read:content"],
    icon: FileText,
    readOnly: true,
    availability: "available",
  },

  {
    id: "entra_id",
    name: "Microsoft Entra ID",
    vendor: "Microsoft",
    category: "identity",
    description:
      "Oppdag SaaS-applikasjoner koblet til organisasjonens Entra ID (tidligere Azure AD) og hvilke brukere som har tilgang.",
    discovers: ["systems", "users"],
    authType: "oauth",
    scopes: ["Application.Read.All", "Directory.Read.All", "User.Read.All"],
    icon: Fingerprint,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "google_workspace",
    name: "Google Workspace",
    vendor: "Google",
    category: "identity",
    description:
      "Kartlegg tredjeparts-apper som ansatte har autorisert med sin arbeidskonto, samt brukerlisens-oversikt.",
    discovers: ["systems", "users"],
    authType: "oauth",
    scopes: ["admin.directory.user.readonly", "admin.directory.domain.readonly"],
    icon: Users,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "okta",
    name: "Okta",
    vendor: "Okta",
    category: "identity",
    description:
      "Hent applikasjonskatalog og gruppetilhørighet fra Okta for automatisk system- og eierkartlegging.",
    discovers: ["systems", "users"],
    authType: "api_key",
    scopes: ["okta.apps.read", "okta.users.read"],
    icon: Shield,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "microsoft_365",
    name: "Microsoft 365",
    vendor: "Microsoft",
    category: "productivity",
    description:
      "Oppdag Teams, SharePoint-nettsteder og OneDrive-delinger som del av registeret.",
    discovers: ["systems", "documents"],
    authType: "oauth",
    scopes: ["Sites.Read.All", "Team.ReadBasic.All"],
    icon: Layers,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "slack",
    name: "Slack",
    vendor: "Slack",
    category: "productivity",
    description:
      "Kartlegg installerte Slack-apper og integrasjoner som behandler bedriftsdata.",
    discovers: ["systems"],
    authType: "oauth",
    scopes: ["apps:read", "team:read"],
    icon: Cloud,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "defender_cloud_apps",
    name: "Defender for Cloud Apps",
    vendor: "Microsoft",
    category: "cloud_security",
    description:
      "Bruk Microsofts skysikkerhetslogger til å avdekke Shadow-IT og ukjente SaaS-tjenester i bruk.",
    discovers: ["systems", "vendors"],
    authType: "oauth",
    scopes: ["CloudApp-Discovery.Read.All"],
    icon: Shield,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "netskope",
    name: "Netskope",
    vendor: "Netskope",
    category: "cloud_security",
    description:
      "Importer oppdagede skytjenester og risiko-score fra Netskope CASB for automatisk berikelse.",
    discovers: ["systems", "vendors"],
    authType: "api_key",
    scopes: ["events:read", "apps:read"],
    icon: Cloud,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "intune",
    name: "Microsoft Intune",
    vendor: "Microsoft",
    category: "device",
    description:
      "Kartlegg administrerte enheter og installert programvare som del av system- og risikoregisteret.",
    discovers: ["systems"],
    authType: "oauth",
    scopes: ["DeviceManagementManagedDevices.Read.All"],
    icon: Server,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "jamf",
    name: "Jamf Pro",
    vendor: "Jamf",
    category: "device",
    description:
      "Importer Mac-flåten og installerte apper for komplett systemkartlegging på Apple-enheter.",
    discovers: ["systems"],
    authType: "api_key",
    scopes: ["read:computers", "read:applications"],
    icon: Server,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "tripletex",
    name: "Tripletex",
    vendor: "Tripletex",
    category: "finance",
    description:
      "Bruk regnskapsdata for å identifisere leverandører organisasjonen faktisk betaler for SaaS og tjenester.",
    discovers: ["vendors"],
    authType: "api_key",
    scopes: ["supplier:read", "ledger:read"],
    icon: Landmark,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "fiken",
    name: "Fiken",
    vendor: "Fiken",
    category: "finance",
    description:
      "Automatisk leverandøroppdagelse basert på fakturaer registrert i Fiken.",
    discovers: ["vendors"],
    authType: "api_key",
    scopes: ["read:contacts", "read:invoices"],
    icon: Landmark,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "xero",
    name: "Xero",
    vendor: "Xero",
    category: "finance",
    description:
      "Hent leverandørliste fra Xero for å berike leverandørregisteret og gap-analyser.",
    discovers: ["vendors"],
    authType: "oauth",
    scopes: ["accounting.contacts.read"],
    icon: Landmark,
    readOnly: true,
    availability: "planned",
  },
  /* ---------- Avvik og hendelser ---------- */
  {
    id: "seven_security_incidents",
    name: "7 Security (MDR)",
    vendor: "7 Security",
    category: "incident_source",
    description:
      "Sikkerhetshendelser fra overvåkingen sendes til Lara Innboks og opprettes som avvik med foreslått alvorlighetsgrad.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["incidents:read"],
    icon: Shield,
    readOnly: true,
    availability: "available",
  },
  {
    id: "deviation_mailbox",
    name: "E-postinnboks for avvik",
    vendor: "Mynder",
    category: "incident_source",
    description:
      "Videresend e-post til en dedikert adresse (f.eks. avvik@virksomhet.no). Lara leser meldingen og foreslår et avvik.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["mailbox:read"],
    icon: Mail,
    readOnly: true,
    availability: "available",
  },
  {
    id: "incident_webhook",
    name: "Webhook / API-inngang",
    vendor: "Mynder",
    category: "incident_source",
    description:
      "Generisk mottak av hendelser via signert webhook. For kilder uten ferdig kobling, som interne systemer eller egne skript.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["incidents:write"],
    icon: Webhook,
    readOnly: true,
    availability: "available",
  },
  {
    id: "acronis_incidents",
    name: "Acronis Cyber Protect (hendelser)",
    vendor: "Acronis",
    category: "incident_source",
    description:
      "Alarmer om feilede backups, malware-funn og enhetsavvik fra Acronis blir til avvik i registeret.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["alerts:read"],
    icon: Server,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "defender_incidents",
    name: "Microsoft Defender / Sentinel",
    vendor: "Microsoft",
    category: "incident_source",
    description:
      "Hendelser og varsler fra Defender XDR eller Sentinel mottas og klassifiseres av Lara før de blir avvik.",
    discovers: ["incidents"],
    authType: "oauth",
    scopes: ["SecurityIncident.Read.All", "SecurityAlert.Read.All"],
    icon: Shield,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "arctic_security",
    name: "Arctic Security",
    vendor: "Arctic Security",
    category: "incident_source",
    description:
      "Trusselvarsler om eksponerte tjenester og kompromitterte kontoer knyttet til organisasjonens domener.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["observations:read"],
    icon: Radio,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "jira_service_management",
    name: "Jira Service Management",
    vendor: "Atlassian",
    category: "incident_source",
    description:
      "Saker merket som avvik eller sikkerhetshendelse hentes inn og følges opp i Mynder uten dobbeltregistrering.",
    discovers: ["incidents"],
    authType: "oauth",
    scopes: ["read:jira-work"],
    icon: Ticket,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    vendor: "ServiceNow",
    category: "incident_source",
    description:
      "Hent incidents fra ITSM-prosessen og koble dem til systemer, leverandører og rammeverkskrav.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["incident.read"],
    icon: Ticket,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "zendesk",
    name: "Zendesk / Freshservice",
    vendor: "Zendesk",
    category: "incident_source",
    description:
      "Henvendelser fra kunder eller ansatte som gjelder personvern eller sikkerhet fanges opp som avvik.",
    discovers: ["incidents"],
    authType: "api_key",
    scopes: ["tickets:read"],
    icon: Ticket,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "teams_slack_reporting",
    name: "Microsoft Teams / Slack",
    vendor: "Microsoft",
    category: "incident_source",
    description:
      "Meld avvik der folk allerede jobber. Meldingen blir et utkast til avvik som ansvarlig bekrefter.",
    discovers: ["incidents"],
    authType: "oauth",
    scopes: ["ChannelMessage.Read.All"],
    icon: MessageSquare,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "mynder_me_reporting",
    name: "Mynder Me (ansattapp)",
    vendor: "Mynder",
    category: "incident_source",
    description:
      "Intern meldekanal for ansatte. Avvik meldt i appen havner direkte i registeret med riktig arbeidsområde.",
    discovers: ["incidents"],
    authType: "oauth",
    scopes: [],
    icon: Users,
    readOnly: true,
    availability: "planned",
  },

  {
    id: "csv_upload",
    name: "CSV-import",
    vendor: "Mynder",
    category: "custom",
    description:
      "Last opp en CSV-fil med systemer eller leverandører for engangs-berikelse. Ingen løpende tilkobling.",
    discovers: ["systems", "vendors"],
    authType: "upload",
    scopes: [],
    icon: FileText,
    readOnly: true,
    availability: "planned",
  },
  {
    id: "custom_rest",
    name: "Generisk REST API",
    vendor: "Mynder",
    category: "custom",
    description:
      "Koble til en egen kilde via HTTPS med Bearer-token. For interne CMDB-er eller egenutviklede systemer.",
    discovers: ["systems", "vendors"],
    authType: "api_key",
    scopes: [],
    icon: Building2,
    readOnly: true,
    availability: "planned",
  },
];

export type IntegrationStatus = "not_connected" | "active" | "error" | "expired";

export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  not_connected: "Ikke tilkoblet",
  active: "Aktiv",
  error: "Feil",
  expired: "Utløpt",
};
