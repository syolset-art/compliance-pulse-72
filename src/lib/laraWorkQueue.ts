// Laras arbeidskø — prototypedata for det agentiske partner-dashbordet.
// Enheten for arbeid er ferdig utført arbeid fra Lara som mennesket godkjenner,
// ikke en oppgave mennesket må starte selv.

export type LaraQueueState = "pending" | "auto-done" | "blocked" | "revising";

export type LaraAutonomy = "automatic" | "assisted" | "manual";

export type LaraQueueRisk = "critical" | "medium" | "low";

export type LaraQueueKind =
  | "activate"
  | "evidence"
  | "report"
  | "audit"
  | "vendor_mapping";

export type LaraQueueItem = {
  id: string;
  customer: string;
  /** Type arbeid Lara har gjort ferdig. */
  kind: LaraQueueKind;
  /** Hva Lara har gjort — formulert som utført arbeid. */
  action: string;
  /** English variant of `action`. */
  actionEn: string;
  /** Kort begrunnelse: hvorfor Lara gjorde dette. */
  rationale: string;
  /** English variant of `rationale`. */
  rationaleEn: string;
  /** Datakilde begrunnelsen bygger på. */
  source: string;
  /** English variant of `source`. */
  sourceEn: string;
  state: LaraQueueState;
  autonomy: LaraAutonomy;
  /** Hvor inngripende handlingen er for kunden. */
  risk: LaraQueueRisk;
  /** Kort grunn til risikonivået. */
  riskReason: string;
  riskReasonEn: string;
  /** Hva som faktisk endres når arbeidet godkjennes. */
  impact: string[];
  impactEn: string[];
  /** Vises for auto-done: når Lara utførte det. */
  doneAt?: string;
  /** English variant of `doneAt`. */
  doneAtEn?: string;
  /** Vises for blocked: hva som mangler for at Lara kan fortsette. */
  blocker?: string;
  /** English variant of `blocker`. */
  blockerEn?: string;
};

export const LARA_RISK_LABELS: Record<LaraQueueRisk, { nb: string; en: string }> = {
  critical: { nb: "Kritisk", en: "Critical" },
  medium: { nb: "Middels", en: "Medium" },
  low: { nb: "Lav", en: "Low" },
};

export const LARA_KIND_LABELS: Record<LaraQueueKind, { nb: string; en: string }> = {
  activate: { nb: "Aktivering", en: "Activation" },
  evidence: { nb: "Bevis", en: "Evidence" },
  report: { nb: "Rapport", en: "Report" },
  audit: { nb: "Revisjon", en: "Audit" },
  vendor_mapping: { nb: "Leverandørkartlegging", en: "Vendor mapping" },
};

export const LARA_AUTONOMY_LABELS: Record<LaraAutonomy, { nb: string; en: string; hint: string; hintEn: string }> = {
  automatic: {
    nb: "Automatisk",
    en: "Automatic",
    hint: "Lara utfører rutinearbeid selv og logger det.",
    hintEn: "Lara performs routine work herself and logs it.",
  },
  assisted: {
    nb: "Assistert",
    en: "Assisted",
    hint: "Lara gjør jobben ferdig, du godkjenner før noe iverksettes.",
    hintEn: "Lara finishes the work, you approve before anything is put into effect.",
  },
  manual: {
    nb: "Manuell",
    en: "Manual",
    hint: "Lara foreslår kun — du utfører selv.",
    hintEn: "Lara only suggests — you carry it out yourself.",
  },
};

export const LARA_WORK_QUEUE: LaraQueueItem[] = [
  {
    id: "q-bergen-evidence",
    customer: "Bergen Energi AS",
    kind: "evidence",
    action: "ISO 27001-sertifikat analysert og matchet mot 7 krav",
    actionEn: "ISO 27001 certificate analysed and matched against 7 requirements",
    rationale:
      "Dokumentet er utstedt av uavhengig tredjepart og dekker kravene i styring og tilgangskontroll.",
    rationaleEn:
      "The document is issued by an independent third party and covers the requirements in governance and access control.",
    source: "Dokumentanalyse · ISO 27001",
    sourceEn: "Document analysis · ISO 27001",
    state: "pending",
    autonomy: "assisted",
    risk: "medium",
    riskReason: "Endrer dokumentert etterlevelse",
    riskReasonEn: "Changes documented compliance",
    impact: ["7 krav settes som dekket i ISO 27001", "Bevisnivå heves til «Verifisert»", "Modenhet i styring og tilgang oppdateres"],
    impactEn: ["7 requirements are marked as covered in ISO 27001", "Evidence level raised to «Verified»", "Maturity in governance and access is updated"],
  },
  {
    id: "q-nordvik-activate",
    customer: "Nordvik Helse",
    kind: "activate",
    action: "Aktivering av Leverandørmodulen (nivå 20) er klargjort",
    actionEn: "Activation of the Vendor module (tier 20) is ready",
    rationale:
      "14 leverandører er kartlagt — over grensen på 5 i gratisnivået. Vilkår er forhåndsutfylt.",
    rationaleEn:
      "14 vendors have been mapped — above the limit of 5 on the free tier. Terms are pre-filled.",
    source: "Leverandørmodul · kapasitet",
    sourceEn: "Vendor module · capacity",
    state: "pending",
    autonomy: "assisted",
    risk: "critical",
    riskReason: "Aktiverer betalt produkt og binder kunden til vilkår",
    riskReasonEn: "Activates a paid product and binds the customer to terms",
    impact: ["Leverandørmodulen nivå 20 aktiveres umiddelbart", "Kunden faktureres på neste faktura", "Vilkår registreres på kundens organisasjon"],
    impactEn: ["Vendor module tier 20 is activated immediately", "The customer is billed on the next invoice", "Terms are recorded on the customer organisation"],
  },
  {
    id: "q-nordvik-vendors",
    customer: "Nordvik Helse",
    kind: "vendor_mapping",
    action: "14 leverandører kartlagt og kategorisert",
    actionEn: "14 vendors mapped and categorised",
    rationale:
      "Offentlige kilder og fakturadata er brukt til å utlede GDPR-rolle og kritikalitet per leverandør.",
    rationaleEn:
      "Public sources and invoice data were used to derive GDPR role and criticality per vendor.",
    source: "Leverandørkartlegging",
    sourceEn: "Vendor mapping",
    state: "pending",
    autonomy: "assisted",
    risk: "medium",
    riskReason: "Oppretter data på kundens profil",
    riskReasonEn: "Creates data on the customer profile",
    impact: ["14 leverandører opprettes i registeret", "GDPR-rolle og kritikalitet settes per leverandør", "Kapasitetsgrensen for modulen påvirkes"],
    impactEn: ["14 vendors are created in the registry", "GDPR role and criticality are set per vendor", "The module capacity limit is affected"],
  },
  {
    id: "q-fjord-report",
    customer: "Fjord Logistikk",
    kind: "report",
    action: "Modenhetsrapport Q3 er skrevet ferdig",
    actionEn: "Q3 maturity report has been completed",
    rationale: "Rapporten oppsummerer utvikling på fem kontrollområder siden forrige kvartal.",
    rationaleEn: "The report summarises progress across five control areas since last quarter.",
    source: "Modenhetsmåling",
    sourceEn: "Maturity assessment",
    state: "pending",
    autonomy: "assisted",
    risk: "low",
    riskReason: "Intern rapport, ingen ekstern effekt",
    riskReasonEn: "Internal report, no external effect",
    impact: ["Rapporten publiseres på kundens profil", "Ingen krav eller status endres"],
    impactEn: ["The report is published on the customer profile", "No requirements or statuses change"],
  },
  {
    id: "q-vestland-audit",
    customer: "Vestland Kraft",
    kind: "audit",
    action: "Internrevisjon av tilgangsstyring gjennomført",
    actionEn: "Internal audit of access management completed",
    rationale: "Funn er dokumentert og koblet til kontrollområdet identitet og tilgang.",
    rationaleEn: "Findings are documented and linked to the identity and access control area.",
    source: "Internrevisjon",
    sourceEn: "Internal audit",
    state: "pending",
    autonomy: "assisted",
    risk: "critical",
    riskReason: "Revisjonsfunn påvirker etterlevelsesstatus",
    riskReasonEn: "Audit findings affect compliance status",
    impact: ["Funn kobles til kontrollområdet identitet og tilgang", "Tre krav får endret status", "Avvik opprettes som aktivitet hos kunden"],
    impactEn: ["Findings are linked to the identity and access control area", "Three requirements change status", "Deviations are created as activities for the customer"],
  },
  {
    id: "q-auto-maturity",
    customer: "12 kunder",
    kind: "report",
    action: "Modenhetsscorer oppdatert",
    actionEn: "Maturity scores updated",
    rationale: "Nye dokumenter og svar er vurdert mot kontrollområdene.",
    rationaleEn: "New documents and answers have been assessed against the control areas.",
    source: "Nattlig kjøring",
    sourceEn: "Overnight run",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
    doneAtEn: "last night",
    risk: "low",
    riskReason: "Rutinemessig oppdatering",
    riskReasonEn: "Routine update",
    impact: ["Modenhetsscorer oppdateres for 12 kunder"],
    impactEn: ["Maturity scores updated for 12 customers"],
  },
  {
    id: "q-auto-privacy",
    customer: "4 kunder",
    kind: "evidence",
    action: "Personvernerklæringer hentet og analysert",
    actionEn: "Privacy policies fetched and analysed",
    rationale: "Offentlige kilder ble kartlagt for nye kunder uten grunnlag.",
    rationaleEn: "Public sources were mapped for new customers without a baseline.",
    source: "Offentlig kartlegging",
    sourceEn: "Public mapping",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
    doneAtEn: "last night",
    risk: "low",
    riskReason: "Kun innhenting av offentlig informasjon",
    riskReasonEn: "Public information gathering only",
    impact: ["Personvernerklæringer lagres som grunnlag"],
    impactEn: ["Privacy policies stored as baseline"],
  },
  {
    id: "q-blocked-vestland",
    customer: "Vestland Kraft",
    kind: "vendor_mapping",
    action: "Kartlegging av systemer er satt på vent",
    actionEn: "Mapping of systems has been put on hold",
    rationale: "Lara kommer ikke videre uten tilgang til kundens systemoversikt.",
    rationaleEn: "Lara cannot proceed without access to the customer's system overview.",
    source: "Systemkartlegging",
    sourceEn: "System mapping",
    state: "blocked",
    autonomy: "assisted",
    blocker: "Mangler tilgang til Microsoft-integrasjonen",
    blockerEn: "Missing access to the Microsoft integration",
    risk: "medium",
    riskReason: "Venter på tilgang",
    riskReasonEn: "Waiting for access",
    impact: ["Ingen endringer før blokkeringen er løst"],
    impactEn: ["No changes until the blocker is resolved"],
  },
];

export function formatNok(value: number): string {
  return `${value.toLocaleString("nb-NO")} kr`;
}
