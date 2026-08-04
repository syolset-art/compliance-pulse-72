/**
 * Mockdata for partnerens "muligheter" — mulig arbeid hos kundene.
 * Ingen kronebeløp noe sted. Omfang oppgis grovt som liten/middels/stor.
 */

export type OpportunityScope = "liten" | "middels" | "stor";

export const SCOPE_LABEL: Record<OpportunityScope, string> = {
  liten: "Lite omfang",
  middels: "Middels omfang",
  stor: "Stort omfang",
};

export interface OpportunityTask {
  id: string;
  /** Navn på arbeidspakken. */
  name: string;
  /** Regelverk oppgaven løfter. */
  frameworks: string[];
  /** Konkrete krav oppgaven løfter. */
  requirements: string[];
  scope: OpportunityScope;
  /** Tjeneste i katalogen som dekker oppgaven. */
  service: string;
  /** Anbefalt rekkefølge (1 = først). */
  order: number;
  /** Om forslaget er utarbeidet av Lara (KI). */
  aiSuggested: boolean;
  /** Grov innsats i timer — brukes kun som utgangspunkt i tilbudsutkast. */
  estimateHours: number;
}

export interface OpportunityCustomer {
  id: string;
  name: string;
  industry: string;
  /** Foreslåtte regelverk fra offentlig register — alltid merket som forslag. */
  suggestedFrameworks: string[];
  activatedFrameworks: string[];
  activatedProducts: string[];
  /** Om kunden selv har overtatt Trust-profilen. */
  profileTakenOver: boolean;
  tasks: OpportunityTask[];
}

function t(
  id: string,
  name: string,
  frameworks: string[],
  requirements: string[],
  scope: OpportunityScope,
  service: string,
  order: number,
  aiSuggested: boolean,
  estimateHours: number,
): OpportunityTask {
  return { id, name, frameworks, requirements, scope, service, order, aiSuggested, estimateHours };
}

export const OPPORTUNITY_CUSTOMERS: OpportunityCustomer[] = [
  {
    id: "bygg-as",
    name: "Bygg AS",
    industry: "Bygg og anlegg",
    suggestedFrameworks: ["GDPR", "NIS2"],
    activatedFrameworks: [],
    activatedProducts: [],
    profileTakenOver: false,
    tasks: [
      t("bygg-1", "Kartlegge behandlinger av personopplysninger", ["GDPR"], ["Art. 30 Protokoll over behandlinger"], "middels", "Behandlingsprotokoll", 1, true, 16),
      t("bygg-2", "Etablere databehandleravtaler med leverandører", ["GDPR"], ["Art. 28 Databehandler"], "middels", "DPA-pakke", 2, true, 12),
      t("bygg-3", "Innføre rutine for avvikshåndtering", ["GDPR", "NIS2"], ["Art. 33 Avviksvarsling", "NIS2 art. 23 Rapportering"], "liten", "Avviksrutine", 3, false, 8),
      t("bygg-4", "Risikovurdering av kritiske systemer", ["NIS2"], ["NIS2 art. 21 Risikostyring"], "stor", "Risikovurdering", 4, true, 28),
      t("bygg-5", "Sikkerhetsopplæring for ansatte", ["NIS2"], ["NIS2 art. 21 Opplæring"], "liten", "Sikkerhetsopplæring", 5, false, 6),
      t("bygg-6", "Beredskapsplan for driftsavbrudd", ["NIS2"], ["NIS2 art. 21 Kontinuitet"], "middels", "Beredskapsplan", 6, true, 18),
    ],
  },
  {
    id: "nordhelse",
    name: "Nordhelse Klinikk",
    industry: "Helse",
    suggestedFrameworks: ["GDPR", "Normen"],
    activatedFrameworks: ["GDPR"],
    activatedProducts: ["Mynder Core"],
    profileTakenOver: true,
    tasks: [
      t("nh-1", "Oppdatere protokoll for helseopplysninger", ["GDPR"], ["Art. 30 Protokoll", "Art. 9 Særlige kategorier"], "middels", "Behandlingsprotokoll", 1, true, 14),
      t("nh-2", "Gjennomføre personvernkonsekvensvurdering", ["GDPR"], ["Art. 35 DPIA"], "stor", "DPIA-leveranse", 2, true, 30),
      t("nh-3", "Tilgangsstyring i journalsystem", ["Normen"], ["Normen kap. 5 Tilgangsstyring"], "middels", "Tilgangsgjennomgang", 3, false, 16),
      t("nh-4", "Årlig gjennomgang av databehandlere", ["GDPR"], ["Art. 28 Databehandler"], "liten", "Leverandøroppfølging", 4, false, 8),
    ],
  },
  {
    id: "fjordbank",
    name: "Fjordbank",
    industry: "Finans",
    suggestedFrameworks: ["DORA", "GDPR", "NIS2"],
    activatedFrameworks: ["GDPR"],
    activatedProducts: ["Mynder Core", "Leverandørmodul"],
    profileTakenOver: true,
    tasks: [
      t("fb-1", "Kartlegge IKT-leverandører og kritikalitet", ["DORA"], ["DORA art. 28 Tredjepartsrisiko"], "stor", "Leverandørkartlegging", 1, true, 32),
      t("fb-2", "Etablere testregime for IKT-motstandsdyktighet", ["DORA"], ["DORA art. 24 Testing"], "stor", "Testprogram", 2, true, 36),
      t("fb-3", "Rutine for hendelsesrapportering", ["DORA", "NIS2"], ["DORA art. 19 Rapportering"], "middels", "Avviksrutine", 3, false, 14),
      t("fb-4", "Oppdatere styringsdokumentasjon", ["DORA"], ["DORA art. 5 Styring"], "middels", "Styringsdokumentasjon", 4, true, 18),
      t("fb-5", "Exit-strategier for kritiske leverandører", ["DORA"], ["DORA art. 28 Exit"], "middels", "Leverandøroppfølging", 5, true, 16),
    ],
  },
  {
    id: "kraftverk-vest",
    name: "Kraftverk Vest",
    industry: "Energi",
    suggestedFrameworks: ["NIS2", "ISO 27001"],
    activatedFrameworks: ["NIS2"],
    activatedProducts: ["Mynder Core"],
    profileTakenOver: false,
    tasks: [
      t("kv-1", "Etablere ISMS-rammeverk", ["ISO 27001"], ["ISO 27001 kap. 4-6"], "stor", "ISO-forberedelse", 1, true, 40),
      t("kv-2", "Klassifisere informasjonsverdier", ["ISO 27001"], ["A.5.9 Fortegnelse over verdier"], "middels", "Verdikartlegging", 2, true, 18),
      t("kv-3", "Øvelse på hendelseshåndtering", ["NIS2"], ["NIS2 art. 21 Hendelseshåndtering"], "liten", "Beredskapsøvelse", 3, false, 8),
      t("kv-4", "Leverandørsikkerhet i innkjøp", ["NIS2"], ["NIS2 art. 21 Forsyningskjede"], "middels", "Leverandøroppfølging", 4, true, 14),
    ],
  },
  {
    id: "skolebygg",
    name: "Skolebygg Kommune IKS",
    industry: "Offentlig",
    suggestedFrameworks: ["GDPR", "NIS2", "WCAG"],
    activatedFrameworks: ["GDPR"],
    activatedProducts: ["Mynder Core"],
    profileTakenOver: false,
    tasks: [
      t("sk-1", "Oppdatere behandlingsprotokoll for elevdata", ["GDPR"], ["Art. 30 Protokoll"], "middels", "Behandlingsprotokoll", 1, true, 14),
      t("sk-2", "Tilgjengelighetsgjennomgang av nettløsninger", ["WCAG"], ["WCAG 2.1 AA"], "middels", "Universell utforming", 2, true, 20),
      t("sk-3", "Rutine for informasjon til foresatte", ["GDPR"], ["Art. 13 Informasjonsplikt"], "liten", "Personvernrutiner", 3, false, 6),
      t("sk-4", "Sikkerhetskopiering og gjenoppretting", ["NIS2"], ["NIS2 art. 21 Sikkerhetskopi"], "middels", "Driftsikkerhet", 4, true, 12),
    ],
  },
  {
    id: "logistikk-nord",
    name: "Logistikk Nord",
    industry: "Transport",
    suggestedFrameworks: ["NIS2", "GDPR"],
    activatedFrameworks: [],
    activatedProducts: [],
    profileTakenOver: false,
    tasks: [
      t("ln-1", "Grunnkartlegging av systemer", ["NIS2"], ["NIS2 art. 21 Risikostyring"], "middels", "Systemkartlegging", 1, true, 16),
      t("ln-2", "Personvernrutiner for sjåførdata", ["GDPR"], ["Art. 5 Prinsipper", "Art. 30 Protokoll"], "liten", "Personvernrutiner", 2, true, 8),
      t("ln-3", "Tilgangsstyring i flåtesystem", ["NIS2"], ["NIS2 art. 21 Tilgangskontroll"], "middels", "Tilgangsgjennomgang", 3, false, 12),
    ],
  },
  {
    id: "teknobygg",
    name: "TeknoBygg Entreprenør",
    industry: "Bygg og anlegg",
    suggestedFrameworks: ["GDPR"],
    activatedFrameworks: ["GDPR"],
    activatedProducts: ["Mynder Core"],
    profileTakenOver: true,
    tasks: [
      t("tb-1", "Databehandleravtaler for prosjektverktøy", ["GDPR"], ["Art. 28 Databehandler"], "liten", "DPA-pakke", 1, true, 8),
      t("tb-2", "Slettefrister for prosjektdata", ["GDPR"], ["Art. 5 Lagringsbegrensning"], "liten", "Personvernrutiner", 2, false, 6),
      t("tb-3", "Opplæring i personvern for prosjektledere", ["GDPR"], ["Art. 39 Opplæring"], "liten", "Sikkerhetsopplæring", 3, true, 6),
    ],
  },
  {
    id: "handelshus",
    name: "Handelshuset AS",
    industry: "Handel",
    suggestedFrameworks: ["GDPR", "PCI DSS"],
    activatedFrameworks: ["GDPR"],
    activatedProducts: ["Mynder Core"],
    profileTakenOver: true,
    tasks: [
      t("hh-1", "Gjennomgang av kundeklubb og samtykke", ["GDPR"], ["Art. 7 Samtykke"], "middels", "Personvernrutiner", 1, true, 12),
      t("hh-2", "Kartlegge betalingsflyt", ["PCI DSS"], ["PCI DSS krav 1-3"], "stor", "Betalingssikkerhet", 2, true, 26),
      t("hh-3", "Leverandørgjennomgang for nettbutikk", ["GDPR"], ["Art. 28 Databehandler"], "liten", "Leverandøroppfølging", 3, false, 8),
    ],
  },
  {
    id: "utdanningssenteret",
    name: "Utdanningssenteret",
    industry: "Utdanning",
    suggestedFrameworks: ["GDPR", "WCAG"],
    activatedFrameworks: [],
    activatedProducts: [],
    profileTakenOver: false,
    tasks: [
      t("us-1", "Behandlingsprotokoll for kursdeltakere", ["GDPR"], ["Art. 30 Protokoll"], "middels", "Behandlingsprotokoll", 1, true, 14),
      t("us-2", "Tilgjengelig læringsplattform", ["WCAG"], ["WCAG 2.1 AA"], "middels", "Universell utforming", 2, true, 18),
      t("us-3", "Rutine for innsynsforespørsler", ["GDPR"], ["Art. 15 Innsyn"], "liten", "Personvernrutiner", 3, false, 6),
    ],
  },
  {
    id: "medtek",
    name: "MedTek Solutions",
    industry: "Teknologi",
    suggestedFrameworks: ["ISO 27001", "GDPR", "AI Act"],
    activatedFrameworks: ["ISO 27001", "GDPR"],
    activatedProducts: ["Mynder Core", "Leverandørmodul"],
    profileTakenOver: true,
    tasks: [
      t("mt-1", "Forberede ISO 27001-sertifisering", ["ISO 27001"], ["ISO 27001 kap. 9 Evaluering"], "stor", "ISO-forberedelse", 1, true, 40),
      t("mt-2", "Kartlegge KI-systemer og risikoklasse", ["AI Act"], ["AI Act art. 6 Klassifisering"], "middels", "KI-kartlegging", 2, true, 20),
      t("mt-3", "Dokumentere sikkerhet i utviklingsløpet", ["ISO 27001"], ["A.8.25 Sikker utvikling"], "middels", "Utviklingssikkerhet", 3, false, 16),
    ],
  },
  {
    id: "vekstpartner",
    name: "Vekstpartner Rådgivning",
    industry: "Finans",
    suggestedFrameworks: ["GDPR"],
    activatedFrameworks: [],
    activatedProducts: [],
    profileTakenOver: false,
    tasks: [
      t("vp-1", "Grunnleggende personvernkartlegging", ["GDPR"], ["Art. 30 Protokoll", "Art. 13 Informasjonsplikt"], "middels", "Behandlingsprotokoll", 1, true, 14),
      t("vp-2", "Databehandleravtaler for skytjenester", ["GDPR"], ["Art. 28 Databehandler"], "liten", "DPA-pakke", 2, true, 8),
      t("vp-3", "Rutine for avvikshåndtering", ["GDPR"], ["Art. 33 Avviksvarsling"], "liten", "Avviksrutine", 3, false, 6),
    ],
  },
];

export interface DistributionSlice {
  label: string;
  taskCount: number;
  customerCount: number;
}

export function totalTaskCount(customers = OPPORTUNITY_CUSTOMERS): number {
  return customers.reduce((sum, c) => sum + c.tasks.length, 0);
}

export function distributionByIndustry(customers = OPPORTUNITY_CUSTOMERS): DistributionSlice[] {
  const map = new Map<string, DistributionSlice>();
  for (const c of customers) {
    const cur = map.get(c.industry) ?? { label: c.industry, taskCount: 0, customerCount: 0 };
    cur.taskCount += c.tasks.length;
    cur.customerCount += 1;
    map.set(c.industry, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.taskCount - a.taskCount);
}

export function distributionByFramework(customers = OPPORTUNITY_CUSTOMERS): DistributionSlice[] {
  const map = new Map<string, { label: string; taskCount: number; customers: Set<string> }>();
  for (const c of customers) {
    for (const task of c.tasks) {
      for (const fw of task.frameworks) {
        const cur = map.get(fw) ?? { label: fw, taskCount: 0, customers: new Set<string>() };
        cur.taskCount += 1;
        cur.customers.add(c.id);
        map.set(fw, cur);
      }
    }
  }
  return Array.from(map.values())
    .map((v) => ({ label: v.label, taskCount: v.taskCount, customerCount: v.customers.size }))
    .sort((a, b) => b.taskCount - a.taskCount);
}

/** Én forklarende linje per kunde, uten beløp. */
export function customerSummaryLine(c: OpportunityCustomer): string {
  const suggested = c.suggestedFrameworks.join(" og ");
  const activated =
    c.activatedFrameworks.length === 0
      ? "ingen aktivert"
      : `${c.activatedFrameworks.join(" og ")} aktivert`;
  return `${c.name} · ${c.industry.toLowerCase()} · ${suggested} foreslått, ${activated} · ${c.tasks.length} mulige oppgaver`;
}

export function topCustomers(limit = 5, customers = OPPORTUNITY_CUSTOMERS): OpportunityCustomer[] {
  return [...customers].sort((a, b) => b.tasks.length - a.tasks.length).slice(0, limit);
}

export function allIndustries(customers = OPPORTUNITY_CUSTOMERS): string[] {
  return Array.from(new Set(customers.map((c) => c.industry))).sort();
}

export function allFrameworks(customers = OPPORTUNITY_CUSTOMERS): string[] {
  const set = new Set<string>();
  for (const c of customers) {
    c.suggestedFrameworks.forEach((f) => set.add(f));
    c.tasks.forEach((t) => t.frameworks.forEach((f) => set.add(f)));
  }
  return Array.from(set).sort();
}

export function servicesForCustomer(c: OpportunityCustomer): string[] {
  return Array.from(new Set(c.tasks.map((t) => t.service)));
}

export function sortedTasks(c: OpportunityCustomer): OpportunityTask[] {
  return [...c.tasks].sort((a, b) => a.order - b.order);
}
