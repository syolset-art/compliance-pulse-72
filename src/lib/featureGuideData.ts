// Feature guide content for /resources/features/:slug pages

export interface FeatureGuideStep {
  title_no: string;
  title_en: string;
  description_no: string;
  description_en: string;
  illustrationKey: string; // maps to generated illustration
}

export interface FeatureGuide {
  slug: string;
  title_no: string;
  title_en: string;
  subtitle_no: string;
  subtitle_en: string;
  intro_no: string;
  intro_en: string;
  whereInApp_no: string;
  whereInApp_en: string;
  route: string; // actual tool route
  steps: FeatureGuideStep[];
}

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    slug: "onboarding",
    title_no: "Onboarding-veiviseren",
    title_en: "Onboarding Wizard",
    subtitle_no: "Kom i gang med compliance på 10 minutter",
    subtitle_en: "Get started with compliance in 10 minutes",
    intro_no: "Onboarding-veiviseren guider deg gjennom de første stegene: registrere virksomhetsinformasjon, velge relevante regelverk, og sette opp arbeidsområder. Mynder bruker denne informasjonen til å tilpasse hele plattformen til din virksomhet.",
    intro_en: "The onboarding wizard guides you through the first steps: registering business information, choosing relevant frameworks, and setting up work areas. Mynder uses this information to customize the entire platform for your organization.",
    whereInApp_no: "Du finner veiviseren under Oppsett → Onboarding, eller den startes automatisk første gang du logger inn.",
    whereInApp_en: "You'll find the wizard under Setup → Onboarding, or it starts automatically on first login.",
    route: "/onboarding",
    steps: [
      { title_no: "Registrer virksomheten", title_en: "Register your business", description_no: "Fyll inn org.nummer, bransje og antall ansatte. Mynder henter automatisk data fra Brønnøysundregistrene.", description_en: "Enter org number, industry and employee count. Mynder fetches data automatically from public registries.", illustrationKey: "onboarding-register" },
      { title_no: "Velg regelverk", title_en: "Choose frameworks", description_no: "Velg hvilke standarder og lover som gjelder for din virksomhet, f.eks. GDPR, ISO 27001, NIS2 eller AI Act.", description_en: "Select which standards and laws apply to your organization, e.g. GDPR, ISO 27001, NIS2 or AI Act.", illustrationKey: "onboarding-frameworks" },
      { title_no: "Definer arbeidsområder", title_en: "Define work areas", description_no: "Opprett avdelinger eller tjenesteområder og tildel ansvarlige personer. Dette danner grunnlaget for rollefordelingen.", description_en: "Create departments or service areas and assign responsible persons. This forms the basis for role assignment.", illustrationKey: "onboarding-workareas" },
    ],
  },
  {
    slug: "gap-analysis",
    title_no: "Gap-analyse",
    title_en: "Gap Analysis",
    subtitle_no: "Finn ut hva som mangler i compliance-arbeidet",
    subtitle_en: "Find out what's missing in your compliance work",
    intro_no: "Gap-analysen sammenligner din nåværende praksis mot kravene i de valgte regelverkene. Mynder kjører denne analysen automatisk og gir deg en prioritert liste over hva som mangler — slik at du vet nøyaktig hvor du bør starte.",
    intro_en: "The gap analysis compares your current practices against the requirements of your chosen frameworks. Mynder runs this analysis automatically and gives you a prioritized list of what's missing — so you know exactly where to start.",
    whereInApp_no: "Gap-analysen vises i Compliance-sjekklisten. Her ser du alle krav gruppert etter område, med status for hvert enkelt.",
    whereInApp_en: "The gap analysis is shown in the Compliance Checklist. Here you see all requirements grouped by area, with status for each one.",
    route: "/compliance-checklist",
    steps: [
      { title_no: "Automatisk kravkartlegging", title_en: "Automatic requirement mapping", description_no: "Basert på regelverkene du har valgt, genererer Mynder en komplett sjekkliste med alle relevante krav.", description_en: "Based on your chosen frameworks, Mynder generates a complete checklist of all relevant requirements.", illustrationKey: "gap-checklist" },
      { title_no: "Prioritert gap-liste", title_en: "Prioritized gap list", description_no: "Kravene som mangler mest arbeid vises først, gruppert etter kritikalitet og område.", description_en: "Requirements that need the most work are shown first, grouped by criticality and area.", illustrationKey: "gap-priority" },
      { title_no: "Fremdriftssporing", title_en: "Progress tracking", description_no: "Se din totale compliance-prosent og hvordan den utvikler seg over tid. Hver handling du gjør oppdaterer fremdriften automatisk.", description_en: "See your total compliance percentage and how it evolves over time. Each action you take updates progress automatically.", illustrationKey: "gap-progress" },
    ],
  },
  {
    slug: "risk-assessment",
    title_no: "Risikovurdering",
    title_en: "Risk Assessment",
    subtitle_no: "Strukturert risikohåndtering for hvert system",
    subtitle_en: "Structured risk management for each system",
    intro_no: "Risikovurdering i Mynder er bygget inn i hver systemprofil (Trust Profil). Du vurderer trusler og sårbarheter direkte der systemet er registrert, og velger tiltak for å redusere risikoen. Alt dokumenteres automatisk.",
    intro_en: "Risk assessment in Mynder is built into each system profile (Trust Profile). You assess threats and vulnerabilities directly where the system is registered, and choose measures to reduce risk. Everything is documented automatically.",
    whereInApp_no: "Gå til Systemer → velg et system → fanen «Revisjon og risiko». Her finner du risikovurderingen med score, distribusjon og historikk.",
    whereInApp_en: "Go to Systems → select a system → the 'Risk management' tab. Here you'll find the risk assessment with score, distribution and history.",
    route: "/assets",
    steps: [
      { title_no: "Systemprofil med risiko-fane", title_en: "System profile with risk tab", description_no: "Hver systemprofil har en dedikert fane for risikostyring. Her vises en visuell risiko-score, neste gjennomgang-dato og vurderingsnotater.", description_en: "Each system profile has a dedicated tab for risk management. Here you see a visual risk score, next review date, and assessment notes.", illustrationKey: "risk-system-tab" },
      { title_no: "Risikodistribusjon", title_en: "Risk distribution", description_no: "Se hvordan risikoen fordeler seg på tvers av ulike områder som konfidensialitet, integritet og tilgjengelighet.", description_en: "See how risk is distributed across different areas like confidentiality, integrity and availability.", illustrationKey: "risk-distribution" },
      { title_no: "Vurderingshistorikk", title_en: "Assessment history", description_no: "Alle risikovurderinger lagres over tid, slik at du kan spore forbedringer og dokumentere overfor revisorer.", description_en: "All risk assessments are stored over time, so you can track improvements and document for auditors.", illustrationKey: "risk-history" },
    ],
  },
  {
    slug: "roles",
    title_no: "Roller og ansvar",
    title_en: "Roles and Responsibilities",
    subtitle_no: "Tydelig ansvarsfordeling for compliance",
    subtitle_en: "Clear responsibility assignment for compliance",
    intro_no: "I Mynder definerer du arbeidsområder (avdelinger, tjenester) og kobler dem til ansvarlige personer. Dette sikrer at alle vet hvem som har ansvar for hva — et grunnkrav i alle compliance-rammeverk.",
    intro_en: "In Mynder you define work areas (departments, services) and link them to responsible persons. This ensures everyone knows who is responsible for what — a fundamental requirement in all compliance frameworks.",
    whereInApp_no: "Arbeidsområder finner du under Arbeidsområder i sidemenyen. Her oppretter du områder og tildeler ansvarlige.",
    whereInApp_en: "Work areas are found under Work Areas in the sidebar. Here you create areas and assign responsible persons.",
    route: "/work-areas",
    steps: [
      { title_no: "Opprett arbeidsområder", title_en: "Create work areas", description_no: "Definer avdelinger, tjenester eller prosjekter som har ulike compliance-behov.", description_en: "Define departments, services or projects with different compliance needs.", illustrationKey: "roles-areas" },
      { title_no: "Tildel ansvarlige", title_en: "Assign responsible persons", description_no: "Koble personer til hvert område med tydelige roller som systemeier, personvernombud eller compliance-ansvarlig.", description_en: "Link persons to each area with clear roles like system owner, DPO or compliance officer.", illustrationKey: "roles-assign" },
    ],
  },
  {
    slug: "system-registration",
    title_no: "Systemregistrering",
    title_en: "System Registration",
    subtitle_no: "Komplett oversikt over alle systemer og leverandører",
    subtitle_en: "Complete overview of all systems and vendors",
    intro_no: "Registrer alle IT-systemer, tjenester og leverandører som brukes i virksomheten. Mynder oppretter automatisk en Trust Profil for hvert system med faner for dokumenter, datahåndtering, risiko og mer.",
    intro_en: "Register all IT systems, services and vendors used by the organization. Mynder automatically creates a Trust Profile for each system with tabs for documents, data handling, risk and more.",
    whereInApp_no: "Gå til Systemer i sidemenyen. Her ser du alle registrerte systemer og kan legge til nye.",
    whereInApp_en: "Go to Systems in the sidebar. Here you see all registered systems and can add new ones.",
    route: "/assets",
    steps: [
      { title_no: "Legg til system", title_en: "Add system", description_no: "Registrer systemet med navn, leverandør, kategori og formål. Mynder kan automatisk klassifisere basert på leverandørinformasjon.", description_en: "Register the system with name, vendor, category and purpose. Mynder can automatically classify based on vendor information.", illustrationKey: "system-add" },
      { title_no: "Trust Profil", title_en: "Trust Profile", description_no: "Hvert system får en komplett profil med faner for dokumenter, sertifikater, datahåndtering og risikovurdering.", description_en: "Each system gets a complete profile with tabs for documents, certificates, data handling and risk assessment.", illustrationKey: "system-profile" },
    ],
  },
  {
    slug: "compliance-checklist",
    title_no: "Compliance-sjekkliste",
    title_en: "Compliance Checklist",
    subtitle_no: "Automatisk sporing av alle krav",
    subtitle_en: "Automatic tracking of all requirements",
    intro_no: "Compliance-sjekklisten gir deg en komplett oversikt over alle krav fra dine valgte rammeverk, med automatisk fremdriftssporing og prioritering.",
    intro_en: "The compliance checklist gives you a complete overview of all requirements from your chosen frameworks, with automatic progress tracking and prioritization.",
    whereInApp_no: "Du finner sjekklisten under Compliance-sjekkliste i sidemenyen.",
    whereInApp_en: "You'll find the checklist under Compliance Checklist in the sidebar.",
    route: "/compliance-checklist",
    steps: [
      { title_no: "Oversikt over krav", title_en: "Requirements overview", description_no: "Se alle krav gruppert etter domene og kategori, med visuell fremdrift for hvert område.", description_en: "See all requirements grouped by domain and category, with visual progress for each area.", illustrationKey: "checklist-overview" },
      { title_no: "Automatisk sporing", title_en: "Automatic tracking", description_no: "Når du gjør handlinger i Mynder — som å registrere systemer eller laste opp dokumenter — oppdateres sjekklisten automatisk.", description_en: "When you take actions in Mynder — like registering systems or uploading documents — the checklist updates automatically.", illustrationKey: "checklist-tracking" },
    ],
  },
  {
    slug: "lara-ai",
    title_no: "Lara AI-assistent",
    title_en: "Lara AI Assistant",
    subtitle_no: "AI-hjelp til dokumenter, analyser og utkast",
    subtitle_en: "AI help for documents, analysis and drafts",
    intro_no: "Lara er Mynders innebygde AI-assistent. Hun kan hjelpe deg å skrive policy-utkast, analysere opplastede dokumenter, foreslå forbedringer og svare på spørsmål om compliance.",
    intro_en: "Lara is Mynder's built-in AI assistant. She can help you write policy drafts, analyze uploaded documents, suggest improvements and answer compliance questions.",
    whereInApp_no: "Lara er alltid tilgjengelig via chat-panelet til høyre i vinduet, uansett hvor du er i appen.",
    whereInApp_en: "Lara is always available via the chat panel on the right side of the window, wherever you are in the app.",
    route: "/resources",
    steps: [
      { title_no: "Skriv policy-utkast", title_en: "Write policy drafts", description_no: "Be Lara om å generere utkast til retningslinjer tilpasset din virksomhet og bransje.", description_en: "Ask Lara to generate policy drafts tailored to your organization and industry.", illustrationKey: "lara-draft" },
      { title_no: "Analyser dokumenter", title_en: "Analyze documents", description_no: "Last opp eksisterende dokumenter og la Lara analysere dem mot kravene i dine valgte rammeverk.", description_en: "Upload existing documents and let Lara analyze them against the requirements in your chosen frameworks.", illustrationKey: "lara-analyze" },
    ],
  },
  {
    slug: "deviation-management",
    title_no: "Avvikshåndtering",
    title_en: "Deviation Management",
    subtitle_no: "Registrer, spor og lukk avvik systematisk",
    subtitle_en: "Register, track and close deviations systematically",
    intro_no: "Avvikshåndtering lar deg registrere hendelser og avvik fra prosedyrer, klassifisere dem etter alvorlighetsgrad, og følge opp med korrigerende tiltak til de er lukket.",
    intro_en: "Deviation management lets you register incidents and deviations from procedures, classify them by severity, and follow up with corrective actions until they're closed.",
    whereInApp_no: "Gå til Avvik i sidemenyen for å se alle registrerte avvik og opprette nye.",
    whereInApp_en: "Go to Deviations in the sidebar to see all registered deviations and create new ones.",
    route: "/deviations",
    steps: [
      { title_no: "Registrer avvik", title_en: "Register deviation", description_no: "Opprett et nytt avvik med beskrivelse, kategori og alvorlighetsgrad.", description_en: "Create a new deviation with description, category and severity.", illustrationKey: "deviation-register" },
      { title_no: "Følg opp og lukk", title_en: "Follow up and close", description_no: "Definer korrigerende tiltak, sett frister og marker avvik som lukket når de er håndtert.", description_en: "Define corrective actions, set deadlines and mark deviations as closed when handled.", illustrationKey: "deviation-close" },
    ],
  },
  {
    slug: "vendor-management",
    title_no: "Leverandøradministrasjon",
    title_en: "Vendor Management",
    subtitle_no: "Oversikt og risikovurdering av tredjeparter",
    subtitle_en: "Overview and risk assessment of third parties",
    intro_no: "Hold oversikt over alle leverandører, vurder risikoen de utgjør, og be om compliance-dokumentasjon direkte gjennom Mynder.",
    intro_en: "Keep track of all vendors, assess the risk they pose, and request compliance documentation directly through Mynder.",
    whereInApp_no: "Leverandører registreres under Systemer. Bruk Trust Profil-visningen for å se og administrere hver leverandør.",
    whereInApp_en: "Vendors are registered under Systems. Use the Trust Profile view to see and manage each vendor.",
    route: "/assets",
    steps: [
      { title_no: "Leverandøroversikt", title_en: "Vendor overview", description_no: "Se alle leverandører med risiko-score, compliance-status og siste aktivitet.", description_en: "See all vendors with risk score, compliance status and latest activity.", illustrationKey: "vendor-overview" },
      { title_no: "Be om dokumentasjon", title_en: "Request documentation", description_no: "Send forespørsler om oppdaterte sertifikater, databehandleravtaler og sikkerhetsdokumentasjon.", description_en: "Send requests for updated certificates, data processing agreements and security documentation.", illustrationKey: "vendor-request" },
    ],
  },
  {
    slug: "reports",
    title_no: "Rapporter",
    title_en: "Reports",
    subtitle_no: "Generer compliance-rapporter for ledelsen",
    subtitle_en: "Generate compliance reports for management",
    intro_no: "Generer rapporter som gir ledelsen oversikt over compliance-status, risikonivåer og fremdrift. Rapportene kan brukes til ledelsesgjennomgang og som dokumentasjon overfor revisorer.",
    intro_en: "Generate reports that give management an overview of compliance status, risk levels and progress. Reports can be used for management review and as documentation for auditors.",
    whereInApp_no: "Gå til Rapporter i sidemenyen for å generere og laste ned rapporter.",
    whereInApp_en: "Go to Reports in the sidebar to generate and download reports.",
    route: "/reports",
    steps: [
      { title_no: "Velg rapporttype", title_en: "Choose report type", description_no: "Velg mellom ledelses-rapport, ROPA, risikorapport eller AI Act-rapport.", description_en: "Choose between management report, ROPA, risk report or AI Act report.", illustrationKey: "reports-choose" },
      { title_no: "Last ned eller del", title_en: "Download or share", description_no: "Generer rapporten som PDF og del den med ledelsen eller eksterne revisorer.", description_en: "Generate the report as PDF and share it with management or external auditors.", illustrationKey: "reports-download" },
    ],
  },
  {
    slug: "trust-profile",
    title_no: "Trust Profil",
    title_en: "Trust Profile",
    subtitle_no: "Del compliance-status med kunder og partnere",
    subtitle_en: "Share compliance status with customers and partners",
    intro_no: "Trust Profilen er din virksomhets compliance-visittkort. Den viser sertifiseringer, dokumenter og compliance-status til kunder og partnere — med granulær kontroll over hva som deles.",
    intro_en: "The Trust Profile is your organization's compliance business card. It shows certifications, documents and compliance status to customers and partners — with granular control over what's shared.",
    whereInApp_no: "Gå til Transparens i sidemenyen for å se og administrere din offentlige Trust Profil.",
    whereInApp_en: "Go to Transparency in the sidebar to view and manage your public Trust Profile.",
    route: "/transparency",
    steps: [
      { title_no: "Publiseringsinnstillinger", title_en: "Publishing settings", description_no: "Velg hvilke dokumenter, sertifikater og statusopplysninger som skal være synlige for kunder.", description_en: "Choose which documents, certificates and status information should be visible to customers.", illustrationKey: "trust-publish" },
      { title_no: "Del med kunder", title_en: "Share with customers", description_no: "Send Trust Profil-lenken til kunder som etterspør compliance-dokumentasjon.", description_en: "Send the Trust Profile link to customers requesting compliance documentation.", illustrationKey: "trust-share" },
    ],
  },
  {
    slug: "iso-readiness",
    title_no: "ISO Readiness",
    title_en: "ISO Readiness",
    subtitle_no: "Sjekk beredskapen for sertifisering",
    subtitle_en: "Check your certification readiness",
    intro_no: "ISO Readiness gir deg en strukturert oversikt over hvor klar virksomheten er for en formell sertifiseringsrevisjon. Den identifiserer mangler og gir konkrete anbefalinger.",
    intro_en: "ISO Readiness gives you a structured overview of how ready your organization is for a formal certification audit. It identifies gaps and provides concrete recommendations.",
    whereInApp_no: "Gå til Oppgaver → ISO Readiness for å se din sertifiseringsberedskap.",
    whereInApp_en: "Go to Tasks → ISO Readiness to see your certification readiness.",
    route: "/tasks?view=readiness",
    steps: [
      { title_no: "Beredskapssjekk", title_en: "Readiness check", description_no: "Se en prosentvis score for hvor klar du er, fordelt på ulike domener og kravområder.", description_en: "See a percentage score for how ready you are, broken down by different domains and requirement areas.", illustrationKey: "iso-readiness" },
    ],
  },
  {
    slug: "customer-requests",
    title_no: "Kundeforespørsler",
    title_en: "Customer Requests",
    subtitle_no: "Håndter compliance-krav fra kunder",
    subtitle_en: "Handle compliance requests from customers",
    intro_no: "Når kunder sender compliance-forespørsler kan du håndtere dem direkte i Mynder. Del dokumenter, sertifikater og statusrapporter uten å forlate plattformen.",
    intro_en: "When customers send compliance requests you can handle them directly in Mynder. Share documents, certificates and status reports without leaving the platform.",
    whereInApp_no: "Gå til Kundeforespørsler i sidemenyen for å se og svare på innkommende forespørsler.",
    whereInApp_en: "Go to Customer Requests in the sidebar to view and respond to incoming requests.",
    route: "/customer-requests",
    steps: [
      { title_no: "Motta forespørsler", title_en: "Receive requests", description_no: "Se alle innkommende compliance-forespørsler fra kunder med prioritet og frist.", description_en: "See all incoming compliance requests from customers with priority and deadline.", illustrationKey: "requests-inbox" },
      { title_no: "Svar med dokumentasjon", title_en: "Respond with documentation", description_no: "Koble relevant dokumentasjon og del den direkte med kunden.", description_en: "Link relevant documentation and share it directly with the customer.", illustrationKey: "requests-respond" },
    ],
  },
];

export function getFeatureGuide(slug: string): FeatureGuide | undefined {
  return FEATURE_GUIDES.find(g => g.slug === slug);
}
