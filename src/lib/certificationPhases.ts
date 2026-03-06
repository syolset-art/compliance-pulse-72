// Compliance Maturity Phases — continuous improvement process

export type CertificationPhase = 
  | 'foundation'
  | 'implementation'
  | 'operation'
  | 'audit'
  | 'certification';

export type SLACategory = 'governance' | 'operations' | 'identity_access' | 'supplier_ecosystem';

export type MaturityLevel = 'initial' | 'defined' | 'implemented' | 'measured' | 'optimized';

export interface MynderFeatureLink {
  title_no: string;
  title_en: string;
  description_no: string;
  description_en: string;
  route: string;
  icon?: string;
}

export interface PhaseDefinition {
  id: CertificationPhase;
  name_no: string;
  name_en: string;
  description_no: string;
  description_en: string;
  percentageRange: [number, number];
  activities_no: string[];
  activities_en: string[];
  optional: boolean;
  whatToExpect_no: string;
  whatToExpect_en: string;
  learningContent_no: string;
  learningContent_en: string;
  mynderFeatures: MynderFeatureLink[];
}

export const CERTIFICATION_PHASES: PhaseDefinition[] = [
  {
    id: 'foundation',
    name_no: 'Fundament',
    name_en: 'Foundation',
    description_no: 'Etabler kontekst, scope og gap-analyse',
    description_en: 'Establish context, scope and gap analysis',
    percentageRange: [0, 15],
    activities_no: ['Kontekstanalyse', 'Scope-definisjon', 'Gap-analyse', 'Rollefordeling'],
    activities_en: ['Context analysis', 'Scope definition', 'Gap analysis', 'Role assignment'],
    optional: false,
    whatToExpect_no: 'I denne fasen kartlegger du virksomhetens kontekst, definerer omfanget av styringssystemet og gjennomfører en gap-analyse for å identifisere mangler.',
    whatToExpect_en: 'In this phase you map the organization\'s context, define the scope of the management system, and conduct a gap analysis to identify deficiencies.',
    learningContent_no: 'Fundamentet er grunnmuren i din compliance-prosess. Her etablerer du forståelse for hvilke lovkrav og standarder som gjelder for din virksomhet, hvem som har ansvar, og hvor dere står i dag sammenlignet med kravene. En grundig gap-analyse gir dere et klart bilde av hva som må gjøres videre.',
    learningContent_en: 'The foundation is the bedrock of your compliance process. Here you establish an understanding of which legal requirements and standards apply to your organization, who is responsible, and where you stand today compared to the requirements. A thorough gap analysis gives you a clear picture of what needs to be done next.',
    mynderFeatures: [
      { title_no: 'Onboarding-veiviseren', title_en: 'Onboarding wizard', description_no: 'Guided oppsett av virksomhetens profil og scope', description_en: 'Guided setup of company profile and scope', route: '/onboarding' },
      { title_no: 'Gap-analyse', title_en: 'Gap analysis', description_no: 'Automatisk identifisering av mangler mot kravene', description_en: 'Automatic identification of gaps against requirements', route: '/compliance-checklist' },
      { title_no: 'Roller og ansvar', title_en: 'Roles and responsibilities', description_no: 'Definer arbeidsområder og tildel ansvar', description_en: 'Define work areas and assign responsibilities', route: '/work-areas' },
    ],
  },
  {
    id: 'implementation',
    name_no: 'Implementering',
    name_en: 'Implementation',
    description_no: 'Utvikle policies, risikovurdering og kontrolltiltak',
    description_en: 'Develop policies, risk assessment and control measures',
    percentageRange: [15, 40],
    activities_no: ['Policy-utvikling', 'Risikovurdering', 'Risikobehandling', 'Målsetting'],
    activities_en: ['Policy development', 'Risk assessment', 'Risk treatment', 'Objective setting'],
    optional: false,
    whatToExpect_no: 'Du utvikler policies, gjennomfører risikovurderinger og definerer kontrolltiltak som er tilpasset din virksomhet.',
    whatToExpect_en: 'You develop policies, conduct risk assessments, and define control measures tailored to your organization.',
    learningContent_no: 'Implementeringsfasen er der teori møter praksis. Du oppretter konkrete retningslinjer (policies), gjennomfører strukturerte risikovurderinger for å identifisere trusler, og bestemmer hvordan risiko skal behandles. Dette er også fasen der dere setter målbare mål for informasjonssikkerhet og personvern.',
    learningContent_en: 'The implementation phase is where theory meets practice. You create concrete policies, conduct structured risk assessments to identify threats, and determine how risks should be treated. This is also the phase where you set measurable goals for information security and privacy.',
    mynderFeatures: [
      { title_no: 'Compliance-sjekkliste', title_en: 'Compliance checklist', description_no: 'Automatisk sporing av krav og fremdrift', description_en: 'Automatic tracking of requirements and progress', route: '/compliance-checklist' },
      { title_no: 'Risikovurdering', title_en: 'Risk assessment', description_no: 'Strukturert vurdering bygget inn i systemprofilene', description_en: 'Structured assessment built into system profiles', route: '/tasks?view=readiness' },
      { title_no: 'Systemregistrering', title_en: 'System registration', description_no: 'Registrer og klassifiser alle systemer og leverandører', description_en: 'Register and classify all systems and vendors', route: '/assets' },
      { title_no: 'Lara AI-assistent', title_en: 'Lara AI assistant', description_no: 'AI-hjelp til å skrive policies og dokumentasjon', description_en: 'AI help for writing policies and documentation', route: '/resources' },
    ],
  },
  {
    id: 'operation',
    name_no: 'Drift',
    name_en: 'Operation',
    description_no: 'Implementer kontroller, dokumentasjon og opplæring',
    description_en: 'Implement controls, documentation and training',
    percentageRange: [40, 70],
    activities_no: ['Kontrollimplementering', 'Dokumentasjon', 'Awareness-trening', 'Overvåking'],
    activities_en: ['Control implementation', 'Documentation', 'Awareness training', 'Monitoring'],
    optional: false,
    whatToExpect_no: 'I driftsfasen lever og vedlikeholder dere kontrollene. Dokumentasjon holdes oppdatert, ansatte trenes, og dere overvåker at alt fungerer som det skal.',
    whatToExpect_en: 'In the operation phase you live and maintain your controls. Documentation is kept updated, employees are trained, and you monitor that everything works as intended.',
    learningContent_no: 'Drift er den kontinuerlige fasen der de fleste virksomheter befinner seg mesteparten av tiden. Her handler det om å sørge for at kontrollene som er etablert faktisk fungerer i hverdagen. Jevnlig opplæring, oppdatert dokumentasjon og aktiv overvåking er nøkkelen. Dette er ikke en \"ferdig\"-fase, men en pågående prosess for kontinuerlig forbedring.',
    learningContent_en: 'Operation is the continuous phase where most organizations spend most of their time. Here it\'s about ensuring that the controls you\'ve established actually work in day-to-day operations. Regular training, updated documentation, and active monitoring are key. This is not a \"done\" phase, but an ongoing process of continuous improvement.',
    mynderFeatures: [
      { title_no: 'Avvikshåndtering', title_en: 'Deviation management', description_no: 'Registrer, spor og lukk avvik systematisk', description_en: 'Register, track and close deviations systematically', route: '/deviations' },
      { title_no: 'Leverandøradministrasjon', title_en: 'Vendor management', description_no: 'Oversikt og risikovurdering av tredjeparter', description_en: 'Overview and risk assessment of third parties', route: '/assets' },
      { title_no: 'Rapporter', title_en: 'Reports', description_no: 'Generer compliance-rapporter for ledelsen', description_en: 'Generate compliance reports for management', route: '/reports' },
      { title_no: 'Kundeforespørsler', title_en: 'Customer requests', description_no: 'Håndter innkommende compliance-krav fra kunder', description_en: 'Handle incoming compliance requests from customers', route: '/customer-requests' },
    ],
  },
  {
    id: 'audit',
    name_no: 'Intern Audit',
    name_en: 'Internal Audit',
    description_no: 'Internrevisjon, ledelsesgjennomgang og korrigering',
    description_en: 'Internal audit, management review and corrective actions',
    percentageRange: [70, 90],
    activities_no: ['Internrevisjon', 'Ledelsesgjennomgang', 'Korrigerende tiltak', 'Forbedring'],
    activities_en: ['Internal audit', 'Management review', 'Corrective actions', 'Improvement'],
    optional: true,
    whatToExpect_no: 'Internrevisjon er valgfritt, men anbefalt for virksomheter som ønsker å verifisere at styringssystemet fungerer effektivt og identifisere forbedringsmuligheter.',
    whatToExpect_en: 'Internal audit is optional but recommended for organizations that want to verify their management system works effectively and identify improvement opportunities.',
    learningContent_no: 'En intern audit er en systematisk gjennomgang av styringssystemet utført av egne eller innleide ressurser. Formålet er å identifisere avvik, forbedringsmuligheter og bekrefte at kontrollene fungerer som tiltenkt. Ledelsesgjennomgang sikrer at ledelsen er informert og tar eierskap til compliance-prosessen.',
    learningContent_en: 'An internal audit is a systematic review of the management system performed by internal or contracted resources. The purpose is to identify non-conformities, improvement opportunities, and confirm that controls work as intended. Management review ensures that leadership is informed and takes ownership of the compliance process.',
    mynderFeatures: [
      { title_no: 'ISO Readiness', title_en: 'ISO Readiness', description_no: 'Sjekk beredskapen din for intern revisjon', description_en: 'Check your readiness for internal audit', route: '/tasks?view=readiness' },
      { title_no: 'Rapporter', title_en: 'Reports', description_no: 'Dokumentasjon til ledelsesgjennomgang', description_en: 'Documentation for management review', route: '/reports' },
    ],
  },
  {
    id: 'certification',
    name_no: 'Sertifisering',
    name_en: 'Certification',
    description_no: 'Stage 1 og Stage 2 audit, vedlikehold',
    description_en: 'Stage 1 and Stage 2 audit, maintenance',
    percentageRange: [90, 100],
    activities_no: ['Stage 1 Audit', 'Stage 2 Audit', 'Sertifikat', 'Vedlikehold'],
    activities_en: ['Stage 1 Audit', 'Stage 2 Audit', 'Certificate', 'Maintenance'],
    optional: true,
    whatToExpect_no: 'Formell sertifisering er valgfritt og krever ekstern revisjon. Mange virksomheter oppnår god compliance uten å gå gjennom formell sertifisering.',
    whatToExpect_en: 'Formal certification is optional and requires external audit. Many organizations achieve good compliance without going through formal certification.',
    learningContent_no: 'Sertifisering innebærer en uavhengig ekstern revisjon i to steg: Stage 1 (dokumentasjonsgjennomgang) og Stage 2 (implementeringsrevisjon). Et sertifikat gjelder i tre år med årlige oppfølgingsrevisjoner. Sertifisering gir markedstillit og dokumenterer overfor kunder at dere tar sikkerhet på alvor — men det er ikke et krav for god compliance.',
    learningContent_en: 'Certification involves an independent external audit in two stages: Stage 1 (documentation review) and Stage 2 (implementation audit). A certificate is valid for three years with annual surveillance audits. Certification builds market trust and demonstrates to customers that you take security seriously — but it\'s not a requirement for good compliance.',
    mynderFeatures: [
      { title_no: 'Trust Profil', title_en: 'Trust Profile', description_no: 'Del compliance-status med kunder og partnere', description_en: 'Share compliance status with customers and partners', route: '/transparency' },
      { title_no: 'Rapporter', title_en: 'Reports', description_no: 'Generer dokumentasjon for ekstern revisjon', description_en: 'Generate documentation for external audit', route: '/reports' },
    ],
  }
];

export const MATURITY_LEVELS: { level: MaturityLevel; name_no: string; name_en: string; range: [number, number] }[] = [
  { level: 'initial', name_no: 'Initial', name_en: 'Initial', range: [0, 15] },
  { level: 'defined', name_no: 'Definert', name_en: 'Defined', range: [15, 35] },
  { level: 'implemented', name_no: 'Implementert', name_en: 'Implemented', range: [35, 60] },
  { level: 'measured', name_no: 'Målt', name_en: 'Measured', range: [60, 85] },
  { level: 'optimized', name_no: 'Optimalisert', name_en: 'Optimized', range: [85, 100] },
];

export const DOMAIN_STANDARDS: Record<string, { primary: string; supporting: string[] }> = {
  privacy: { primary: 'ISO 27701 (PIMS)', supporting: ['GDPR (EU) 2016/679'] },
  security: { primary: 'ISO/IEC 27001:2022', supporting: ['ISO 27002', 'NSM'] },
  ai: { primary: 'ISO/IEC 42001 (AIMS)', supporting: ['EU AI Act (2024/1689)'] },
};

// Map each requirement to a certification phase based on its nature
export function getPhaseForRequirement(
  category: string,
  priority: string,
  slaCategory?: string
): CertificationPhase {
  if (category === 'governance' || category === 'legal') {
    if (priority === 'critical') return 'foundation';
    return 'implementation';
  }
  if (category === 'organizational') {
    if (slaCategory === 'governance') {
      if (priority === 'critical') return 'foundation';
      return 'implementation';
    }
    if (slaCategory === 'identity_access') return 'foundation';
    return 'operation';
  }
  if (category === 'people') return 'implementation';
  if (category === 'physical') return 'operation';
  if (category === 'technological') return 'operation';
  return 'implementation';
}

export function getMaturityLevel(percent: number): MaturityLevel {
  for (const m of MATURITY_LEVELS) {
    if (percent < m.range[1]) return m.level;
  }
  return 'optimized';
}

export function getPhaseStatus(
  phaseId: CertificationPhase,
  completedPercent: number
): 'completed' | 'in_progress' | 'not_started' {
  const phase = CERTIFICATION_PHASES.find(p => p.id === phaseId);
  if (!phase) return 'not_started';
  
  if (completedPercent >= phase.percentageRange[1]) return 'completed';
  if (completedPercent >= phase.percentageRange[0]) return 'in_progress';
  return 'not_started';
}
