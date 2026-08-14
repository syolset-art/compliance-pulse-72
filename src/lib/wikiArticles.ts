/**
 * Mynder Wiki — kunnskapsinnhold om hvordan plattformen fungerer.
 * Ren presentasjonsdata, brukes av /wiki.
 */

export type WikiCategory =
  | "scoring"
  | "products"
  | "core"
  | "vendors"
  | "trust"
  | "partner"
  | "ai"
  | "admin";

export interface WikiArticle {
  slug: string;
  category: WikiCategory;
  titleNb: string;
  titleEn: string;
  summaryNb: string;
  summaryEn: string;
  /** Avsnitt — kort og lesbart. */
  bodyNb: string[];
  bodyEn: string[];
  keywords: string[];
  /** Valgfri lenke inn i produktet. */
  link?: { path: string; labelNb: string; labelEn: string };
}

export const WIKI_CATEGORIES: {
  id: WikiCategory;
  labelNb: string;
  labelEn: string;
}[] = [
  { id: "scoring", labelNb: "Score og modenhet", labelEn: "Score and maturity" },
  { id: "products", labelNb: "Produkter og priser", labelEn: "Products and pricing" },
  { id: "core", labelNb: "Mynder Core", labelEn: "Mynder Core" },
  { id: "vendors", labelNb: "Leverandører", labelEn: "Vendors" },
  { id: "trust", labelNb: "Trust Center", labelEn: "Trust Center" },
  { id: "partner", labelNb: "Partner workspace", labelEn: "Partner workspace" },
  { id: "ai", labelNb: "Lara og AI", labelEn: "Lara and AI" },
  { id: "admin", labelNb: "Innstillinger og tilgang", labelEn: "Settings and access" },
];

export const WIKI_ARTICLES: WikiArticle[] = [
  {
    slug: "mynder-scoren",
    category: "scoring",
    titleNb: "Slik regnes Mynder-scoren",
    titleEn: "How the Mynder score is calculated",
    summaryNb: "Scoren er et vektet snitt av modenheten på de fem kontrollområdene.",
    summaryEn: "The score is a weighted average of maturity across the five control areas.",
    bodyNb: [
      "Mynder-scoren viser hvor godt etterlevelsen er dokumentert, ikke hvor mye arbeid som er gjort. Den bygger på modenhetsnivået (0–4) for hvert av de fem kontrollområdene.",
      "Hvert kontrollområde får sin score fra kravene som er koblet til området: krav som er besvart teller, og krav som i tillegg har verifisert bevis teller mer. Krav merket «Ikke relevant for oss» holdes utenfor beregningen.",
      "Fargene følger samme regel overalt: grønn fra 75 %, oransje mellom 50 og 74 %, rød under 50 %.",
      "Scoren oppdateres i sanntid når du endrer status på et krav, laster opp dokumentasjon eller får bevis verifisert.",
    ],
    bodyEn: [
      "The Mynder score shows how well compliance is documented, not how much work has been done. It builds on the maturity level (0–4) for each of the five control areas.",
      "Each control area gets its score from the requirements mapped to it: answered requirements count, and requirements with verified evidence count more. Requirements marked \"Not relevant\" are excluded.",
      "Colours follow the same rule everywhere: green from 75%, orange between 50 and 74%, red below 50%.",
      "The score updates in real time when you change a requirement status, upload documentation or have evidence verified.",
    ],
    keywords: ["score", "modenhet", "maturity", "poeng", "farger", "beregning"],
    link: { path: "/resources/maturity", labelNb: "Se metodikken", labelEn: "See the methodology" },
  },
  {
    slug: "kontrollomrader",
    category: "scoring",
    titleNb: "De fem kontrollområdene",
    titleEn: "The five control areas",
    summaryNb: "Styring, Drift, Identitet og tilgang, Personvern og Leverandør.",
    summaryEn: "Governance, Operations, Identity & access, Privacy and Vendor.",
    bodyNb: [
      "Alle regelverk i Mynder er kartlagt mot fem felles kontrollområder. Det gjør at du kan jobbe én gang og få uttelling i flere regelverk samtidig.",
      "Styring handler om roller, ansvar, policyer og ledelsesforankring. Drift handler om sikker drift, logging, beredskap og avvik. Identitet og tilgang handler om hvem som har tilgang til hva, og hvordan det kontrolleres.",
      "Personvern dekker behandlingsgrunnlag, behandlingsprotokoll, de registrertes rettigheter og vurderinger som DPIA. Leverandør dekker kartlegging, avtaler, oppfølging og dokumentasjon fra tredjeparter.",
      "Når du åpner et regelverk grupperes kravene automatisk under disse fem områdene.",
    ],
    bodyEn: [
      "Every regulation in Mynder is mapped to five shared control areas, so work done once counts across several frameworks.",
      "Governance covers roles, responsibilities, policies and management commitment. Operations covers secure operations, logging, continuity and deviations. Identity and access covers who has access to what, and how it is controlled.",
      "Privacy covers legal basis, records of processing, data subject rights and assessments such as DPIA. Vendor covers mapping, agreements, follow-up and third-party documentation.",
      "When you open a regulation, requirements are automatically grouped under these five areas.",
    ],
    keywords: ["kontrollområde", "domener", "styring", "drift", "personvern", "leverandør"],
    link: { path: "/resources/controls", labelNb: "Se kontrollområdene", labelEn: "See the control areas" },
  },
  {
    slug: "bevis-og-dokumentasjon",
    category: "scoring",
    titleNb: "Bevis kontra dokumentasjon",
    titleEn: "Evidence versus documentation",
    summaryNb: "Dokumentasjon er filen. Bevis er tillitsgraden filen gir.",
    summaryEn: "Documentation is the file. Evidence is the level of trust it provides.",
    bodyNb: [
      "Dokumentasjon er selve filen — en policy, en rapport, en avtale. Bevis er vurderingen av hvor mye tillit dokumentet gir til at kravet faktisk er oppfylt.",
      "Et dokument blir til bevis når det er knyttet til ett eller flere krav og vurdert. Ved verifisering bekreftes det om vurderingen er gjort av en uavhengig part, for eksempel en revisor eller en ekstern pentester.",
      "KI analyserer opplastede dokumenter og foreslår hvilke krav og artikler de dekker. Du godkjenner eller overstyrer forslaget — plattformen setter aldri bevis uten at et menneske bekrefter.",
    ],
    bodyEn: [
      "Documentation is the file itself — a policy, a report, an agreement. Evidence is the assessment of how much trust that document gives that the requirement is actually met.",
      "A document becomes evidence when it is linked to one or more requirements and assessed. During verification you confirm whether the assessment comes from an independent party, such as an auditor or an external pentester.",
      "AI analyses uploaded documents and suggests which requirements and articles they cover. You approve or override the suggestion — the platform never sets evidence without human confirmation.",
    ],
    keywords: ["bevis", "evidence", "dokumentasjon", "verifisering", "uavhengig part"],
  },
  {
    slug: "kravstatus",
    category: "scoring",
    titleNb: "Statusvalgene på et krav",
    titleEn: "Requirement statuses",
    summaryNb: "Tre statuser: oppfylt, ikke relevant eller ikke påbegynt.",
    summaryEn: "Three statuses: met, not relevant or not started.",
    bodyNb: [
      "Hvert krav har tre statuser: «Ja, dette oppfylles», «Ikke relevant for oss» og «Ikke påbegynt».",
      "Du kan alltid overstyre en autogenerert vurdering. Der agenten har fulgt opp et krav automatisk, speiles dette som oppfylt, men du kan endre det selv når som helst.",
      "«Ikke relevant for oss» tas ut av scoreberegningen, men begrunnelsen lagres slik at den kan vises i rapport og revisjon.",
    ],
    bodyEn: [
      "Each requirement has three statuses: \"Yes, this is met\", \"Not relevant for us\" and \"Not started\".",
      "You can always override an auto-generated assessment. Where the agent has followed up a requirement automatically, this is mirrored as met, but you can change it at any time.",
      "\"Not relevant for us\" is excluded from the score, but the reason is stored so it can be shown in reports and audits.",
    ],
    keywords: ["status", "krav", "oppfylt", "ikke relevant", "overstyre"],
    link: { path: "/regulations", labelNb: "Åpne regelverk", labelEn: "Open regulations" },
  },
  {
    slug: "produktoversikt",
    category: "products",
    titleNb: "Produktene i Mynder",
    titleEn: "The Mynder products",
    summaryNb: "Regelverk, meldinger og Trust Center er alltid med. Core og Leverandør er egne moduler.",
    summaryEn: "Regulations, messages and Trust Center are always included. Core and Vendor are separate modules.",
    bodyNb: [
      "Uansett hvilket produkt du har, har du tilgang til Regelverk, Meldinger og Trust Center. Det er grunnflaten i plattformen.",
      "Mynder Core er modulen for å organisere selve compliance-arbeidet: arbeidsområder, systemer, behandlingsprotokoll, avviksregister og aktiviteter.",
      "Leverandørmodulen er et eget produkt for tredjepartsoppfølging. Trust Center kan også aktiveres som eget produkt.",
      "Alle produkter aktiveres på samme måte: Aktiver → aksepter vilkår → kvittering med lenke videre. Tjenesten aktiveres umiddelbart og faktureres på neste faktura.",
    ],
    bodyEn: [
      "Whatever product you have, you always have Regulations, Messages and Trust Center. That is the platform baseline.",
      "Mynder Core is the module for organising the compliance work itself: work areas, systems, records of processing, deviations and activities.",
      "The Vendor module is a separate product for third-party follow-up. Trust Center can also be activated as its own product.",
      "All products are activated the same way: Activate → accept terms → receipt with a link onwards. The service starts immediately and is billed on the next invoice.",
    ],
    keywords: ["produkter", "moduler", "aktivere", "core", "leverandør", "trust center"],
    link: { path: "/subscriptions", labelNb: "Se produkter", labelEn: "See products" },
  },
  {
    slug: "endre-niva-og-avslutte",
    category: "products",
    titleNb: "Endre nivå og avslutte produkt",
    titleEn: "Change tier and retire a product",
    summaryNb: "Nivå følger antall enheter. Avslutning stopper fakturering, profilen beholdes.",
    summaryEn: "Tiers follow unit counts. Retiring stops billing while the profile is kept.",
    bodyNb: [
      "Nivået på et produkt følger hvor mange enheter du bruker. Leverandørmodulen har fem gratis leverandører; forsøk på nummer seks krever nivåendring. Grensen er hard, slik at du aldri ender på gratisnivå med flere enheter enn det gir rom for.",
      "Nivåendring følger samme flyt som aktivering, med vilkårssteg og kvittering.",
      "Ved avslutning stopper fakturering fra neste periode. Profilen og dataene beholdes, og du kan legge inn en e-postadresse for å få tilsendt dataene dine når nedlasting er tilgjengelig.",
    ],
    bodyEn: [
      "The tier follows how many units you use. The Vendor module includes five free vendors; adding a sixth requires a tier change. The limit is hard, so you never end up on the free tier with more units than it allows.",
      "Tier changes follow the same flow as activation, with a terms step and a receipt.",
      "When you retire a product, billing stops from the next period. The profile and data are kept, and you can leave an email address to receive your data once download is available.",
    ],
    keywords: ["nivå", "oppgradere", "avslutte", "grense", "fakturering"],
  },
  {
    slug: "arbeidsomrader",
    category: "core",
    titleNb: "Arbeidsområder — konteksten rundt systemene",
    titleEn: "Work areas — context around your systems",
    summaryNb: "Start her i Mynder Core: opprett områder, sett ansvarlig, inviter deltakere.",
    summaryEn: "Start here in Mynder Core: create areas, assign an owner, invite members.",
    bodyNb: [
      "Et arbeidsområde samler alt som hører sammen, for eksempel «Økonomi og regnskap» med regnskapssystemet, leverandøravtalene og dokumentene som gjelder området.",
      "Hvert arbeidsområde har en ansvarlig eier. Deltakere inviteres inn, og én person kan gjerne være ansvarlig for flere områder.",
      "Fordi arbeidsområdet bærer konteksten, kan Lara foreslå behandlingsaktiviteter og prosesser som passer akkurat dette området.",
    ],
    bodyEn: [
      "A work area gathers everything that belongs together, for example \"Finance and accounting\" with the accounting system, the vendor agreements and the relevant documents.",
      "Each work area has a responsible owner. Members are invited in, and one person can own several areas.",
      "Because the work area carries the context, Lara can suggest processing activities and processes that fit that specific area.",
    ],
    keywords: ["arbeidsområde", "work area", "eier", "invitere", "kontekst"],
    link: { path: "/work-areas", labelNb: "Åpne arbeidsområder", labelEn: "Open work areas" },
  },
  {
    slug: "ropa-og-behandlingsprotokoll",
    category: "core",
    titleNb: "RoPA og behandlingsprotokoll",
    titleEn: "RoPA and records of processing",
    summaryNb: "Autogenerert behandlingsaktivitet per system, samlet i én protokoll.",
    summaryEn: "Auto-generated processing activity per system, gathered in one record.",
    bodyNb: [
      "For hvert system i et arbeidsområde kan Lara generere en behandlingsaktivitet med formål, kategorier personopplysninger, behandlingsgrunnlag, mottakere og lagringstid.",
      "Du gjennomgår og justerer forslaget før det lagres. Behandlingsprotokollen viser alle behandlingsaktivitetene på tvers av arbeidsområdene, og kan eksporteres.",
    ],
    bodyEn: [
      "For each system in a work area, Lara can generate a processing activity with purpose, categories of personal data, legal basis, recipients and retention.",
      "You review and adjust the suggestion before saving. The records view shows all processing activities across work areas and can be exported.",
    ],
    keywords: ["ropa", "behandlingsprotokoll", "personopplysninger", "gdpr", "artikkel 30"],
    link: { path: "/protocols", labelNb: "Åpne behandlingsprotokoll", labelEn: "Open records" },
  },
  {
    slug: "prosesser-kritikalitet-risiko",
    category: "core",
    titleNb: "Prosesser: kritikalitet, risiko og AI-bruk",
    titleEn: "Processes: criticality, risk and AI use",
    summaryNb: "Kritikalitet velger du. Risiko utledes av Lara fra dataene.",
    summaryEn: "You choose criticality. Risk is derived by Lara from your data.",
    bodyNb: [
      "Kritikalitet er ditt eget valg og vises som en nøytral pille: hvor alvorlig er det hvis opplysninger kommer på avveie, innhold blir feil, eller systemet er nede.",
      "Risiko er noe annet: den utledes av Lara fra registrerte data — kritikalitet, dokumentasjon, avvik, leverandørens modenhet — og vises med statusfarge og forklaring.",
      "For hver prosess vurderes også bruk av AI: om prosessen involverer AI-systemer, og hva det innebærer av dokumentasjonskrav.",
    ],
    bodyEn: [
      "Criticality is your own choice and shows as a neutral pill: how serious is it if data leaks, content becomes wrong, or the system goes down.",
      "Risk is different: Lara derives it from registered data — criticality, documentation, deviations, vendor maturity — and shows it with a status colour and an explanation.",
      "Each process is also assessed for AI use: whether it involves AI systems, and what documentation that requires.",
    ],
    keywords: ["prosess", "kritikalitet", "risiko", "ai", "dpia", "ros"],
  },
  {
    slug: "avvik-og-aktiviteter",
    category: "core",
    titleNb: "Avviksregister og aktiviteter",
    titleEn: "Deviations and activities",
    summaryNb: "Avvik kobles til system eller leverandør. Aktiviteter er oppgavene deres.",
    summaryEn: "Deviations link to a system or vendor. Activities are your tasks.",
    bodyNb: [
      "Avvik registreres med hendelse, alvorlighet, tilknyttet system eller leverandør og ansvarlig, og følges til lukking. Åpne avvik påvirker risikobildet.",
      "Aktiviteter er plattformens oppgaver. Du kan opprette egne — for eksempel DPIA eller ROS — med ansvarlig, deltakere, frist og prioritet fra 0 (kritisk) til 3 (lav).",
      "På sikt kobles aktiviteter til modenhetsvurderingen, slik at plattformen kan foreslå oppgavene som faktisk løfter scoren på et kontrollområde.",
    ],
    bodyEn: [
      "Deviations are registered with the event, severity, related system or vendor and an owner, and followed to closure. Open deviations affect the risk picture.",
      "Activities are the platform's tasks. You can create your own — for example DPIA or risk assessment — with an owner, participants, due date and priority from 0 (critical) to 3 (low).",
      "Over time, activities will link to the maturity assessment so the platform can suggest the tasks that actually raise the score in a control area.",
    ],
    keywords: ["avvik", "deviation", "oppgave", "aktivitet", "dpia", "prioritet"],
    link: { path: "/tasks", labelNb: "Åpne aktiviteter", labelEn: "Open activities" },
  },
  {
    slug: "leverandorprofil",
    category: "vendors",
    titleNb: "Leverandørprofilen",
    titleEn: "The vendor profile",
    summaryNb: "Regelverk, bruk og kontekst, dokumentasjon og forespørsler på én profil.",
    summaryEn: "Regulations, usage and context, documentation and requests in one profile.",
    bodyNb: [
      "Leverandørprofilen viser hvilke regelverk leverandøren er lovpålagt å følge og hvilke som er anbefalt. Du kan legge til flere, og Lara gir en initiell vurdering.",
      "Under «Bruk og kontekst» registrerer du kritikalitet, prioritet og GDPR-rolle, og beskriver prosessene som bruker leverandøren.",
      "Under «Dokumentasjon» laster du opp interne dokumenter og ser eksterne dokumenter leverandøren har sendt — for eksempel en pentestrapport — som du kan godkjenne.",
      "Under «Forespørsler» ser du meldinger mottatt fra leverandøren. Aktivitetsloggen på profilen viser alt som er gjort.",
    ],
    bodyEn: [
      "The vendor profile shows which regulations the vendor is legally required to follow and which are recommended. You can add more, and Lara gives an initial assessment.",
      "Under \"Usage and context\" you register criticality, priority and GDPR role, and describe the processes that use the vendor.",
      "Under \"Documentation\" you upload internal documents and see external documents the vendor has sent — such as a pentest report — which you can approve.",
      "Under \"Requests\" you see messages received from the vendor. The activity log on the profile shows everything that has happened.",
    ],
    keywords: ["leverandør", "vendor", "dokumentasjon", "pentest", "gdpr-rolle", "prioritet"],
    link: { path: "/vendors", labelNb: "Åpne leverandører", labelEn: "Open vendors" },
  },
  {
    slug: "innhenting-fra-leverandor",
    category: "vendors",
    titleNb: "Innhenting av grunnlag fra leverandør",
    titleEn: "Collecting evidence from a vendor",
    summaryNb: "Lara anbefaler metode per leverandør ut fra signalene hun allerede har.",
    summaryEn: "Lara recommends a method per vendor based on the signals she already has.",
    bodyNb: [
      "Når en leverandør er nylig lagt til og det ikke finnes informasjon, er første steg å be om grunnlag.",
      "Lara anbefaler innhentingsmetode per leverandør: invitere til agentisk Trust Profile, be om spesifikke dokumenter, hente fra offentlig informasjon, eller registrere manuelt.",
      "I stedet for å be om alt på én gang oppretter du en aktivitet, og velger hva som skal innhentes og av hvem.",
    ],
    bodyEn: [
      "When a vendor is newly added and there is no information, the first step is to ask for a basis.",
      "Lara recommends a collection method per vendor: invite to an agentic Trust Profile, request specific documents, gather from public information, or register manually.",
      "Instead of asking for everything at once, you create an activity and choose what to collect and from whom.",
    ],
    keywords: ["innhenting", "trust profile", "invitasjon", "aktivitet", "grunnlag"],
  },
  {
    slug: "trust-center-slik-virker-det",
    category: "trust",
    titleNb: "Slik virker Trust Center",
    titleEn: "How Trust Center works",
    summaryNb: "Vis compliance utad og del dokumentasjon kontrollert.",
    summaryEn: "Show compliance externally and share documentation in a controlled way.",
    bodyNb: [
      "Trust Center er utsiden av arbeidet ditt: en profil som viser organisasjon, tjenester, sertifiseringer og dokumentasjon.",
      "Du bestemmer hva som er offentlig og hva som deles via lenke. Delte lenker kan ha utløp, og du ser hvem som har åpnet dem.",
      "Masterdokumenter lastes opp én gang og gjenbrukes på tvers av profiler og delinger, med versjonshistorikk.",
    ],
    bodyEn: [
      "Trust Center is the outward face of your work: a profile showing organisation, services, certifications and documentation.",
      "You decide what is public and what is shared via link. Shared links can expire, and you can see who opened them.",
      "Master documents are uploaded once and reused across profiles and shares, with version history.",
    ],
    keywords: ["trust center", "deling", "offentlig", "dokumenter", "profil"],
    link: { path: "/trust-center/profile", labelNb: "Åpne Trust Center", labelEn: "Open Trust Center" },
  },
  {
    slug: "partner-workspace",
    category: "partner",
    titleNb: "Slik fungerer partner workspace",
    titleEn: "How the partner workspace works",
    summaryNb: "Egen modus for partnere som følger opp flere kunder.",
    summaryEn: "A separate mode for partners managing several customers.",
    bodyNb: [
      "Partner workspace er en egen modus i plattformen. Når du bytter til partnermodus får du kundeoversikt, muligheter, tilbud, produkter og tjenester, lisenser og fakturagrunnlag — og virksomhetsinnstillingene for din egen organisasjon skjules.",
      "Hver kunde har et kundekort med lovpålagte og anbefalte regelverk, anbefalte produkter og tjenester, modenhetsspeil per kontrollområde og neste anbefalte tiltak.",
      "For å jobbe operativt i en kundes data må du gå inn i kundens organisasjon. Plattformen spør om dette eksplisitt, og viser en kontekstlinje så lenge du er inne hos kunden.",
      "Team og tilgang styres i partnerinnstillingene: medlemmer kan ha roller som kundeansvarlig og driftspartner, med lese- eller skrivetilgang for én kunde eller alle.",
    ],
    bodyEn: [
      "The partner workspace is a separate mode. Switching to partner mode gives you the customer overview, opportunities, offers, products and services, licences and invoice basis — and hides company settings for your own organisation.",
      "Each customer has a card with mandatory and recommended regulations, recommended products and services, a maturity mirror per control area and the next recommended action.",
      "To work operationally in a customer's data you enter the customer's organisation. The platform asks explicitly and shows a context bar while you are inside.",
      "Team and access are managed in partner settings: members can hold roles such as account manager and operations partner, with read or write access for one customer or all.",
    ],
    keywords: ["partner", "msp", "workspace", "kunder", "modus", "driftspartner"],
    link: { path: "/msp-partner", labelNb: "Åpne partner-dashbord", labelEn: "Open partner dashboard" },
  },
  {
    slug: "behovsanalyse-og-tilbud",
    category: "partner",
    titleNb: "Behovsanalyse og tilbud",
    titleEn: "Needs analysis and offers",
    summaryNb: "Finn kunder som matcher regelverk, og gå fra anbefaling til tilbud.",
    summaryEn: "Find customers matching regulations, and go from recommendation to offer.",
    bodyNb: [
      "Behovsanalysen finner kundene som matcher utvalgte regelverk, beregner salgspotensial ut fra kravene som mangler, og lar deg lage tilbud til flere kunder samtidig.",
      "Tjenestekatalogen din står alltid øverst. Mynder-produkter kan videreselges med fast provisjon og valgfritt etableringsgebyr, og ligger i en egen del du kan åpne ved behov.",
      "Hver tjeneste viser hvilke krav den dekker og hvilken rolle den har: direkte tiltak, muliggjørende, dokumenterende eller vurderende. KI-forslag kan alltid overstyres manuelt.",
    ],
    bodyEn: [
      "The needs analysis finds customers matching selected regulations, calculates sales potential from the missing requirements, and lets you create offers for several customers at once.",
      "Your own service catalogue is always on top. Mynder products can be resold with a fixed commission and an optional setup fee, and sit in a separate section you can expand.",
      "Each service shows which requirements it covers and its role: direct control, enabling, documenting or assessing. AI suggestions can always be overridden manually.",
    ],
    keywords: ["behovsanalyse", "tilbud", "provisjon", "tjenestekatalog", "salgspotensial"],
  },
  {
    slug: "lara-autonomi",
    category: "ai",
    titleNb: "Laras tre autonominivåer",
    titleEn: "Lara's three levels of autonomy",
    summaryNb: "Automatisk, assistert og manuell — du bestemmer hvor mye Lara gjør selv.",
    summaryEn: "Automatic, assisted and manual — you decide how much Lara does alone.",
    bodyNb: [
      "På automatisk nivå utfører Lara oppgaver selv og logger hva hun har gjort, for eksempel å hente offentlig informasjon om en leverandør.",
      "På assistert nivå forbereder hun forslaget og venter på deg. Godkjenning skjer aldri med ett klikk fra dashbordet — du får et gjennomgangsvindu som viser grunnlaget før du bekrefter.",
      "På manuelt nivå gjør Lara ingenting av seg selv, men er tilgjengelig når du ber om hjelp.",
    ],
    bodyEn: [
      "At the automatic level, Lara performs tasks herself and logs what she did, for example gathering public information about a vendor.",
      "At the assisted level she prepares the suggestion and waits for you. Approval never happens with a single click from the dashboard — you get a review window showing the basis before you confirm.",
      "At the manual level Lara does nothing on her own, but is available when you ask for help.",
    ],
    keywords: ["lara", "ai", "autonomi", "godkjenning", "arbeidskø"],
  },
  {
    slug: "koble-pa-kilder",
    category: "ai",
    titleNb: "Koble på egne kilder",
    titleEn: "Connect your own sources",
    summaryNb: "Integrasjoner og MCP gir Lara datagrunnlaget hun trenger.",
    summaryEn: "Integrations and MCP give Lara the data she needs.",
    bodyNb: [
      "Der data mangler foreslår plattformen å koble på en kilde. Da kan Lara oppdage systemer automatisk i stedet for at du registrerer dem manuelt.",
      "Integrasjoner settes opp i innstillingene. MCP-koblinger lar agenter hente og levere data på en kontrollert måte.",
      "Alt som hentes automatisk merkes tydelig, og du kan alltid se og overstyre grunnlaget.",
    ],
    bodyEn: [
      "Where data is missing, the platform suggests connecting a source. Lara can then discover systems automatically instead of you registering them manually.",
      "Integrations are set up in settings. MCP connections let agents fetch and deliver data in a controlled way.",
      "Anything gathered automatically is clearly marked, and you can always inspect and override the basis.",
    ],
    keywords: ["integrasjon", "mcp", "microsoft", "acronis", "oppdag systemer"],
    link: { path: "/settings/integrations", labelNb: "Åpne integrasjoner", labelEn: "Open integrations" },
  },
  {
    slug: "roller-og-tilgang",
    category: "admin",
    titleNb: "Roller og tilgangsstyring",
    titleEn: "Roles and access management",
    summaryNb: "Inviter brukere, gi nøkkelroller og styr lese- eller skrivetilgang.",
    summaryEn: "Invite users, assign key roles and control read or write access.",
    bodyNb: [
      "Brukere inviteres på e-post og får en eller flere nøkkelroller: daglig leder, personvernombud, sikkerhetsansvarlig, compliance-ansvarlig, AI-governance eller operativ bruker.",
      "Tilgang settes som lese eller skrive, og kan avgrenses til bestemte arbeidsområder eller kunder.",
      "Hver bruker har en profil som viser aktiviteter og hva de jobber med. Brukere kan også fjernes helt.",
    ],
    bodyEn: [
      "Users are invited by email and given one or more key roles: managing director, data protection officer, security officer, compliance lead, AI governance or operational user.",
      "Access is set as read or write, and can be scoped to specific work areas or customers.",
      "Each user has a profile showing activities and what they work on. Users can also be removed entirely.",
    ],
    keywords: ["roller", "tilgang", "invitere", "dpo", "ciso", "fjerne bruker"],
    link: { path: "/admin/access", labelNb: "Åpne tilgangsstyring", labelEn: "Open access management" },
  },
  {
    slug: "avtaler-og-aktivitetslogg",
    category: "admin",
    titleNb: "Avtaler, vilkår og aktivitetslogg",
    titleEn: "Agreements, terms and the activity log",
    summaryNb: "Alt som aksepteres logges, og alt som gjøres kan spores.",
    summaryEn: "Everything accepted is logged, and everything done can be traced.",
    bodyNb: [
      "Vilkår, personvernerklæring og databehandleravtale ligger hver for seg, med versjon og akseptlogg. Du ser hva du har akseptert og når.",
      "Ved aktivering og nivåendring må vilkårene aksepteres på nytt hvis de er endret.",
      "Aktivitetsloggen viser hvem som gjorde hva og når — både mennesker, agenten og systemet — på tvers av moduler.",
    ],
    bodyEn: [
      "Terms, privacy policy and the data processing agreement are kept separately, with versions and an acceptance log. You can see what you accepted and when.",
      "On activation and tier changes, terms must be accepted again if they have changed.",
      "The activity log shows who did what and when — people, the agent and the system — across modules.",
    ],
    keywords: ["vilkår", "avtaler", "databehandleravtale", "aktivitetslogg", "akseptlogg"],
    link: { path: "/activity-log", labelNb: "Åpne aktivitetslogg", labelEn: "Open activity log" },
  },
];

export function searchWikiArticles(query: string, articles = WIKI_ARTICLES): WikiArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  const terms = q.split(/\s+/);
  return articles.filter((a) => {
    const haystack = [
      a.titleNb, a.titleEn, a.summaryNb, a.summaryEn,
      ...a.bodyNb, ...a.bodyEn, ...a.keywords,
    ].join(" ").toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
