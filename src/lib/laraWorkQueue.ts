// Laras arbeidskø — prototypedata for det agentiske partner-dashbordet.
// Enheten for arbeid er ferdig utført arbeid fra Lara som mennesket godkjenner,
// ikke en oppgave mennesket må starte selv.

export type LaraQueueState = "pending" | "auto-done" | "blocked";

export type LaraAutonomy = "automatic" | "assisted" | "manual";

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
  /** Kort begrunnelse: hvorfor Lara gjorde dette. */
  rationale: string;
  /** Datakilde begrunnelsen bygger på. */
  source: string;
  state: LaraQueueState;
  autonomy: LaraAutonomy;
  /** Vises for auto-done: når Lara utførte det. */
  doneAt?: string;
  /** Vises for blocked: hva som mangler for at Lara kan fortsette. */
  blocker?: string;
};

export const LARA_KIND_LABELS: Record<LaraQueueKind, { nb: string; en: string }> = {
  activate: { nb: "Aktivering", en: "Activation" },
  evidence: { nb: "Bevis", en: "Evidence" },
  report: { nb: "Rapport", en: "Report" },
  audit: { nb: "Revisjon", en: "Audit" },
  vendor_mapping: { nb: "Leverandørkartlegging", en: "Vendor mapping" },
};

export const LARA_AUTONOMY_LABELS: Record<LaraAutonomy, { nb: string; en: string; hint: string }> = {
  automatic: {
    nb: "Automatisk",
    en: "Automatic",
    hint: "Lara utfører rutinearbeid selv og logger det.",
  },
  assisted: {
    nb: "Assistert",
    en: "Assisted",
    hint: "Lara gjør jobben ferdig, du godkjenner før noe iverksettes.",
  },
  manual: {
    nb: "Manuell",
    en: "Manual",
    hint: "Lara foreslår kun — du utfører selv.",
  },
};

export const LARA_WORK_QUEUE: LaraQueueItem[] = [
  {
    id: "q-bergen-evidence",
    customer: "Bergen Energi AS",
    kind: "evidence",
    action: "ISO 27001-sertifikat analysert og matchet mot 7 krav",
    rationale:
      "Dokumentet er utstedt av uavhengig tredjepart og dekker kravene i styring og tilgangskontroll.",
    source: "Dokumentanalyse · ISO 27001",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-nordvik-activate",
    customer: "Nordvik Helse",
    kind: "activate",
    action: "Aktivering av Leverandørmodulen (nivå 20) er klargjort",
    rationale:
      "14 leverandører er kartlagt — over grensen på 5 i gratisnivået. Vilkår er forhåndsutfylt.",
    source: "Leverandørmodul · kapasitet",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-nordvik-vendors",
    customer: "Nordvik Helse",
    kind: "vendor_mapping",
    action: "14 leverandører kartlagt og kategorisert",
    rationale:
      "Offentlige kilder og fakturadata er brukt til å utlede GDPR-rolle og kritikalitet per leverandør.",
    source: "Leverandørkartlegging",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-fjord-report",
    customer: "Fjord Logistikk",
    kind: "report",
    action: "Modenhetsrapport Q3 er skrevet ferdig",
    rationale: "Rapporten oppsummerer utvikling på fem kontrollområder siden forrige kvartal.",
    source: "Modenhetsmåling",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-vestland-audit",
    customer: "Vestland Kraft",
    kind: "audit",
    action: "Internrevisjon av tilgangsstyring gjennomført",
    rationale: "Funn er dokumentert og koblet til kontrollområdet identitet og tilgang.",
    source: "Internrevisjon",
    state: "pending",
    autonomy: "assisted",
  },
  {
    id: "q-auto-maturity",
    customer: "12 kunder",
    kind: "report",
    action: "Modenhetsscorer oppdatert",
    rationale: "Nye dokumenter og svar er vurdert mot kontrollområdene.",
    source: "Nattlig kjøring",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
  },
  {
    id: "q-auto-privacy",
    customer: "4 kunder",
    kind: "evidence",
    action: "Personvernerklæringer hentet og analysert",
    rationale: "Offentlige kilder ble kartlagt for nye kunder uten grunnlag.",
    source: "Offentlig kartlegging",
    state: "auto-done",
    autonomy: "automatic",
    doneAt: "i natt",
  },
  {
    id: "q-blocked-vestland",
    customer: "Vestland Kraft",
    kind: "vendor_mapping",
    action: "Kartlegging av systemer er satt på vent",
    rationale: "Lara kommer ikke videre uten tilgang til kundens systemoversikt.",
    source: "Systemkartlegging",
    state: "blocked",
    autonomy: "assisted",
    blocker: "Mangler tilgang til Microsoft-integrasjonen",
  },
];

export function formatNok(value: number): string {
  return `${value.toLocaleString("nb-NO")} kr`;
}
