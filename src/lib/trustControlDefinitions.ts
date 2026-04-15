/**
 * Trust Control Definitions — Risk-Driven Trust Model
 * 
 * Generic controls apply to ALL trust profiles.
 * Type-specific controls apply based on asset_type.
 * Key risks and recommended actions are derived from control status.
 */

// ── Verification & ownership types ───────────────────────────────────

export type ProfileSource = "ai_generated" | "customer_created" | "vendor_claimed";
export type ProfileOwner = "platform" | "customer" | "vendor";
export type ProfileContributor = "ai" | "customer" | "vendor";
export type VerificationSource = "ai_inferred" | "customer_asserted" | "vendor_verified" | "third_party_verified";

export interface TrustProfileMeta {
  profileSource: ProfileSource;
  profileOwner: ProfileOwner;
  contributors: ProfileContributor[];
}

export type TrustControlStatus = "implemented" | "partial" | "missing";
export type ControlArea = "governance" | "risk_compliance" | "security_posture" | "privacy_data" | "supplier_governance";
export type RiskSeverity = "high" | "medium" | "low";

export type ControlSource = "vendor_baseline" | "org_enrichment";

export interface TrustControlDefinition {
  key: string;
  labelEn: string;
  labelNb: string;
  descriptionEn?: string;
  descriptionNb?: string;
  weight: number;
  area: ControlArea;
  source: ControlSource;
}

export interface EvaluatedControl extends TrustControlDefinition {
  status: TrustControlStatus;
  verificationSource?: VerificationSource;
}

export interface KeyRisk {
  id: string;
  severity: RiskSeverity;
  titleEn: string;
  titleNb: string;
  reasonEn?: string;
  reasonNb?: string;
  triggerControlKey: string;
}

export interface RecommendedAction {
  id: string;
  titleEn: string;
  titleNb: string;
  relatedRiskId: string;
  triggerControlKey: string;
}

// ── Verification weight multipliers ──────────────────────────────────
const VERIFICATION_WEIGHTS: Record<VerificationSource, number> = {
  ai_inferred: 0.5,
  customer_asserted: 0.7,
  vendor_verified: 1.0,
  third_party_verified: 1.0,
};

// ── Generic controls (Governance area) ───────────────────────────────
export const GENERIC_CONTROLS: TrustControlDefinition[] = [
  { key: "risk_level_defined", labelEn: "Risk level defined", labelNb: "Risikonivå definert", descriptionEn: "Has a risk level been assessed for the asset?", descriptionNb: "Er det vurdert et risikonivå for eiendelen?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "criticality_defined", labelEn: "Criticality defined", labelNb: "Kritikalitet definert", descriptionEn: "Has the criticality been determined?", descriptionNb: "Er kritikaliteten bestemt?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "risk_assessment", labelEn: "Risk assessment performed", labelNb: "Risikovurdering utført", descriptionEn: "Has a risk assessment been performed?", descriptionNb: "Er det utført en risikovurdering?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "documentation_available", labelEn: "Documentation available", labelNb: "Dokumentasjon tilgjengelig", descriptionEn: "Is relevant documentation uploaded?", descriptionNb: "Er relevant dokumentasjon lastet opp?", weight: 1, area: "governance", source: "vendor_baseline" },
];

// ── Vendor-specific (Supplier Governance) ────────────────────────────
export const VENDOR_CONTROLS: TrustControlDefinition[] = [
  { key: "dpa_verified", labelEn: "Data processing agreement verified", labelNb: "Databehandleravtale verifisert", weight: 1, area: "supplier_governance", source: "vendor_baseline" },
  { key: "security_contact", labelEn: "Security contact defined", labelNb: "Sikkerhetskontakt definert", weight: 1, area: "supplier_governance", source: "vendor_baseline" },
  { key: "sub_processors_disclosed", labelEn: "Sub-processors disclosed", labelNb: "Underleverandører oppgitt", weight: 1, area: "supplier_governance", source: "vendor_baseline" },
  { key: "vendor_security_review", labelEn: "Vendor security review completed", labelNb: "Leverandørsikkerhetsgjennomgang fullført", weight: 1, area: "supplier_governance", source: "vendor_baseline" },
  // Privacy & Data Handling
  { key: "vendor_privacy_policy", labelEn: "Privacy policy available", labelNb: "Personvernerklæring tilgjengelig", descriptionEn: "Does the vendor have a published privacy policy?", descriptionNb: "Har leverandøren en publisert personvernerklæring?", weight: 1, area: "privacy_data", source: "vendor_baseline" },
  { key: "vendor_data_location", labelEn: "Data storage location documented", labelNb: "Datalagringssted dokumentert", descriptionEn: "Is it documented where data is stored (country/region)?", descriptionNb: "Er det dokumentert hvor data lagres (land/region)?", weight: 1, area: "privacy_data", source: "vendor_baseline" },
  { key: "vendor_data_retention", labelEn: "Data retention policy defined", labelNb: "Oppbevaringsrutiner definert", descriptionEn: "Does the vendor have documented data retention and deletion routines?", descriptionNb: "Har leverandøren dokumenterte rutiner for oppbevaring og sletting av data?", weight: 1, area: "privacy_data", source: "vendor_baseline" },
  { key: "vendor_data_portability", labelEn: "Data portability supported", labelNb: "Dataportabilitet støttet", descriptionEn: "Can data be exported if the agreement is terminated?", descriptionNb: "Kan data eksporteres ved avslutning av avtalen?", weight: 1, area: "privacy_data", source: "vendor_baseline" },
  { key: "vendor_gdpr_compliant", labelEn: "GDPR compliance confirmed", labelNb: "GDPR-samsvar bekreftet", descriptionEn: "Has the vendor confirmed GDPR compliance?", descriptionNb: "Har leverandøren bekreftet samsvar med GDPR?", weight: 1, area: "privacy_data", source: "vendor_baseline" },
];

// ── System-specific (Security Posture) ───────────────────────────────
export const SYSTEM_CONTROLS: TrustControlDefinition[] = [
  { key: "mfa_enabled", labelEn: "Multi-factor authentication enabled", labelNb: "Flerfaktorautentisering aktivert", weight: 1, area: "security_posture", source: "vendor_baseline" },
  { key: "encryption_enabled", labelEn: "Encryption enabled", labelNb: "Kryptering aktivert", weight: 1, area: "security_posture", source: "vendor_baseline" },
  { key: "backup_configured", labelEn: "Backup configured", labelNb: "Sikkerhetskopiering konfigurert", weight: 1, area: "security_posture", source: "vendor_baseline" },
  { key: "security_logging", labelEn: "Security logging enabled", labelNb: "Sikkerhetslogging aktivert", weight: 1, area: "security_posture", source: "vendor_baseline" },
  // Privacy & Data Handling
  { key: "system_personal_data_mapped", labelEn: "Personal data categories mapped", labelNb: "Personopplysningskategorier kartlagt", descriptionEn: "Are the types of personal data processed by this system documented?", descriptionNb: "Er typene personopplysninger som behandles i dette systemet dokumentert?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "system_legal_basis", labelEn: "Legal basis for processing defined", labelNb: "Behandlingsgrunnlag definert", descriptionEn: "Is the legal basis for personal data processing defined (e.g. consent, contract)?", descriptionNb: "Er behandlingsgrunnlaget definert (f.eks. samtykke, avtale)?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "system_data_retention", labelEn: "Retention and deletion routines", labelNb: "Oppbevarings- og sletterutiner", descriptionEn: "Are retention periods and deletion routines defined for this system?", descriptionNb: "Er oppbevaringstid og sletterutiner definert for dette systemet?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "system_access_logging", labelEn: "Access to personal data logged", labelNb: "Tilgang til personopplysninger logges", descriptionEn: "Is access to personal data in this system logged and auditable?", descriptionNb: "Logges og kan tilgang til personopplysninger i dette systemet revideres?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "system_data_minimization", labelEn: "Data minimization practiced", labelNb: "Dataminimering praktisert", descriptionEn: "Is the system configured to collect only necessary personal data?", descriptionNb: "Er systemet konfigurert til å kun samle inn nødvendige personopplysninger?", weight: 1, area: "privacy_data", source: "org_enrichment" },
];

// ── Hardware/asset-specific (Security Posture) ───────────────────────
export const HARDWARE_CONTROLS: TrustControlDefinition[] = [
  { key: "device_encryption", labelEn: "Device encryption enabled", labelNb: "Enhetskryptering aktivert", weight: 1, area: "security_posture", source: "vendor_baseline" },
  { key: "endpoint_protection", labelEn: "Endpoint protection installed", labelNb: "Endepunktbeskyttelse installert", weight: 1, area: "security_posture", source: "org_enrichment" },
  { key: "patch_management", labelEn: "Patch management active", labelNb: "Patchhåndtering aktiv", weight: 1, area: "security_posture", source: "org_enrichment" },
];

// ── Organizational unit / self — all 17 trust controls ───────────────
export const ORG_CONTROLS: TrustControlDefinition[] = [
  // Governance & Accountability (gov-1 to gov-4)
  { key: "security_responsibility", labelEn: "Security & privacy responsibility", labelNb: "Ansvar for sikkerhet og personvern", descriptionEn: "Is it clearly defined who is responsible?", descriptionNb: "Er det tydelig definert hvem som har ansvaret?", weight: 1, area: "governance", source: "org_enrichment" },
  { key: "documented_policies", labelEn: "Documented policies", labelNb: "Dokumenterte policyer", descriptionEn: "Does the organization have documented security policies?", descriptionNb: "Har virksomheten dokumenterte sikkerhetspolicyer?", weight: 1, area: "governance", source: "org_enrichment" },
  { key: "risk_assessment_recent", labelEn: "Risk assessment last 12 months", labelNb: "Risikovurdering siste 12 mnd", descriptionEn: "Has a formal risk assessment been conducted?", descriptionNb: "Er det gjennomført en formell risikovurdering?", weight: 1, area: "governance", source: "org_enrichment" },
  { key: "incident_handling", labelEn: "Incident handling", labelNb: "Hendelseshåndtering", descriptionEn: "Is there a documented procedure for incident handling?", descriptionNb: "Finnes det en dokumentert prosedyre for hendelseshåndtering?", weight: 1, area: "governance", source: "org_enrichment" },
  // Security (sec-1 to sec-5)
  { key: "access_control", labelEn: "Access control (least privilege)", labelNb: "Tilgangsstyring (least privilege)", descriptionEn: "Does access control follow the principle of least privilege?", descriptionNb: "Følger tilgangsstyringen prinsippet om minste privilegium?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "mfa_org", labelEn: "Multi-factor authentication", labelNb: "MFA", descriptionEn: "Is multi-factor authentication implemented?", descriptionNb: "Er flerfaktorautentisering implementert?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "encryption_org", labelEn: "Encryption", labelNb: "Kryptering", descriptionEn: "Is data encrypted in transit and at rest?", descriptionNb: "Er data kryptert i transit og i hvile?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "logging_monitoring", labelEn: "Logging and monitoring", labelNb: "Logging og overvåking", descriptionEn: "Is logging implemented for critical systems?", descriptionNb: "Er logging implementert for kritiske systemer?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  { key: "security_testing", labelEn: "Security testing", labelNb: "Sikkerhetstesting", descriptionEn: "Is regular security testing performed (e.g. vulnerability scanning or penetration testing)?", descriptionNb: "Gjennomføres det regelmessig sikkerhetstesting (f.eks. sårbarhetsskanning eller penetrasjonstesting)?", weight: 1, area: "risk_compliance", source: "org_enrichment" },
  // Privacy & Data Handling (priv-1 to priv-5)
  { key: "ropa", labelEn: "Record of processing activities (ROPA)", labelNb: "Behandlingsoversikt (ROPA)", descriptionEn: "Does the organization have an up-to-date record of processing activities?", descriptionNb: "Har virksomheten en oppdatert behandlingsoversikt?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "dpa_org", labelEn: "Data processing agreement (DPA)", labelNb: "Databehandleravtale (DPA)", descriptionEn: "Are DPAs in place with all relevant third parties?", descriptionNb: "Er det inngått DPA med alle relevante tredjeparter?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "dpia", labelEn: "Data protection impact assessment (DPIA)", labelNb: "DPIA", descriptionEn: "Has a DPIA been conducted where required?", descriptionNb: "Er det gjennomført DPIA der det er påkrevd?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "data_subject_rights", labelEn: "Data subject rights", labelNb: "Registrertes rettigheter", descriptionEn: "Are there processes for access, deletion, etc.?", descriptionNb: "Er det prosesser for innsyn, sletting, etc.?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  { key: "data_storage_control", labelEn: "Data storage location control", labelNb: "Kontroll over datalagringssted", descriptionEn: "Does the organization control where data is stored, including international transfers?", descriptionNb: "Har virksomheten kontroll over hvor data lagres, inkludert internasjonale overføringer?", weight: 1, area: "privacy_data", source: "org_enrichment" },
  // Third-Party & Supply Chain (sup-1 to sup-3)
  { key: "vendor_inventory", labelEn: "Vendor inventory", labelNb: "Leverandøroversikt (inventory)", descriptionEn: "Is there an up-to-date and complete overview of all third parties and sub-processors?", descriptionNb: "Finnes det en oppdatert og komplett oversikt over alle tredjeparter og underleverandører?", weight: 1, area: "supplier_governance", source: "org_enrichment" },
  { key: "vendor_risk_assessment", labelEn: "Vendor risk assessment", labelNb: "Risikovurdering av leverandører", descriptionEn: "Are risk assessments and security evaluations of vendors performed before and during the contract period?", descriptionNb: "Gjennomføres det risikovurdering og sikkerhetsevaluering av leverandører før og under avtaleperioden?", weight: 1, area: "supplier_governance", source: "org_enrichment" },
  { key: "vendor_followup", labelEn: "Regular vendor follow-up", labelNb: "Jevnlig oppfølging", descriptionEn: "Is regular evaluation and follow-up of vendors performed?", descriptionNb: "Gjennomføres det regelmessig evaluering og oppfølging av leverandører?", weight: 1, area: "supplier_governance", source: "org_enrichment" },
];

// ── Risk mapping: control key → risk when missing/partial ────────────
const RISK_MAP: Record<string, { severity: RiskSeverity; titleEn: string; titleNb: string; reasonEn?: string; reasonNb?: string }> = {
  dpa_verified: { severity: "high", titleEn: "No Data Processing Agreement verified — GDPR compliance risk", titleNb: "Ingen databehandleravtale verifisert — GDPR-samsvarsrisiko", reasonNb: "Uten en verifisert DPA har organisasjonen ingen juridisk avtale som regulerer leverandørens behandling av personopplysninger. Dette er et brudd på GDPR Art. 28.", reasonEn: "Without a verified DPA, there is no legal agreement governing the vendor's processing of personal data. This violates GDPR Art. 28." },
  encryption_enabled: { severity: "high", titleEn: "Encryption not enabled — data exposure risk", titleNb: "Kryptering ikke aktivert — risiko for dataeksponering", reasonNb: "Data som ikke er kryptert kan eksponeres ved uautorisert tilgang, nettverksangrep eller fysisk tyveri av utstyr.", reasonEn: "Unencrypted data can be exposed through unauthorized access, network attacks, or physical theft of equipment." },
  device_encryption: { severity: "high", titleEn: "Device encryption missing — data exposure risk", titleNb: "Enhetskryptering mangler — risiko for dataeksponering", reasonNb: "Uten enhetskryptering kan sensitiv data leses direkte fra tapte eller stjålne enheter.", reasonEn: "Without device encryption, sensitive data can be read directly from lost or stolen devices." },
  mfa_enabled: { severity: "high", titleEn: "MFA not enabled — account compromise risk", titleNb: "MFA ikke aktivert — risiko for kontokompromittering", reasonNb: "Uten flerfaktorautentisering er kontoer sårbare for phishing og passordangrep.", reasonEn: "Without MFA, accounts are vulnerable to phishing and password attacks." },
  vendor_security_review: { severity: "medium", titleEn: "Vendor security review missing — third-party security risk", titleNb: "Leverandørsikkerhetsgjennomgang mangler — tredjepartsrisiko", reasonNb: "Uten en sikkerhetsgjennomgang av leverandøren mangler organisasjonen innsikt i leverandørens sikkerhetsnivå og potensielle sårbarheter.", reasonEn: "Without a vendor security review, the organization lacks insight into the vendor's security posture and potential vulnerabilities." },
  risk_assessment: { severity: "medium", titleEn: "Risk assessment not performed — unknown risk exposure", titleNb: "Risikovurdering ikke utført — ukjent risikoeksponering", reasonNb: "Uten risikovurdering kan organisasjonen ikke identifisere eller prioritere trusler knyttet til denne leverandøren.", reasonEn: "Without a risk assessment, the organization cannot identify or prioritize threats related to this vendor." },
  risk_assessment_recent: { severity: "medium", titleEn: "No recent risk assessment — unknown risk exposure", titleNb: "Ingen nylig risikovurdering — ukjent risikoeksponering", reasonNb: "Risikolandskapet endrer seg kontinuerlig. En utdatert vurdering reflekterer ikke nåværende trusler.", reasonEn: "The risk landscape changes continuously. An outdated assessment does not reflect current threats." },
  sub_processors_disclosed: { severity: "medium", titleEn: "Sub-processors not disclosed — supply chain risk", titleNb: "Underleverandører ikke oppgitt — leverandørkjederisiko", reasonNb: "Uten oversikt over underleverandører kan data behandles av ukjente tredjeparter uten tilstrekkelig kontroll.", reasonEn: "Without visibility into sub-processors, data may be processed by unknown third parties without adequate controls." },
  security_logging: { severity: "medium", titleEn: "Security logging not enabled — incident detection risk", titleNb: "Sikkerhetslogging ikke aktivert — risiko for manglende hendelsesdeteksjon", reasonNb: "Uten logging kan sikkerhetshendelser gå uoppdaget, noe som forsinker respons og øker skadeomfanget.", reasonEn: "Without logging, security incidents may go undetected, delaying response and increasing damage." },
  backup_configured: { severity: "medium", titleEn: "Backup not configured — data loss risk", titleNb: "Sikkerhetskopiering ikke konfigurert — risiko for datatap", reasonNb: "Uten backup risikerer organisasjonen permanent tap av data ved systemfeil, ransomware eller menneskelig feil.", reasonEn: "Without backup, the organization risks permanent data loss from system failures, ransomware, or human error." },
  endpoint_protection: { severity: "medium", titleEn: "Endpoint protection missing — malware risk", titleNb: "Endepunktbeskyttelse mangler — risiko for skadevare", reasonNb: "Ubeskyttede endepunkter er sårbare for skadevare, som kan spre seg i nettverket.", reasonEn: "Unprotected endpoints are vulnerable to malware that can spread across the network." },
  documentation_available: { severity: "low", titleEn: "Documentation missing — audit readiness risk", titleNb: "Dokumentasjon mangler — risiko for manglende revisjonsberedskap", reasonNb: "Manglende dokumentasjon gjør det vanskelig å demonstrere samsvar ved revisjon eller tilsyn.", reasonEn: "Missing documentation makes it difficult to demonstrate compliance during audits or inspections." },
  security_responsibility: { severity: "high", titleEn: "Security responsibility not defined — accountability gap", titleNb: "Ansvar for sikkerhet ikke definert — manglende ansvarsplassering", reasonNb: "Uten tydelig ansvarsplassering kan sikkerhetstiltak falle mellom stoler, og ingen følger opp kritiske kontroller.", reasonEn: "Without clear accountability, security measures may fall through the cracks with no one following up on critical controls." },
  documented_policies: { severity: "medium", titleEn: "No documented security policies — governance gap", titleNb: "Ingen dokumenterte sikkerhetspolicyer — styringsmangler", reasonNb: "Uten dokumenterte policyer mangler organisasjonen et felles rammeverk for sikkerhetsbeslutninger.", reasonEn: "Without documented policies, the organization lacks a common framework for security decisions." },
  incident_handling: { severity: "medium", titleEn: "No incident handling procedure — response gap", titleNb: "Ingen hendelseshåndteringsprosedyre — responsgap", reasonNb: "Uten prosedyrer for hendelseshåndtering kan responstiden bli kritisk lang, og skadeomfanget øke.", reasonEn: "Without incident handling procedures, response times may be critically long, increasing damage." },
  security_contact: { severity: "low", titleEn: "Security contact not defined — communication gap", titleNb: "Sikkerhetskontakt ikke definert — kommunikasjonsgap", reasonNb: "Uten definert sikkerhetskontakt kan det ta tid å nå riktig person ved en hendelse.", reasonEn: "Without a defined security contact, it may take time to reach the right person during an incident." },
  patch_management: { severity: "medium", titleEn: "Patch management not active — vulnerability risk", titleNb: "Patchhåndtering ikke aktiv — sårbarhetssrisiko", reasonNb: "Upatchede systemer er sårbare for kjente angrepsmetoder som aktivt utnyttes.", reasonEn: "Unpatched systems are vulnerable to known attack methods that are actively exploited." },
  access_control: { severity: "high", titleEn: "Access control not following least privilege — unauthorized access risk", titleNb: "Tilgangsstyring følger ikke minste privilegium — risiko for uautorisert tilgang", reasonNb: "For vide tilganger øker risikoen for at data eksponeres eller endres av uvedkommende.", reasonEn: "Overly broad access increases the risk of data being exposed or modified by unauthorized parties." },
  mfa_org: { severity: "high", titleEn: "MFA not implemented — account compromise risk", titleNb: "MFA ikke implementert — risiko for kontokompromittering", reasonNb: "Kontoer uten MFA er betydelig enklere å kompromittere gjennom phishing eller lekkede passord.", reasonEn: "Accounts without MFA are significantly easier to compromise through phishing or leaked passwords." },
  encryption_org: { severity: "high", titleEn: "Encryption not enabled — data exposure risk", titleNb: "Kryptering ikke aktivert — risiko for dataeksponering", reasonNb: "Ukrypterte data kan avlyttes under overføring eller leses ved uautorisert tilgang til lagring.", reasonEn: "Unencrypted data can be intercepted during transit or read through unauthorized storage access." },
  logging_monitoring: { severity: "medium", titleEn: "Logging and monitoring not implemented — incident detection risk", titleNb: "Logging og overvåking ikke implementert — risiko for manglende deteksjon", reasonNb: "Uten overvåking oppdages ikke sikkerhetshendelser i tide, noe som kan gi angripere langvarig tilgang.", reasonEn: "Without monitoring, security incidents are not detected in time, potentially giving attackers prolonged access." },
  security_testing: { severity: "medium", titleEn: "No regular security testing — unknown vulnerability risk", titleNb: "Ingen regelmessig sikkerhetstesting — ukjent sårbarhet", reasonNb: "Uten testing kan ukjente sårbarheter eksistere i systemet over lang tid uten å bli oppdaget.", reasonEn: "Without testing, unknown vulnerabilities may exist in the system for extended periods without detection." },
  ropa: { severity: "medium", titleEn: "No record of processing activities — GDPR compliance risk", titleNb: "Ingen behandlingsoversikt — GDPR-samsvarsrisiko", reasonNb: "GDPR Art. 30 krever en behandlingsoversikt. Mangel på dette er et direkte brudd på regelverket.", reasonEn: "GDPR Art. 30 requires a record of processing activities. Its absence is a direct regulatory violation." },
  dpa_org: { severity: "high", titleEn: "No data processing agreements — GDPR compliance risk", titleNb: "Ingen databehandleravtaler — GDPR-samsvarsrisiko", reasonNb: "Uten DPA er det ikke regulert hvordan leverandøren behandler personopplysninger, noe som er påkrevd av GDPR Art. 28.", reasonEn: "Without a DPA, how the vendor processes personal data is unregulated, as required by GDPR Art. 28." },
  dpia: { severity: "medium", titleEn: "No DPIA conducted — privacy risk", titleNb: "Ingen DPIA gjennomført — personvernrisiko", reasonNb: "Uten DPIA er personvernrisikoen ved behandlingen ikke systematisk vurdert, som påkrevd ved høyrisikobehandlinger.", reasonEn: "Without a DPIA, privacy risks of the processing have not been systematically assessed, as required for high-risk processing." },
  data_subject_rights: { severity: "medium", titleEn: "No processes for data subject rights — GDPR compliance risk", titleNb: "Ingen prosesser for registrertes rettigheter — GDPR-samsvarsrisiko", reasonNb: "GDPR gir registrerte rett til innsyn, sletting og retting. Uten prosesser kan ikke organisasjonen oppfylle disse kravene.", reasonEn: "GDPR grants data subjects rights to access, deletion, and rectification. Without processes, the organization cannot fulfill these requirements." },
  data_storage_control: { severity: "medium", titleEn: "No control over data storage location — transfer risk", titleNb: "Ingen kontroll over datalagringssted — overføringsrisiko", reasonNb: "Uten oversikt over hvor data lagres kan det forekomme ulovlige overføringer til tredjeland uten tilstrekkelig beskyttelsesnivå.", reasonEn: "Without knowing where data is stored, unlawful transfers to third countries without adequate protection may occur." },
  vendor_inventory: { severity: "medium", titleEn: "No vendor inventory — supply chain risk", titleNb: "Ingen leverandøroversikt — leverandørkjederisiko", reasonNb: "Uten leverandøroversikt mangler organisasjonen totalbilde av hvem som har tilgang til data og systemer.", reasonEn: "Without a vendor inventory, the organization lacks a complete picture of who has access to data and systems." },
  vendor_risk_assessment: { severity: "medium", titleEn: "No vendor risk assessment — third-party risk", titleNb: "Ingen risikovurdering av leverandører — tredjepartsrisiko", reasonNb: "Uten risikovurdering av leverandører er det ukjent hvilke trusler de utgjør mot organisasjonens data.", reasonEn: "Without vendor risk assessments, the threats they pose to the organization's data are unknown." },
  vendor_followup: { severity: "low", titleEn: "No regular vendor follow-up — oversight gap", titleNb: "Ingen jevnlig leverandøroppfølging — oppfølgingsgap", reasonNb: "Uten jevnlig oppfølging kan leverandørens sikkerhetsnivå forverres uten at organisasjonen er klar over det.", reasonEn: "Without regular follow-up, the vendor's security posture may deteriorate without the organization's awareness." },
  // Vendor privacy controls
  vendor_privacy_policy: { severity: "medium", titleEn: "No privacy policy available — transparency risk", titleNb: "Ingen personvernerklæring tilgjengelig — åpenhetsrisiko", reasonNb: "Uten personvernerklæring er det uklart hvordan leverandøren behandler personopplysninger.", reasonEn: "Without a privacy policy, it is unclear how the vendor processes personal data." },
  vendor_data_location: { severity: "medium", titleEn: "Data storage location unknown — transfer risk", titleNb: "Datalagringssted ukjent — overføringsrisiko", reasonNb: "Ukjent datalagringssted gjør det umulig å vurdere om overføringer til tredjeland er lovlige.", reasonEn: "Unknown data storage location makes it impossible to assess whether transfers to third countries are lawful." },
  vendor_data_retention: { severity: "medium", titleEn: "No data retention policy — compliance risk", titleNb: "Ingen oppbevaringsrutiner — samsvarsrisiko", reasonNb: "Uten definerte oppbevaringsrutiner kan data lagres lenger enn nødvendig, i strid med dataminimeringsprinsippet.", reasonEn: "Without defined retention policies, data may be stored longer than necessary, violating the data minimization principle." },
  vendor_data_portability: { severity: "low", titleEn: "Data portability not confirmed — vendor lock-in risk", titleNb: "Dataportabilitet ikke bekreftet — innlåsingsrisiko", reasonNb: "Uten bekreftet dataportabilitet kan det bli vanskelig å bytte leverandør eller hente ut egne data.", reasonEn: "Without confirmed data portability, switching vendors or extracting own data may be difficult." },
  vendor_gdpr_compliant: { severity: "high", titleEn: "GDPR compliance not confirmed — regulatory risk", titleNb: "GDPR-samsvar ikke bekreftet — regulatorisk risiko", reasonNb: "Uten bekreftet GDPR-samsvar risikerer organisasjonen å bruke en leverandør som ikke oppfyller lovkravene.", reasonEn: "Without confirmed GDPR compliance, the organization risks using a vendor that does not meet legal requirements." },
  // System privacy controls
  system_personal_data_mapped: { severity: "medium", titleEn: "Personal data not mapped — privacy risk", titleNb: "Personopplysninger ikke kartlagt — personvernrisiko", reasonNb: "Uten kartlegging av personopplysninger er det umulig å sikre korrekt behandling og beskyttelse.", reasonEn: "Without mapping personal data, it is impossible to ensure proper processing and protection." },
  system_legal_basis: { severity: "high", titleEn: "No legal basis defined — GDPR compliance risk", titleNb: "Behandlingsgrunnlag ikke definert — GDPR-samsvarsrisiko", reasonNb: "Enhver behandling av personopplysninger krever et gyldig behandlingsgrunnlag. Mangel på dette er ulovlig.", reasonEn: "Every processing of personal data requires a valid legal basis. Its absence is unlawful." },
  system_data_retention: { severity: "medium", titleEn: "No retention routines — data accumulation risk", titleNb: "Ingen sletterutiner — risiko for dataopphoping", reasonNb: "Uten sletterutiner akkumuleres data over tid, noe som øker risikoen ved et databrudd.", reasonEn: "Without deletion routines, data accumulates over time, increasing the risk in case of a data breach." },
  system_access_logging: { severity: "medium", titleEn: "Access to personal data not logged — audit risk", titleNb: "Tilgang til personopplysninger logges ikke — revisjonsrisiko", reasonNb: "Uten tilgangslogging kan ikke organisasjonen spore hvem som har sett eller endret personopplysninger.", reasonEn: "Without access logging, the organization cannot trace who has viewed or modified personal data." },
  system_data_minimization: { severity: "low", titleEn: "Data minimization not practiced — over-collection risk", titleNb: "Dataminimering ikke praktisert — risiko for overinnsamling", reasonNb: "Innsamling av mer data enn nødvendig øker eksponeringen ved et brudd og bryter med GDPR-prinsippet om dataminimering.", reasonEn: "Collecting more data than necessary increases exposure in a breach and violates the GDPR data minimization principle." },
};

// ── Action mapping: control key → recommended action ─────────────────
// targetTab: which tab to navigate to for remediation
const ACTION_MAP: Record<string, { titleEn: string; titleNb: string; targetTab?: string }> = {
  dpa_verified: { titleEn: "Request updated Data Processing Agreement", titleNb: "Be om oppdatert databehandleravtale", targetTab: "evidence" },
  encryption_enabled: { titleEn: "Enable encryption for this system", titleNb: "Aktiver kryptering for dette systemet", targetTab: "usage" },
  device_encryption: { titleEn: "Enable device encryption", titleNb: "Aktiver enhetskryptering", targetTab: "usage" },
  mfa_enabled: { titleEn: "Enable multi-factor authentication", titleNb: "Aktiver flerfaktorautentisering", targetTab: "usage" },
  vendor_security_review: { titleEn: "Complete vendor security review", titleNb: "Fullfør leverandørsikkerhetsgjennomgang", targetTab: "vendor-audit" },
  risk_assessment: { titleEn: "Complete risk assessment", titleNb: "Fullfør risikovurdering", targetTab: "vendor-audit" },
  risk_assessment_recent: { titleEn: "Conduct a formal risk assessment", titleNb: "Gjennomfør en formell risikovurdering", targetTab: "vendor-audit" },
  sub_processors_disclosed: { titleEn: "Request sub-processor disclosure from vendor", titleNb: "Be om underleverandøroversikt fra leverandør", targetTab: "evidence" },
  security_logging: { titleEn: "Enable security logging", titleNb: "Aktiver sikkerhetslogging", targetTab: "usage" },
  backup_configured: { titleEn: "Configure backup solution", titleNb: "Konfigurer sikkerhetskopiering", targetTab: "usage" },
  endpoint_protection: { titleEn: "Install endpoint protection", titleNb: "Installer endepunktbeskyttelse", targetTab: "usage" },
  documentation_available: { titleEn: "Upload security documentation", titleNb: "Last opp sikkerhetsdokumentasjon", targetTab: "evidence" },
  security_responsibility: { titleEn: "Define security and privacy responsibility", titleNb: "Definer ansvar for sikkerhet og personvern", targetTab: "overview" },
  documented_policies: { titleEn: "Document security policies", titleNb: "Dokumenter sikkerhetspolicyer", targetTab: "evidence" },
  incident_handling: { titleEn: "Define incident handling procedure", titleNb: "Definer prosedyre for hendelseshåndtering", targetTab: "vendor-incidents" },
  security_contact: { titleEn: "Define security contact", titleNb: "Definer sikkerhetskontakt", targetTab: "overview" },
  patch_management: { titleEn: "Activate patch management", titleNb: "Aktiver patchhåndtering", targetTab: "usage" },
  access_control: { titleEn: "Implement least privilege access control", titleNb: "Implementer tilgangsstyring etter minste privilegium", targetTab: "usage" },
  mfa_org: { titleEn: "Implement multi-factor authentication", titleNb: "Implementer flerfaktorautentisering", targetTab: "usage" },
  encryption_org: { titleEn: "Enable encryption for data in transit and at rest", titleNb: "Aktiver kryptering for data i transit og i hvile", targetTab: "usage" },
  logging_monitoring: { titleEn: "Implement logging and monitoring", titleNb: "Implementer logging og overvåking", targetTab: "usage" },
  security_testing: { titleEn: "Perform regular security testing", titleNb: "Gjennomfør regelmessig sikkerhetstesting", targetTab: "vendor-audit" },
  ropa: { titleEn: "Create record of processing activities", titleNb: "Opprett behandlingsoversikt", targetTab: "usage" },
  dpa_org: { titleEn: "Establish data processing agreements", titleNb: "Inngå databehandleravtaler", targetTab: "evidence" },
  dpia: { titleEn: "Conduct data protection impact assessment", titleNb: "Gjennomfør DPIA", targetTab: "vendor-audit" },
  data_subject_rights: { titleEn: "Establish processes for data subject rights", titleNb: "Etabler prosesser for registrertes rettigheter", targetTab: "usage" },
  data_storage_control: { titleEn: "Establish control over data storage locations", titleNb: "Etabler kontroll over datalagringssted", targetTab: "usage" },
  vendor_inventory: { titleEn: "Create vendor inventory", titleNb: "Opprett leverandøroversikt", targetTab: "overview" },
  vendor_risk_assessment: { titleEn: "Perform vendor risk assessments", titleNb: "Gjennomfør risikovurdering av leverandører", targetTab: "vendor-audit" },
  vendor_followup: { titleEn: "Establish regular vendor follow-up", titleNb: "Etabler jevnlig leverandøroppfølging", targetTab: "vendor-audit" },
  vendor_privacy_policy: { titleEn: "Request privacy policy from vendor", titleNb: "Be om personvernerklæring fra leverandør", targetTab: "evidence" },
  vendor_data_location: { titleEn: "Document data storage locations", titleNb: "Dokumenter datalagringssted", targetTab: "usage" },
  vendor_data_retention: { titleEn: "Request data retention policy", titleNb: "Be om oppbevaringsrutiner", targetTab: "evidence" },
  vendor_data_portability: { titleEn: "Confirm data portability options", titleNb: "Bekreft muligheter for dataportabilitet", targetTab: "evidence" },
  vendor_gdpr_compliant: { titleEn: "Request GDPR compliance confirmation", titleNb: "Be om bekreftelse på GDPR-samsvar", targetTab: "evidence" },
  system_personal_data_mapped: { titleEn: "Map personal data categories in system", titleNb: "Kartlegg personopplysningskategorier i systemet", targetTab: "usage" },
  system_legal_basis: { titleEn: "Define legal basis for processing", titleNb: "Definer behandlingsgrunnlag", targetTab: "usage" },
  system_data_retention: { titleEn: "Define retention and deletion routines", titleNb: "Definer oppbevarings- og sletterutiner", targetTab: "usage" },
  system_access_logging: { titleEn: "Enable access logging for personal data", titleNb: "Aktiver tilgangslogging for personopplysninger", targetTab: "usage" },
  system_data_minimization: { titleEn: "Review and minimize collected data", titleNb: "Gjennomgå og minimer innsamlede data", targetTab: "usage" },
};

/**
 * Get the action info for a given control key (includes target tab).
 */
export function getActionForControl(controlKey: string): { titleEn: string; titleNb: string; targetTab?: string } | null {
  return ACTION_MAP[controlKey] || null;
}

/**
 * Returns the type-specific controls for a given asset type.
 */
export function getTypeSpecificControls(assetType: string): TrustControlDefinition[] {
  switch (assetType) {
    case "vendor": return VENDOR_CONTROLS;
    case "system": return SYSTEM_CONTROLS;
    case "hardware": return HARDWARE_CONTROLS;
    case "self": return ORG_CONTROLS;
    default: return [];
  }
}

/**
 * Calculate trust score from evaluated controls.
 */
export function calculateTrustScore(controls: EvaluatedControl[]): number {
  if (controls.length === 0) return 0;
  const totalWeight = controls.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  const earned = controls.reduce((s, c) => {
    const factor = c.status === "implemented" ? 1 : c.status === "partial" ? 0.5 : 0;
    return s + c.weight * factor;
  }, 0);
  return Math.round((earned / totalWeight) * 100);
}

/**
 * Calculate separate scores for vendor baseline vs org enrichment.
 * Returns percentages relative to total controls (so they sum to trustScore).
 */
export function calculateScoreBySource(controls: EvaluatedControl[]): { baselinePercent: number; enrichmentPercent: number } {
  if (controls.length === 0) return { baselinePercent: 0, enrichmentPercent: 0 };
  const totalWeight = controls.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return { baselinePercent: 0, enrichmentPercent: 0 };
  let baselineEarned = 0;
  let enrichmentEarned = 0;
  for (const c of controls) {
    const factor = c.status === "implemented" ? 1 : c.status === "partial" ? 0.5 : 0;
    if (factor === 0) continue;
    if (c.source === "vendor_baseline") {
      baselineEarned += c.weight * factor;
    } else {
      enrichmentEarned += c.weight * factor;
    }
  }
  return {
    baselinePercent: Math.round((baselineEarned / totalWeight) * 100),
    enrichmentPercent: Math.round((enrichmentEarned / totalWeight) * 100),
  };
}

/**
 * Calculate confidence score based on verification levels.
 */
export function calculateConfidenceScore(controls: EvaluatedControl[]): number {
  const implemented = controls.filter((c) => c.status !== "missing");
  if (implemented.length === 0) return 0;
  const totalPossible = implemented.length;
  const earned = implemented.reduce((s, c) => {
    const vw = VERIFICATION_WEIGHTS[c.verificationSource || "ai_inferred"];
    return s + vw;
  }, 0);
  return Math.round((earned / totalPossible) * 100);
}

/**
 * Derive key risks from evaluated controls.
 */
export function deriveKeyRisks(controls: EvaluatedControl[]): KeyRisk[] {
  const risks: KeyRisk[] = [];
  for (const c of controls) {
    if (c.status === "implemented") continue;
    const mapping = RISK_MAP[c.key];
    if (!mapping) continue;
    risks.push({
      id: `risk-${c.key}`,
      severity: mapping.severity,
      titleEn: mapping.titleEn,
      titleNb: mapping.titleNb,
      reasonEn: mapping.reasonEn,
      reasonNb: mapping.reasonNb,
      triggerControlKey: c.key,
    });
  }
  // Sort: high → medium → low
  const order: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}

/**
 * Derive recommended actions from key risks.
 */
export function deriveRecommendedActions(risks: KeyRisk[]): RecommendedAction[] {
  return risks
    .map((r) => {
      const action = ACTION_MAP[r.triggerControlKey];
      if (!action) return null;
      return {
        id: `action-${r.triggerControlKey}`,
        titleEn: action.titleEn,
        titleNb: action.titleNb,
        relatedRiskId: r.id,
        triggerControlKey: r.triggerControlKey,
      };
    })
    .filter(Boolean) as RecommendedAction[];
}

/**
 * Generate AI insight summary text.
 */
export function generateAISummary(
  trustScore: number,
  confidenceScore: number,
  risks: KeyRisk[],
  actions: RecommendedAction[],
  assetType: string,
  isNb: boolean,
): string {
  const confidenceLevel = confidenceScore >= 80 ? (isNb ? "høy" : "high") : confidenceScore >= 50 ? (isNb ? "middels" : "medium") : (isNb ? "lav" : "low");
  const typeLabel = isNb
    ? (assetType === "vendor" ? "leverandørprofil" : assetType === "system" ? "systemprofil" : assetType === "hardware" ? "enhetsprofil" : "organisasjonsprofil")
    : (assetType === "vendor" ? "vendor profile" : assetType === "system" ? "system profile" : assetType === "hardware" ? "device profile" : "organization profile");

  const highRisks = risks.filter((r) => r.severity === "high");
  const topRisk = highRisks.length > 0 ? highRisks[0] : risks[0];
  const topAction = actions[0];

  const parts: string[] = [];

  if (isNb) {
    parts.push(`Denne ${typeLabel}en har ${confidenceLevel} verifiseringsgrad (${confidenceScore}%).`);
    if (topRisk) parts.push(`Den viktigste risikoen er: ${topRisk.titleNb.toLowerCase()}.`);
    if (topAction) parts.push(`Anbefalt handling: ${topAction.titleNb.toLowerCase()}.`);
    if (risks.length === 0) parts.push("Ingen kritiske risikoer identifisert.");
  } else {
    parts.push(`This ${typeLabel} has ${confidenceLevel} verification confidence (${confidenceScore}%).`);
    if (topRisk) parts.push(`The most important risk is: ${topRisk.titleEn.toLowerCase()}.`);
    if (topAction) parts.push(`Recommended action: ${topAction.titleEn.toLowerCase()}.`);
    if (risks.length === 0) parts.push("No critical risks identified.");
  }

  return parts.join(" ");
}

/**
 * Infer TrustProfileMeta from asset data.
 */
export function inferProfileMeta(asset: {
  asset_type?: string;
  metadata?: Record<string, any> | null;
}): TrustProfileMeta {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const profileSource: ProfileSource =
    meta.profile_source === "vendor_claimed" ? "vendor_claimed"
    : meta.profile_source === "customer_created" ? "customer_created"
    : "ai_generated";
  const profileOwner: ProfileOwner =
    meta.profile_owner === "vendor" ? "vendor"
    : meta.profile_owner === "customer" ? "customer"
    : "platform";
  const contributors: ProfileContributor[] = ["ai"];
  if (meta.customer_enriched || meta.profile_source === "customer_created") contributors.push("customer");
  if (meta.vendor_claimed || meta.profile_source === "vendor_claimed") contributors.push("vendor");
  return { profileSource, profileOwner, contributors };
}

/**
 * Infer the verification source for a control based on metadata.
 */
export function inferVerificationSource(
  controlKey: string,
  asset: { metadata?: Record<string, any> | null },
  docsCount: number,
): VerificationSource {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const vendorVerified = meta.vendor_verified_controls as string[] | undefined;
  if (vendorVerified?.includes(controlKey)) return "vendor_verified";
  const tpVerified = meta.third_party_verified_controls as string[] | undefined;
  if (tpVerified?.includes(controlKey)) return "third_party_verified";
  if (meta.profile_source === "vendor_claimed") return "vendor_verified";
  if (meta.customer_enriched) return "customer_asserted";
  if (docsCount >= 1 && controlKey === "documentation_available") return "customer_asserted";
  return "ai_inferred";
}

/**
 * Group controls by area.
 */
export function groupControlsByArea(controls: EvaluatedControl[]): Record<ControlArea, EvaluatedControl[]> {
  const grouped: Record<ControlArea, EvaluatedControl[]> = {
    governance: [],
    risk_compliance: [],
    security_posture: [],
    privacy_data: [],
    supplier_governance: [],
  };
  for (const c of controls) {
    grouped[c.area].push(c);
  }
  return grouped;
}

/**
 * Apply evidence-based penalties to evaluated controls.
 * If evidence is expired → control becomes "missing".
 * If evidence is stale → control becomes at most "partial".
 */
export function applyEvidencePenalties(
  controls: EvaluatedControl[],
  evidenceChecks: Array<{ control_key: string; status: string }>
): EvaluatedControl[] {
  const penaltyMap = new Map<string, string>();
  for (const check of evidenceChecks) {
    const existing = penaltyMap.get(check.control_key);
    // Keep the worst status per control key
    if (!existing || check.status === "expired" || (check.status === "stale" && existing === "fresh")) {
      penaltyMap.set(check.control_key, check.status);
    }
  }

  return controls.map((control) => {
    const penalty = penaltyMap.get(control.key);
    if (!penalty) return control;

    if (penalty === "expired") {
      return { ...control, status: "missing" as TrustControlStatus };
    }
    if (penalty === "stale" && control.status === "implemented") {
      return { ...control, status: "partial" as TrustControlStatus };
    }
    return control;
  });
}

/**
 * Navigation map: control key → profile tab (or "_header:field" for header-level fields).
 */
export const CONTROL_NAV_MAP: Record<string, string> = {
  risk_level_defined: "riskManagement",
  criticality_defined: "riskManagement",
  risk_assessment: "riskManagement",
  documentation_available: "documents",
  dpa_verified: "documents",
  security_contact: "_header:contact",
  sub_processors_disclosed: "relations",
  vendor_security_review: "controls",
  mfa_enabled: "controls",
  encryption_enabled: "controls",
  backup_configured: "controls",
  security_logging: "controls",
  device_encryption: "controls",
  endpoint_protection: "controls",
  patch_management: "controls",
  security_responsibility: "controls",
  documented_policies: "controls",
  risk_assessment_recent: "riskManagement",
  incident_handling: "incidents",
};
