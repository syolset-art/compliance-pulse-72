export type GlossaryCategory = 'mynder' | 'gdpr' | 'security';

export interface GlossaryTerm {
  term: string;
  definition_no: string;
  definition_en: string;
  category: GlossaryCategory;
  route?: string;
}

export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, { label_no: string; label_en: string }> = {
  mynder: { label_no: 'Mynder-begreper', label_en: 'Mynder concepts' },
  gdpr: { label_no: 'GDPR og personvern', label_en: 'GDPR & Privacy' },
  security: { label_no: 'Sikkerhet og compliance', label_en: 'Security & Compliance' },
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Mynder
  { term: 'Arbeidsområde', definition_no: 'En avdeling eller funksjon i organisasjonen (f.eks. HR, IT, Salg). Brukes til å strukturere ansvar og koble systemer til riktige prosesser.', definition_en: 'A department or function in the organization (e.g. HR, IT, Sales). Used to structure responsibilities and link systems to the correct processes.', category: 'mynder', route: '/work-areas' },
  { term: 'Prosess', definition_no: 'En behandlingsaktivitet som beskriver hvordan personopplysninger håndteres. Koblet til arbeidsområder og systemer i Mynder.', definition_en: 'A processing activity that describes how personal data is handled. Linked to work areas and systems in Mynder.', category: 'mynder', route: '/processing-records' },
  { term: 'System / Leverandør', definition_no: 'Et IT-system eller en tjeneste som behandler data på vegne av virksomheten. Registreres med risikovurdering, dataflyt og compliance-status.', definition_en: 'An IT system or service that processes data on behalf of the organization. Registered with risk assessment, data flow and compliance status.', category: 'mynder', route: '/assets' },
  { term: 'Trust Profil', definition_no: 'Virksomhetens selverklæring for compliance som kan deles med kunder og partnere via Mynder Trust Engine.', definition_en: 'The organization\'s self-declaration for compliance that can be shared with customers and partners via Mynder Trust Engine.', category: 'mynder', route: '/transparency' },
  { term: 'Lara', definition_no: 'Mynders AI-assistent som hjelper med dokumentasjon, gap-analyse, rapportgenerering og faglig veiledning.', definition_en: 'Mynder\'s AI assistant that helps with documentation, gap analysis, report generation and professional guidance.', category: 'mynder' },
  { term: 'Avvik', definition_no: 'En hendelse der noe gikk galt eller ikke fulgte virksomhetens retningslinjer. Registreres, spores og lukkes i avviksregisteret.', definition_en: 'An incident where something went wrong or did not follow the organization\'s guidelines. Registered, tracked and closed in the deviation register.', category: 'mynder', route: '/deviations' },
  { term: 'Compliance-sjekkliste', definition_no: 'Automatisk generert liste over krav fra aktive rammeverk (GDPR, ISO 27001, NIS2). Viser fremdrift og mangler.', definition_en: 'Automatically generated list of requirements from active frameworks (GDPR, ISO 27001, NIS2). Shows progress and gaps.', category: 'mynder', route: '/resources/controls' },
  { term: 'Kundeforespørsel', definition_no: 'En innkommende eller utgående forespørsel om compliance-dokumentasjon mellom din virksomhet og en kunde eller leverandør.', definition_en: 'An incoming or outgoing request for compliance documentation between your organization and a customer or vendor.', category: 'mynder', route: '/customer-requests' },

  // GDPR
  { term: 'Behandlingsprotokoll (ROPA)', definition_no: 'Record of Processing Activities — en komplett oversikt over alle behandlingsaktiviteter i virksomheten. Påkrevd etter GDPR Art. 30.', definition_en: 'Record of Processing Activities — a complete overview of all processing activities in the organization. Required under GDPR Art. 30.', category: 'gdpr', route: '/processing-records' },
  { term: 'Behandlingsgrunnlag', definition_no: 'Den lovlige grunnen til å behandle personopplysninger. De seks grunnlagene er: samtykke, avtale, rettslig forpliktelse, vitale interesser, allmennhetens interesse, og berettiget interesse.', definition_en: 'The lawful basis for processing personal data. The six bases are: consent, contract, legal obligation, vital interests, public interest, and legitimate interest.', category: 'gdpr' },
  { term: 'Databehandler', definition_no: 'En tredjepart (leverandør/system) som behandler personopplysninger på vegne av den behandlingsansvarlige. Krever en databehandleravtale (DPA).', definition_en: 'A third party (vendor/system) that processes personal data on behalf of the data controller. Requires a data processing agreement (DPA).', category: 'gdpr' },
  { term: 'Behandlingsansvarlig', definition_no: 'Den organisasjonen som bestemmer formålet med og midlene for behandling av personopplysninger. Bærer det overordnede ansvaret.', definition_en: 'The organization that determines the purpose and means of processing personal data. Bears the overall responsibility.', category: 'gdpr' },
  { term: 'Personvernombud (DPO)', definition_no: 'Data Protection Officer — en person med ansvar for å overvåke at virksomheten overholder personvernlovgivningen. Påkrevd for visse virksomheter.', definition_en: 'Data Protection Officer — a person responsible for overseeing the organization\'s compliance with data protection legislation. Required for certain organizations.', category: 'gdpr' },
  { term: 'DPIA', definition_no: 'Data Protection Impact Assessment (Personvernkonsekvensvurdering) — en vurdering av personvernrisiko ved behandlingsaktiviteter med høy risiko. Påkrevd etter GDPR Art. 35.', definition_en: 'Data Protection Impact Assessment — an assessment of privacy risk for high-risk processing activities. Required under GDPR Art. 35.', category: 'gdpr' },
  { term: 'TIA', definition_no: 'Transfer Impact Assessment — vurdering av risiko ved overføring av personopplysninger til land utenfor EØS (tredjeland).', definition_en: 'Transfer Impact Assessment — assessment of risk when transferring personal data to countries outside the EEA (third countries).', category: 'gdpr' },
  { term: 'Registrertes rettigheter', definition_no: 'Rettighetene en person har over egne personopplysninger: innsyn, retting, sletting, dataportabilitet, protest og begrensning av behandling.', definition_en: 'The rights an individual has over their personal data: access, rectification, erasure, data portability, objection and restriction of processing.', category: 'gdpr' },

  // Security & Compliance
  { term: 'Gap-analyse', definition_no: 'Kartlegging av forskjellen mellom nåværende status og kravene i et rammeverk. Gir en prioritert handlingsplan.', definition_en: 'Mapping the gap between current status and framework requirements. Provides a prioritized action plan.', category: 'security' },
  { term: 'Risikovurdering', definition_no: 'Systematisk identifisering, analyse og evaluering av trusler og sårbarheter som kan påvirke virksomhetens informasjonsverdier.', definition_en: 'Systematic identification, analysis and evaluation of threats and vulnerabilities that may affect the organization\'s information assets.', category: 'security' },
  { term: 'Kontroll', definition_no: 'Et tiltak (teknisk eller organisatorisk) som reduserer risiko til et akseptabelt nivå. Eksempler: tilgangsstyring, kryptering, opplæring.', definition_en: 'A measure (technical or organizational) that reduces risk to an acceptable level. Examples: access control, encryption, training.', category: 'security' },
  { term: 'SLA', definition_no: 'Service Level Agreement — avtale om tjenestenivå mellom virksomheten og en leverandør. Definerer oppetid, responstid og ansvarsfordeling.', definition_en: 'Service Level Agreement — an agreement on service levels between the organization and a vendor. Defines uptime, response time and responsibilities.', category: 'security' },
  { term: 'Intern audit', definition_no: 'Systematisk og uavhengig gjennomgang av styringssystemet for å verifisere at det fungerer som tiltenkt og identifisere forbedringsmuligheter.', definition_en: 'Systematic and independent review of the management system to verify it works as intended and identify improvement opportunities.', category: 'security' },
  { term: 'ISMS', definition_no: 'Information Security Management System — et helhetlig styringssystem for informasjonssikkerhet basert på ISO 27001.', definition_en: 'Information Security Management System — a comprehensive management system for information security based on ISO 27001.', category: 'security' },
  { term: 'Modenhetsnivå', definition_no: 'En skala som beskriver hvor moden virksomhetens compliance-prosesser er: Initial → Definert → Implementert → Målt → Optimalisert.', definition_en: 'A scale describing how mature the organization\'s compliance processes are: Initial → Defined → Implemented → Measured → Optimized.', category: 'security' },
];
